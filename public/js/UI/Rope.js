/**
* Конструктор визуального таймера.  
* Использует полукруглое поле карт игрока в качестве источника информации о своем размере и позиции. 
* После создания поля игрока нужно вызвать {@link UI.Rope#initialize|initialize}. После удаления поля - {@link UI.Rope#deinitialize|deinitialize}.  
* Запускается при помощи метода {@link UI.Rope#start|start}, останавливается методом {@link UI.Rope#stop|stop}.  
* Таймер начинает отображаться только когда осталось отсчитывать {@link UI.Rope#durationShow|durationShow} миллисекунд.
* Анимирует корректировку позиции при изменении отсчитываемого времени.
* Обновляется группой, в которую добавлен.
* @class
* @extends {Phaser.Sprite}
* @param {string} [name='rope'] имя таймера
*/
UI.Rope = function(name){

	/**
	* Bitmap data таймера.
	* @type {Phaser.BitmapData}
	*/
	this.bitmapData = game.make.bitmapData();

	Phaser.Sprite.call(this, game, 0, 0, this.bitmapData);

	/**
	* Прозрачность таймера к которой он будет возвращаться.
	* @type {Number}
	*/
	this.defaultAlpha = 0.7;

	this.alpha = this.defaultAlpha;

	/**
	* Имя таймера.
	* @default 'rope'
	* @type {String}
	*/
	this.name = name || 'rope';

	/**
	* Поле игрока, из которого таймер берет размеры и позицию.
	* @type {PlayerField}
	*/
	this.field = null;

	/**
	* Ширина линии дуги таймера.
	* @type {Number}
	*/
	this.lineWidth = 8;

	/**
	* Граница дуги таймера справа.
	* @type {Number}
	*/
	this.angleEnd = 0;
	/**
	* Граница дуги таймера слева.
	* @type {Number}
	*/
	this.angleStart = 0;

	/**
	* Центр окружности дуги таймера `{x, y}`.
	* @type {object}
	*/
	this.center = null;

	/**
	* Высота canvas дуги таймера.
	* @type {Number}
	*/
	this.bitmapHeight = 0;

	/**
	* Радиус дуги таймера.
	* @type {Number}
	*/
	this.radius = 0;

	/**
	* Доля пройденного пути от `endAngle` до `startAngle`.
	* @type {Number}
	*/
	this.progress = 1;

	/**
	* Время запуска таймера.
	* @type {Number}
	*/
	this.startTime = 0;

	/**
	* Сохраненное время окончания таймера.
	* @type {Number}
	*/
	this.savedEndTime = 0;

	/**
	* Время, которое отсчитывает таймер.
	* @type {Number}
	*/
	this.duration = 0;

	/**
	* Запущен ли таймер.
	* @type {Boolean}
	*/
	this.running = false;

	/**
	* Идет анимимация остановки.
	* @type {Boolean}
	*/
	this.clearing = false;

	/**
	* Максимальная длительность таймера.
	* @type {Number}
	*/
	this.durationShow = 15000;

	/**
	* Время, при достижении которого таймер меняет цвет на `colorWarn`.
	* @type {Number}
	*/
	this.durationWarn = 5000;

	/**
	* Статус и направление корректировки позиции таймера.
	* @type {number}
	*/
	this.adjustingDirection = UI.Rope.NOT_STARTED;

	/**
	* Скорость радиан/мс при корректировке позиции таймера.
	* @type {Number}
	*/
	this.adjustingSpeed = 0.0025;

	/**
	* Обычный цвет таймера.
	* @type {number}
	*/
	this.colorNormal = ui.colors.orange;
	/**
	* Цвет таймера, когда осталось меньше `durationWarn`.
	* @type {number}
	*/
	this.colorWarn = ui.colors.red;
	/**
	* Последний установленный цвет.
	* @type {number}
	*/
	this.lastColor = null;

	/**
	* Отменяет переключение между цветами в пользу использования `lastColor`.
	* @type {Boolean}
	*/
	this.useLastColor = false;

	/**
	* Твин мигания таймера.
	* @type {Phaser.Tween}
	*/
	this.blinker = null;
};

extend(UI.Rope, Phaser.Sprite);

/**
* Инициализирует текстуру и позицию таймера со свойствами поля игрока.
* @param  {PlayerField} field поле игрока
*/
UI.Rope.prototype.initialize = function(field){

	if(!(field instanceof Field.PlayerField)){
		console.error('Rope: field must be an instance of PlayerField');
		return;
	}

	this.field = field;

	var lineWidth = this.lineWidth;
	var offset = lineWidth/2 + field.style.border;
	var center = {
		x: game.screenWidth/2,
		y: field.circleCenter.y + offset
	};
	var radius = center.y - offset;
	var height = game.screenHeight - field.y + offset;

	var y = center.y - height - offset;
	var x = Math.sqrt(radius*radius - y*y);

	// Окружность поля игрока выходит за пределы экрана по горизонтали
	if(center.x - x < 0){
		x = center.x;
		y = Math.sqrt(radius*radius - x*x);
	}

	this.angleEnd = -Math.atan2(y, x);
	this.angleStart = -Math.atan2(y, -x);
	this.center = center;
	this.bitmapHeight = height;
	this.radius = radius;

	this.x = 0;
	this.y = field.y - offset + lineWidth/2;
};

/**
* Останавливает таймер и убирает ссылку на поле игрока.
*/
UI.Rope.prototype.deinitialize = function(){
	this.stop(true, true);
	this.field = null;
};

/**
* Запускает таймер.
* @param {number}  duration     время таймера
* @param {boolean} useLastColor будет использоваться последний заданный цвет таймера
*                               и цвет не будет меняться до истечения `duration`
*/
UI.Rope.prototype.start = function(duration, useLastColor){
	if(!duration || isNaN(duration)){
		return;
	}

	var now = Date.now();

	// Прерываем таймер и находим задержку (разницу между duration и durationShow)
	var delay = this._abort(duration);

	// Сохраняем запуск на потом
	if(delay == Infinity){
		this.savedEndTime = now + duration;
		return;
	}

	this.running = true;

	this.startTime = now + delay; 
	this.duration = duration - delay;

	this.useLastColor = useLastColor || false;
	if(!useLastColor){
		this.lastColor = this.colorNormal;
	}
};

/**
* Останавливает таймер и опционально очищает прогресс.
* @param {boolean} [clearProgress=true] нужно ли очистить прогресс
* @param {boolean} [hard]               останавливает или предотвращает анимацию очищения прогресса 
*/
UI.Rope.prototype.stop = function(clearProgress, hard){
	if(!this.running || this.clearing && !hard){
		return;
	}
	var timeLeft = this.startTime + this.duration - Date.now();
	this.adjustingDirection = UI.Rope.NOT_STARTED;
	this.running = false;
	this.startTime = 0;
	this.duration = 0;
	this.useLastColor = false;
	this.bitmapData.clear();
	this.bitmapData.update();
	this.visible = false;
	this.savedEndTime = 0;
	this.clearing = false;
	if(this.blinker){
		this.blinker.stop();
		this.blinker = null;
	}
	this.alpha = this.defaultAlpha;
	if(clearProgress || clearProgress === undefined){
		this._clearProgress(timeLeft, hard);
	}
};

/**
* Обновляет прогресс таймера.
*/
UI.Rope.prototype.update = function(){

	// Останавливаем таймер, если он был деинициализирован
	if(!this.field){
		if(this.running){
			this.stop(true, true);
		}
		return;
	}

	var now = Date.now();

	// Запускаем таймер
	if(!this.running && this.startTime && this.startTime <= now){
		this.running = true;
	}
	else if(!this.running){
		return;
	}

	var endTime = this.startTime + this.duration;
	var timeLeft = endTime - now;

	// Пробуем завершить
	if(this._tryFinishing(timeLeft, this.savedEndTime - now)){
		return;
	}

	// Последний цвет таймера
	var color = this.lastColor;

	// Мы показываем таймер, только когда оставшееся время меньше durationShow
	if(timeLeft <= this.durationShow){

		if(!this.visible){
			this.visible = true;
		}

		// Раситываем и запоминаем пройденный таймером угол
		var progress = this._calculateProgress(timeLeft);

		// Переключаем цвет таймера на предупреждающий в последние durationWarn миллисекунд,
		// если не было указано, что нужно использовать последний установленный цвет
		if(!this.useLastColor && color != this.colorWarn && timeLeft <= this.durationWarn){
			color = this.lastColor = this.colorWarn;

			// Включаем мигание таймера
			if(!this.blinker){
				this.alpha = 1;
				this.blinker = game.add.tween(ui.rope).to({alpha: 0.2}, 300, Phaser.Easing.Linear.None, true, 0, -1, true);
			}
		}

		// Рисуем таймер
		this._draw(this.angleStart, this.angleEnd + progress, color);

		return;
	}
	// Прячем таймер, пока оставшееся время не станет меньше durationShow
	// В данное время до этого дойдет только если startTime был установлен вручную
	// (не через start)
	if(this.visible){
		this.visible = false;
	}
};

/**
* Обновляет позицию таймера.
*/
UI.Rope.prototype.updatePosition = function(){
	if(this.field){
		this.initialize(this.field);
	}
};

/**
* Рисует указанную окружность таймера слева направо.
* @param {number} angleStart начальный угол
* @param {number} angleEnd   конечный угол
* @param {number} color      цвет таймер
*/
UI.Rope.prototype._draw = function(angleStart, angleEnd, color){
	var circle = this.bitmapData;
	var center = this.center;
	var ctx = circle.ctx;
	circle.clear();		
	circle.resize(game.screenWidth, this.bitmapHeight);
	ctx.beginPath();
	ctx.arc(center.x, center.y, this.radius, angleStart, angleEnd);
	ctx.lineWidth = this.lineWidth;
	ctx.strokeStyle = numberToHexColor(color);
	ctx.lineCap = 'round';
	ctx.stroke();
	circle.update();
};

/**
* Останавливает таймер перед запуском.
* @param {number} duration новая длительность таймера
*
* @return {number} Возвращает время, которое таймер не будет показан,
*                  или Infinity, если нужно сохранить длительность таймера на будущее,
*                  т.к. проигрывается анимация очищения прогресса.
*/
UI.Rope.prototype._abort = function(duration){
	var delay = Math.max(duration - this.durationShow, 0);
	
	// Таймер не запущен, значит можно его просто запустить
	if(!this.running){
		return delay;
	}

	// Если duration больше durationShow - таймер не будет показан в течении delay
	if(delay > 0){
		// Уже есть сохраненное время или идет очищение,
		// сообщаем, что нужно перезаписать сохраненное время
		if(this.savedEndTime || this.clearing){
			return Infinity;
		}

		// Останавливаем таймер
		this.clearing = false;
		this.stop();

		// Идет анимация завершения, нужно сохранить время на будущее
		if(this.running){
			return Infinity;
		}
	}
	// иначе останавливаем таймер с сохранением прогресса
	else{
		this.clearing = false;
		this.stop(false);
	}
	// Сообщаем, что можно запустить таймер по истечении delay
	return delay;
};

/**
* Завершает таймер, если вышло время или пришло время показывать сохраненное время,
* и запускает его снова, если есть сохраненное время. 
* @param {number} timeLeft      оставшееся время
* @param {number} savedDuration сохраненная длительность
*
* @return {boolean} Был ли завершен или перезапущен таймер.
*/
UI.Rope.prototype._tryFinishing = function(timeLeft, savedDuration){
	// Сохраненное время можно показывать
	if(savedDuration > 0 && savedDuration <= this.durationShow){
		this.start(savedDuration);
		this.update();
		return true;
	}

	// Время вышло
	if(timeLeft <= 0){
		this.stop(true, true);
		if(savedDuration > 0){
			this.start(savedDuration);
		}
		return true;
	}

	return false;
};

/**
* Таймер не двигается к текущей позиции.
* @const
* @type {Number}
*/
UI.Rope.NOT_STARTED = 0;
/**
* Таймер двигается к текущей позиции вперед.
* @const
* @type {Number}
*/
UI.Rope.FORWARD = 1;
/**
* Таймер двигается к текущей позиции назад.
* @const
* @type {Number}
*/
UI.Rope.BACKWARD = -1;
/**
* Таймер сдвинут к текущей позиции и отсчет начат.
* @const
* @type {Number}
*/
UI.Rope.STARTED = 42;

/**
* Считает и запоминает прогресс в процентах.
* @param {number} timeLeft оставшееся время, по которому расчитывается прогресс
*
* @return {number} Возвращает прогресс в радианах.
*/
UI.Rope.prototype._calculateProgress = function(timeLeft){

	var left = timeLeft/this.durationShow;
	var progress = (1 - left);
	var dif = this.angleStart - this.angleEnd;		
	var progressDif = this.progress - progress;
	var adjustingDirection = this.adjustingDirection;

	// Выясняем, в какую сторону нужно двигать таймер, чтобы дойти до текущей позиции
	if(adjustingDirection == UI.Rope.NOT_STARTED){
		if(Math.abs(progressDif) > 0.01){
			adjustingDirection = progressDif > 0 ? UI.Rope.BACKWARD : UI.Rope.FORWARD;
		}
		else{
			adjustingDirection = UI.Rope.STARTED;
		}
	}

	// Двигаем таймер к текущей позиции
	if(adjustingDirection != UI.Rope.STARTED){

		var newDif = this.adjustingSpeed*game.time.elapsed*adjustingDirection;
		var newProgress = this.progress + newDif;
		var newProgressDif = progress - newProgress;

		if(newProgressDif*adjustingDirection <= 0){
			adjustingDirection = UI.Rope.STARTED;
		}
		else{				
			progress = newProgress;				
		}
	}

	// Сохраняем статус корректировки позиции
	this.adjustingDirection = adjustingDirection;

	// Сохраняем прогресс в процентах
	this.progress = progress;

	// Возвращаем прогресс в радианах
	return dif*progress;
};

/**
* Отчищает прогресс, либо сразу, либо с анимацией.
* @param {number}  timeLeft сколько времени осталось в таймере
* @param {boolean} hard     прогресс будет очищен без анимации в любом случае
*/
UI.Rope.prototype._clearProgress = function(timeLeft, hard){
	var turnOffDuration = (1 - this.progress)/this.adjustingSpeed;
	if(hard || timeLeft < turnOffDuration || timeLeft > this.durationShow){
		this.progress = 1;
	}
	else{			
		this.running = false;
		this.start(turnOffDuration, true);
		this.clearing = true;
	}
};
