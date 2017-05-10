/**
* Конструктор карт  
* Три основных компонента: {@link Card#base}, {@link Card#sprite} и {@link Card#glow}.  
* Имеет методы для перемещения (с анимацией и без), установки значений,
* установки флагов, применения скинов. Передает информацию о курсоре
* присвоенному полю ({@link Field}) и контроллеру карт ({@link CardControl}).
* @class
* @param {object} options 		 - Опции, используемые при создании карты
* @param {string} options.id 	 - id карты
* @param {number} [options.x=game.screenWidth/2] 	 - позиция по горизонтали
* @param {number} [options.y=game.screenHeight+300] - позиция по вертикали
* @param {(number|null)} [options.suit=null]  - масть карты
* @param {number} [options.value=0] 		 - значение карты
* @param {number} [options.flipTime=150] - время переворота карты
* @param {object} [options.skin=skinManager.skin] - скин карты
* @param {string} [options.fieldId=null] - id поля, в которое будет добавлена карта
* @param {boolean} [options.debug=false] - вывод дебаг информации
*/


var Card = function (options) {

	//Options
	this.options = Card.getDefaultOptions();
	for(var o in options){
		if(options.hasOwnProperty(o))
			this.options[o] = options[o];
	}

	/**
	* Выводить ли дебаг информацию
	* @type {boolean}
	*/
	this.inDebugMode = this.options.debug;

	/**
	* Можно ли перетаскивать карту
	* @type {boolean}
	* @default false
	* @see  Card#setDraggability
	*/
	this.draggable = false;

	/**
	* Играбильна ли карта
	* @type {boolean}
	* @default false
	* @see  Card#setPlayability
	*/
	this.playable = false;

	/**
	* Говорит {@link Card#field}, что карту нужно поднять
	* @default false
	* @type {boolean}
	*/
	this.raised = false;

	/**
	* id карты
	* @type {string}
	*/
	this.id = this.options.id;

	/**
	* Поле карты
	* @default null
	* @type {Field}
	*/
	this.field = null;
	this.presetField(this.options.fieldId);

	/**
	* Спрайт карты
	* @type {Phaser.Sprite}
	*/
	this.sprite = game.add.sprite();
	this.sprite.inputEnabled = true;
	this.sprite.events.onInputDown.add(this._cursorDown, this);
	this.sprite.events.onInputUp.add(this._cursorUp, this);
	this.sprite.events.onInputOver.add(this._cursorOver, this);
	this.sprite.events.onInputOut.add(this._cursorOut, this);
	this.sprite.anchor.set(0.5, 0.5);

	/**
	* Свечение карты
	* @type {Phaser.Sprite}
	*/
	this.glow = game.add.sprite();
	this.glow.anchor.set(0.5, 0.5);
	this.glow.visible = false;

	/**
	* Твин увеличения яркости свечения карты
	* @type {Phaser.Tween}
	* @default null
	*/
	this.glowIncreaser = null;

	/**
	* Твин уменьшения яркости свечения карты
	* @type {Phaser.Tween}
	* @default null
	*/
	this.glowDecreaser = null;

	/**
	* Группа, содержащая спрайт и свечение карты (база карты)
	* @type {Phaser.Group}
	*/
	this.base = game.add.group();
	this.base.x = this.options.x;
	this.base.y = this.options.y;
	this.base.add(this.glow);
	this.base.add(this.sprite);
	game.cardsGroup.add(this.base);  

	/**
	* Твин передвижения карты
	* @type {Phaser.Tween}
	* @default null
	*/
	this.mover = null;
	/**
	* Твин вращения карты
	* @type {Phaser.Tween}
	* @default null
	*/
	this.rotator = null;
	/**
	* Твин переворота карты
	* @type {Phaser.Tween}
	* @default null
	*/
	this.flipper = null;

	/**
	* Когда карта будет перемещена вверх группы  
	* @private
	* @type {BRING_TO_TOP_ON}
	* @default BRING_TO_TOP_ON.NEVER
	* @see  {@link Card#moveTo}
	*/
	this._bringToTopOn = BRING_TO_TOP_ON.NEVER;

	/**
	* Масть карты
	* @type {number}
	*/
	this.suit = this.options.suit;
	/**
	* Значение карты
	* @type {number}
	*/
	this.value = this.options.value;	
	/**
	* Изменилось ли значение карты
	* @type {boolean}
	* @private
	* @see {@link Card#presetValue}
	*/
	this._valueChanged = false;
	/**
	* Время переворота карты
	* @type {number}
	* @see {@link Card#updateValue}
	*/
	this.flipTime = this.options.flipTime;

	/**
	* Скин карты
	* @type {object}
	* @see {@link SkinManager}
	*/
	this.skin = this.options.skin;
	this.applySkin();
};

/** 
* Возвращает опции по умолчанию (см. {@link Card|Card options}).
* @static
* @return {object} опции по умолчанию
*/
Card.getDefaultOptions = function(){
	var options = {
		id:null,
		x: game.screenWidth / 2,
		y: game.screenHeight + 300,
		suit:null,
		value:0,
		flipTime: 150,
		skin:skinManager.skin,
		fieldId: null,
		debug: false
	};
	return options;
};


//ЗНАЧЕНИЯ

/**
* Задает значения для установки в будущем.
* Отсутствие suit означает, что карта лежит рубашкой вверх.
* @param  {(number|null)} [suit=null]  - масть карты
* @param  {number} [value=0] - значение карты
*/
Card.prototype.presetValue = function(suit, value){
	if(suit === undefined)
		suit = null;

	if(
		(suit === null && this.suit === null) ||
		(suit == this.suit && value == this.value)
	)
		return;

	if(suit === null){
		this.suit = null;
		this.value = 0;
	}
	else{
		this.suit = suit;
		this.value = value;
	}
	this._valueChanged = true;
};

/** 
* Устанавливает заданные ранее значения и переворачивает карту.
*/
Card.prototype.updateValue = function(){
	if(!this._valueChanged)
		return;

	this._valueChanged = false;

	if(this.flipper){
		this.flipper.stop();
		this.flipper = null;
	}

	if(game.paused){
		this.setValue(this.suit, this.value, false);
		return;
	}

	this.flipper = game.add.tween(this.sprite.scale);
	this.flipper.to({x: 0}, (this.flipTime/game.speed)/2);
	this.flipper.to({x: this.skin.scale}, (this.flipTime/game.speed)/2);

	if(this.suit === null){
		this.flipper.onChildComplete.addOnce(function(){
			this.sprite.frame = this.skin.cardbackFrame;
		}, this);
		this.setDraggability(false);
	}
	else{
		this.flipper.onChildComplete.addOnce(function(){
			this.sprite.frame =  this.skin.firstValueFrame + this.suit*13 + this.value - 2;
		}, this);
	}
	this.flipper.start();
};

/**
* Устанавливает значение карты сразу, с анимацией или без.
* Отсутствие suit означает, что карта лежит рубашкой вверх.
* @param  {(number|null)} [suit=null]  - масть карты
* @param  {number} [value=0] - значение карты
* @param {boolean} [animate=true] - анимировать ли переворот карты
*/
Card.prototype.setValue = function(suit, value, animate){

	if(suit === undefined)
		suit = null;

	if(animate === undefined)
		animate = true;

	if(animate && !game.paused){
		this.presetValue(suit, value);
		this.updateValue();
	}
	else if(suit === null){
		this.suit = null;
		this.value = 0;
		this.sprite.frame = this.skin.cardbackFrame;
	}
	else{
		this.suit = suit;
		this.value = value;
		this.sprite.frame =  this.skin.firstValueFrame + this.suit*13 + this.value - 2;
	}		
};

/**
* Устанавливает перетаскиваемость карты.
* @param {boolean} draggable - значение перетаскиваемости
*/
Card.prototype.setDraggability = function(draggable){	
	this.draggable = draggable;
};

/**
* Устанавливает, можно ли ходить этой картой.
* @param {boolean} playable - играбильность карты
* @param {number} [tint=ui.colors.orange] - цвет свечения карты
*/
Card.prototype.setPlayability = function(playable, tint){
	if(playable){
		this._glowStart(0.25, 0.75, 1500, 500, tint || ui.colors.orange);
	}
	else{
		this._glowStop();
	}
	this.playable = playable;
};


//ПОЗИЦИОНИРОВАНИЕ

/**
* Устанавливает абсолютную позицию карты.
* @param {number} x          позиция по горизонтали
* @param {number} y          позиция по вертикали
* @param {boolean} [resetMover=true] нужно ли останавливать {@link Card#mover}
*/
Card.prototype.setPosition = function(x, y, resetMover){

	if(typeof resetMover == 'undefined')
		resetMover = true;

	if(this.mover && resetMover){
		this.mover.stop();
		this.mover = null;
	}

	this.sprite.x = x - this.base.x;
	this.sprite.y = y - this.base.y;
	this.update();
};

/**
* Устанавливает положение карты по отношению к базе карты.
* @param {number} x          позиция по горизонтали
* @param {number} y          позиция по вертикали
* @param {boolean} [resetMover=true] нужно ли останавливать {@link Card#mover}
*/
Card.prototype.setRelativePosition = function(x, y, resetMover){

	if(typeof resetMover == 'undefined')
		resetMover = true;

	if(this.mover && resetMover){
		this.mover.stop();
		this.mover = null;
	}

	this.sprite.x = x;
	this.sprite.y = y;
	this.update();
};

/**
* Устанавливает позицию базы карты.
* @param {number} x          позиция по горизонтали
* @param {number} y          позиция по вертикали
* @param {boolean} [resetMover=true] нужно ли останавливать {@link Card#mover}
*/
Card.prototype.setBase = function(x, y, resetMover){

	if(typeof resetMover == 'undefined')
		resetMover = true;

	if(this.mover && resetMover){
		this.mover.stop();
		this.mover = null;
	}

	this.sprite.x += this.base.x - x;
	this.sprite.y += this.base.y - y;
	this.base.x = x;
	this.base.y = y;
	this.update();
};

/**
* Устанавливает позицию базы карты, сохраняя относительный сдвиг спрайта и хвоста.
* @param {number} x  позиция по горизонтали
* @param {number} y  позиция по вертикали
* @param {boolean} [resetMover=true] нужно ли останавливать {@link Card#mover}
*/
Card.prototype.setBasePreserving = function(x, y, resetMover){

	if(typeof resetMover == 'undefined')
		resetMover = true;

	var shiftX = x - this.base.x,
		shiftY = y - this.base.y,
		newX = this.sprite.x - shiftX,
		newY = this.sprite.y - shiftY;
	this.setBase(x, y, resetMover);
	this.setRelativePosition(newX, newY, resetMover);

	//Смещаем хвост карты
	if(cardControl.trail.parent == this.base){
		cardControl.trailShift(-shiftX, -shiftY);
	}
};

/**
* Поднимает карту наверх, опционально поднимает перетаскиваемую карту наверх.
* @param {boolean} [fixController=true] нужно ли поднимать {@link CardControl#card} наверх
*/
Card.prototype.bringToTop = function(fixController){
	if(fixController === undefined)
		fixController = true;
	game.cardsGroup.bringToTop(this.base);
	if(fixController && cardControl.card)
		game.cardsGroup.bringToTop(cardControl.card.base);
};

/**
* Запоминает id поля, в которое будет перемещена карта. Устанавливает перетаскиваемость.
* @param {string} fieldId id поля
*/
Card.prototype.presetField = function(fieldId){
	if(this.fieldId == fieldId){
		return false;
	}
	this.fieldId = fieldId;
	if(fieldId == game.pid){
		this.setDraggability(true);
	}
	else{
		this.setDraggability(false);
	}
	return true;
};

/**
* Устанавливает угол поворота карты.
* @param {number} angle угол поворота
*/
Card.prototype.setAngle = function(angle){
	if(this.rotator){
		this.rotator.stop();
		this.rotator = null;
	}

	this.sprite.angle = angle;
	this._glowUpdatePosition();
};

/**
* Устанавливает масштаб карты относительно масштаба текущего скина.
* @param {number} scale масштаб
*/
Card.prototype.setScale = function(scale){
	scale = this.skin.scale*scale;
	if(scale != this.sprite.scale.x || scale != this.sprite.scale.y){
		this.sprite.scale.setTo(scale, scale);
		this.glow.scale.setTo(scale, scale);
	}
};


//ПЕРЕДВИЖЕНИЕ

/**
* Плавно перемещает карту
* @param  {number} x              - позиция по горизонтали
* @param  {number} y              - позиция по вертикали
* @param  {number} time           - время перемещения
* @param  {number} [delay=0]      - задержка перед перемещением
* @param  {boolean} [relativeToBase=false] - перемещение происходит относительно базы карты
* @param  {boolean} [shouldRebase=false]   - нужно ли перемещать базу карты или только карту  
* если база не изменилась, то эта переменная всегда будет false
* @param  {BRING_TO_TOP_ON} [bringToTopOn=BRING_TO_TOP_ON.INIT]   - когда поднимать карту на передний план 
* @param  {functon} [easing=Phaser.Easing.Quadratic.Out] - функция плавности
*/
Card.prototype.moveTo = function(x, y, time, delay, relativeToBase, shouldRebase, bringToTopOn, easing){

	if(relativeToBase === undefined)
		relativeToBase = false;
	if(shouldRebase === undefined)
		shouldRebase = false;
	if(bringToTopOn === undefined)
		bringToTopOn = BRING_TO_TOP_ON.INIT;
	if(time < 0 || isNaN(time))
		time = 0;

	this._bringToTopOn = bringToTopOn;

	if(this._bringToTopOn == BRING_TO_TOP_ON.INIT || game.paused && this._bringToTopOn != BRING_TO_TOP_ON.NEVER)
		this.bringToTop();

	var destination = this._calculateMoveCoordinates(x, y, relativeToBase, shouldRebase);

	//Меняем позицию базы карты перед началом анимации
	//и меняем относительную позицию карты так, чтобы ее абсолютная позиция не менялась
	if(shouldRebase){
		this.setBasePreserving(destination.base.x, destination.base.y, false);
	}

	this._startMover(destination.sprite.x, destination.sprite.y, time, delay, shouldRebase, easing);
};

/**
* Плавно возвращает карту на базу.
* @see  {@link Card#moveTo}
* @param  {number} time           - время перемещения
* @param  {number} delay          - задержка перед перемещением
*/
Card.prototype.returnToBase = function(time, delay){
	this.moveTo(0, 0, time || 0, delay || 0, true);
};

/**
* Вычисляет координаты базы и спрайта, к которым будет происходить движение, из переданных координат.
* @private
* @param  {number} x              позиция по горизонтали
* @param  {number} y              позиция по вертикали
* @param  {number} relativeToBase перемещение происходит относительно базы карты
* @param  {number} shouldRebase   нужно ли перемещать базу карты или только карту  
* @return {object}                Возвращает две позици `{ sprite: {x, y}, base: {x, y} }`
*/
Card.prototype._calculateMoveCoordinates = function(x, y, relativeToBase, shouldRebase){

	//Куда двигать карту
	var moveX, moveY;

	//Новая позиция базы
	var newBaseX = relativeToBase ? x + this.base.x : x;
	var newBaseY = relativeToBase ? y + this.base.y : y;

	//Предупреждаем о том, что карта вышла за пределы экрана
	if(newBaseX < -this.skin.width/2 || newBaseX > game.screenWidth + this.skin.width/2 || newBaseY < -this.skin.height/2 || newBaseY > game.screenHeight + this.skin.height/2)
		console.warn(
			'Moving card', this.id, 'out of the screen (' + newBaseX + ', ' + newBaseY + ')\n',
			this
		);

	//Нет смысла менять базу, если координаты не изменились
	if(shouldRebase && newBaseX == this.base.x && newBaseY == this.base.y)
		shouldRebase = false;


	if(shouldRebase){
		//Мы будем двигать карту к новой позиции базы
		moveX = moveY = 0;
	}
	else{
		//Если база остается прежней, то двигаем карту к нужной позиции
		moveX = relativeToBase ? x : x - this.base.x;
		moveY = relativeToBase ? y : y - this.base.y;
	}

	return {
		sprite: {
			x: moveX,
			y: moveY
		},
		base: {
			x: newBaseX,
			y: newBaseY
		}
	};
};

/**
* Создает и запускает твин передвижения или перемещает карту если игра остановлена.
* @private
* @param  {number} x              	 позиция по горизонтали
* @param  {number} y              	 позиция по вертикали
* @param  {number} time           	 время перемещения
* @param  {number} delay          	 задержка перед перемещением
* @param  {boolean} shouldRebase    нужно ли перемещать базу карты или только карту 
* @param  {functon} easing 		 функция плавности
*/
Card.prototype._startMover = function(x, y, time, delay, shouldRebase, easing){
	if(game.paused){
		this.updateValue();
		this.setRelativePosition(x, y);
		if(this.mover){
			this.mover.stop();
			this.mover = null;
		}
		return;
	}

	//Проверяем и останавливаем текущий мувер
	if(this.mover){
		time = this._tryResetMover(x, y, time, delay, shouldRebase);
		if(time < 0) return;
	}

	//Запускаем новый твин
	this.mover = game.add.tween(this.sprite);
	this.mover.to(
		{			
			x: x,
			y: y
		},
		(time/game.speed) || 0,
		easing || Phaser.Easing.Quadratic.Out,
		true,
		(delay/game.speed) || 0
	);

	//Переворачиваем карту, когда начинается движение
	this.mover.onStart.addOnce(function(){
		this.updateValue();
		if(this._bringToTopOn == BRING_TO_TOP_ON.START)
			this.bringToTop();
	}, this);

	//Ресет твина по окончанию
	this.mover.onComplete.addOnce(function(){
		this.mover = null;
		if(this._bringToTopOn == BRING_TO_TOP_ON.END || this._bringToTopOn == BRING_TO_TOP_ON.END_ALL){
			if(!this.field || this._bringToTopOn == BRING_TO_TOP_ON.END)
				this.bringToTop();
			else
				this.field.zAlignCards(true);
		}
	}, this);
};

/**
* Останавливает мувер, если время, позиция или задержка изменились.
* Возвращает уменьшенное время, если они остались прежними.
* @private
* @param  {number} x              	 позиция по горизонтали
* @param  {number} y              	 позиция по вертикали
* @param  {number} time           	 время перемещения
* @param  {number} delay          	 задержка перед перемещением
* @param  {boolean} shouldRebase    нужно ли перемещать базу карты или только карту 
* @return {number} Возвращает оставшееся время или -1, если мувер не был остановлен.
*/
Card.prototype._tryResetMover = function(x, y, time, delay, shouldRebase){
	var moverData = this.mover.timeline[this.mover.current],
		endPosition = moverData && moverData.vEnd;

	//Не перезапускаем твин, если нет задержки и пункт назначения не изменился
	if(!shouldRebase && endPosition && endPosition.x == x && endPosition.y == y && moverData.delay == delay){
		this.updateValue();
		if(this._bringToTopOn == BRING_TO_TOP_ON.START)
			this.bringToTop();
		return -1;
	}

	//Уменьшаем время движения, если твин уже в процессе, чтобы уменьшить заторможенность карт,
	//когда они несколько раз меняют направление движения (игрок проносит курсор над рукой)
	//Ограничиваем минимальное время половиной заданного, чтобы карты резко не прыгали
	if(!delay){		
		time = Math.max(moverData.duration*game.speed - moverData.dt*game.speed, time/2);
	}

	//Останавливаем существующий твин
	this.mover.stop();

	return time;
};


//ПОВОРОТ

/**
* Поворачивает карту с анимацией.
* @param  {number} angle  угол, к которому будет поворачиваться карта
* @param  {number} time   время поворота
* @param  {number} [delay=0]  задержка перед поворотом
* @param  {function} [easing=Phaser.Easing.Quadratic.Out] функция плавности
*/
Card.prototype.rotateTo = function(angle, time, delay, easing){

	var newAngle = this._calculateCorrectAngle(angle);

	if(newAngle === false){
		if(this.rotator){
			this.rotator.stop();
			this.rotator = null;
		}
		return;
	}
	this._startRotator(angle, time, delay, easing);
};

/**
* Корректирует угол. 
* @private
* @param  {number} angle     угол
* @return {(number|boolean)} Возвращает скорректированный угол, если он не равен текущему, или `false`.
*/
Card.prototype._calculateCorrectAngle = function(angle){
	var angleSign = angle < 0 ? -1 : 1,

		angleAbs = Math.abs(angle),
		angleDiv = Math.floor(angleAbs / 360),

		oldAngle = this.sprite.angle,
		oldAngleSign = oldAngle < 0 ? -1 : 1,
		oldAngleAbs = Math.abs(oldAngle),
		oldAngleDiv = Math.floor(oldAngleAbs / 360);

	angle = (angleAbs - angleDiv*360)*angleSign;
	oldAngle = (oldAngleAbs - oldAngleDiv*360)*oldAngleSign;

	if(Math.abs(angle - oldAngle) >= 180){
		angle -= 360*angleSign;
	}

	if(angle == oldAngle){
		return false;
	}
	return angle;
};

/**
* Создает и запускает твин поворота или поворачивает карту если игра остановлена.
* @private
* @param  {number} angle    угол, к которому будет поворачиваться карта
* @param  {number} time     время поворота
* @param  {number} delay    задержка перед поворотом
* @param  {function} easing функция плавности
*/
Card.prototype._startRotator = function(angle, time, delay, easing){

	//Останавливаем твин, если он есть и угол поворота изменился
	if(this.rotator){
		var rotatorData = this.rotator.timeline[this.rotator.current];
		if(rotatorData && rotatorData.vEnd && rotatorData.vEnd.angle == angle && rotatorData.delay == delay && !game.paused)
			return;

		this.rotator.stop();
		this.rotator = null;
	}

	//Создаем и запускаем твин или поворачиваем карту если игра остановлена
	if(game.paused){
		this.setAngle(angle);
	}
	else{
		this.rotator = game.add.tween(this.sprite);
		this.rotator.to(
			{
				angle: angle
			},
			time/game.speed || 0,
			easing || Phaser.Easing.Quadratic.Out,
			true,
			delay/game.speed || 0
		);

		//Ресет твина по окончанию
		this.rotator.onComplete.addOnce(function(){
			this.rotator = null;
		}, this);
	}
};


//СКИН

/**
* Применяет текущий скин к карте.
*/
Card.prototype.applySkin = function(){
	this.sprite.loadTexture(this.skin.sheetName);
	this.glow.loadTexture(this.skin.glowSheetName);
	this.setScale(1);
	this.setValue(this.suit, this.value, false);
};

/**
* Меняет рубашку карт на текущую
*/
Card.prototype.applyCardback = function(){
	if(!this.suit && this.suit !== 0){
		this.sprite.frame = this.skin.cardbackFrame;
	}
};


//СВЕЧЕНИЕ

/**
* Запускает свечение.
* @param  {number} minGlow    минимальная прозрачность свечения
* @param  {number} maxGlow    максимальная прозрачность свечения
* @param  {number} speed      время анимации между minGlow и maxGlow
* @param  {number} [delayRange=0] максимальное значение задержки начала свечения
* @param  {number} [color=ui.colors.white]     цвет свечения
* @private
*/
Card.prototype._glowStart = function(minGlow, maxGlow, speed, delayRange, color){
	
	this._glowReset();

	this.glow.tint = color || ui.colors.white;

	if(game.paused)
		return;

	this.glowDecreaser = game.add.tween(this.glow);
	this.glowDecreaser.to(
		{alpha: minGlow}, 
		speed/game.speed, 
		Phaser.Easing.Linear.None, 
		false, 
		Math.floor(Math.random()*(delayRange/game.speed || 0))
	);

	this.glowIncreaser = game.add.tween(this.glow);
	this.glowIncreaser.to(
		{alpha: maxGlow},
		speed/game.speed, 
		Phaser.Easing.Linear.None, 
		false, 
		Math.floor(Math.random()*(delayRange/game.speed || 0))
	);

	this.glowIncreaser.onComplete.add(function(){
		if(this.glow.visible && this.glowDecreaser)
			this.glowDecreaser.start();
	},this);
	this.glowDecreaser.onComplete.add(function(){
		if(this.glow.visible && this.glowIncreaser)
			this.glowIncreaser.start();
	},this);
	this.glowDecreaser.start();
};

/**
* Останавливает свечение.
* @private
*/
Card.prototype._glowStop = function(){
	if(this.glowIncreaser){
		this.glowIncreaser.stop();
		this.glowIncreaser = null;
	}
	if(this.glowDecreaser){
		this.glowDecreaser.stop();
		this.glowDecreaser = null;
	}
	if(this.glow.visible){
		this.glow.kill();
	}
};

/**
* Останавливает и восстанавливает свечение.
* @private
*/
Card.prototype._glowReset = function(){
	this._glowStop();
	this.glow.reset();
	this._glowUpdatePosition();
};

/**
* Обновляет позицию свечения.
* @private
*/
Card.prototype._glowUpdatePosition = function(){
	this.glow.x = this.sprite.x;
	this.glow.y = this.sprite.y;
	this.glow.scale.setTo(this.sprite.scale.x, this.sprite.scale.y);
	this.glow.angle = this.sprite.angle;
};


//СОБЫТИЯ

/**
* Вызывается при нажатии на карту.
* @private
* @param  {Phaser.Sprite} sprite {@link Card#sprite}
* @param  {Phaser.Pointer} pointer вызвавший ивент указатель
*/
Card.prototype._cursorDown = function(sprite, pointer){
	cardControl.cardClick(this, pointer);
};

/**
* Вызывается при окончании нажатия на карту.
* @private
* @param  {Phaser.Sprite} sprite {@link Card#sprite}
* @param  {Phaser.Pointer} pointer вызвавший ивент указатель
*/
Card.prototype._cursorUp = function(sprite, pointer){
	cardControl.cardUnclick(this, pointer);
};

/**
* Вызывается при наведении на карту.
* @private
* @param  {Phaser.Sprite} sprite {@link Card#sprite}
* @param  {Phaser.Pointer} pointer вызвавший ивент указатель
*/
Card.prototype._cursorOver = function(sprite, pointer){
	if(this.field)
		this.field.focusOnCard(this, pointer);
};

/**
* Вызывается когда указатель покидает спрайт карты.
* @private
* @param  {Phaser.Sprite} sprite {@link Card#sprite}
*/
Card.prototype._cursorOut = function(sprite){
	if(this.field)
		this.field.focusOffCard(this);
};


//БУЛЕВЫ ФУНКЦИИ

/**
* Находится ли указатель над картой.
* @return {boolean}
*/
Card.prototype.cursorIsOver = function(){
	return Phaser.Rectangle.containsRaw(
		this.base.x + this.sprite.x - this.sprite.width/2,
		this.base.y + this.sprite.y - this.sprite.height/2,
		this.sprite.width,
		this.sprite.height,
		game.input.x,
		game.input.y
	);
};


//DESTROY, UPDATE

/**
* Полностью удаляет карту из игры с анимацией.
*/
Card.prototype.destroy = function() {
	var time = 1000,
		alphaTween = game.add.tween(this.sprite),
		scaleTween = game.add.tween(this.sprite.scale);
	if(cardControl.card == this)
		cardControl.reset();
	delete cardManager.cards[this.id];
	this.setDraggability(false);
	this.setPlayability(false);
	if(this.mover)
		this.mover.stop();
	if(this.rotator)
		this.rotator.stop();
	if(this.flipper)
		this.flipper.stop();
	if(this.field)
		this.field.removeCard(this);
	alphaTween.to({alpha: 0}, time, Phaser.Easing.Linear.None, true);
	scaleTween.to({x: 0.6, y: 0.6}, time, Phaser.Easing.Linear.None, true);

	alphaTween.onComplete.addOnce(function(){
		this.base.removeAll(true);
		this.base.destroy();
	}, this);
};

/**
* Обновление карты.  
* На данный момент только обновляет позицию свечения.
*/
Card.prototype.update = function() {
	this._glowUpdatePosition();
};

/**
* Обновляет позицию дебаг информации.
*/
Card.prototype.updateDebug = function(){
	if(!this.inDebugMode)
		return;

	var x = this.base.x + this.sprite.x - this.skin.width/2;
	var y = this.base.y + this.sprite.y + this.skin.height/2 + 12;
	if(this.suit || this.suit === 0){
		game.debug.text(
			getSuitStrings('EN')[this.suit] + ' ' + 
			cardValueToString(this.value, 'EN'),
			x, y 
		);
		y += 14;
	}
	game.debug.text(
		Math.round(this.base.x + this.sprite.x) + ' ' + 
		Math.round(this.base.y + this.sprite.y),
		x, y 
	);
};
