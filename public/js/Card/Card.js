/**
 * Конструктор карт  
 * Три основные компонента: {@link Card#base}, {@link Card#sprite} и {@link Card#glow}  
 * Имеет методы для перемещения (с анимацией и без), установки значений,
 * установки флагов, применения скинов. Передает информацию о курсоре
 * присвоенному полю ({@link Field}) и контроллеру карт ({@link CardControl}).
 * @constructor
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
	this.options = this._getDefaultOptions();
	for(var o in options){
		if(options.hasOwnProperty(o))
			this.options[o] = options[o];
	}

	this.isInDebugMode = this.options.debug;
	this.isDraggable = false;
	this.isPlayable = false;
	this.raised = false;

	//Id
	this.id = this.options.id;

	//Field
	this.presetField(this.options.fieldId);
	this.field = null;

	//Sprite
	this.sprite = game.add.sprite();
	this.sprite.inputEnabled = true;
	this.sprite.events.onInputDown.add(this._mouseDown, this);
	this.sprite.events.onInputUp.add(this._mouseUp, this);
	this.sprite.events.onInputOver.add(this._mouseOver, this);
	this.sprite.events.onInputOut.add(this._mouseOut, this);
	this.sprite.anchor.set(0.5, 0.5);

	//Glow
	this.glow = game.add.sprite();
	this.glow.anchor.set(0.5, 0.5);
	this.glow.visible = false;

	//Base
	this.base = game.add.group();
	this.base.x = this.options.x;
	this.base.y = this.options.y;
	this.base.add(this.glow);
	this.base.add(this.sprite);
	game.cardsGroup.add(this.base);  

	//Tweens
	this.mover = null;
	this.rotator = null;
	this.scaler = null;
	this.flipper = null;

	this.bringToTopOn = 'never';

	//Value
	this.suit = this.options.suit;
	this.value = this.options.value;	
	this.valueChanged = false;
	this.flipTime = this.options.flipTime;

	//Skin
	this.skin = this.options.skin;
	this.applySkin();
};

/** 
 * Возвращает опции по умолчанию (см. Card options)
 * @private
 */
Card.prototype._getDefaultOptions = function(){
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
	this.valueChanged = true;
};

/** 
 * Устанавливает заданные ранее значения и переворачивает карту
 * @private
 */
Card.prototype._updateValue = function(){
	if(!this.valueChanged)
		return;

	this.valueChanged = false;

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
		this._updateValue();
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
 * Устанавливает перетаскиваемость карты
 * @param {boolean} draggable - значение перетаскиваемости
 */
Card.prototype.setDraggability = function(draggable){	
	this.isDraggable = draggable;
};

/**
 * Устанавливает, можно ли ходить этой картой
 * @param {boolean} playable - играбильность карты
 * @param {number} [tint=game.colors.orange] - цвет свечения карты
 */
Card.prototype.setPlayability = function(playable, tint){
	if(playable){
		this._glowStart(0.25, 0.75, 1500, 500, tint || game.colors.orange);
	}
	else{
		this._glowStop();
	}
	this.isPlayable = playable;
};


//ПОЗИЦИОНИРОВАНИЕ

//Устанавливает абсолютную позицию карты
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

//Устанавливает положение карты по отношению к базе карты
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

//Устанавливает позицию базы карты
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

//Поднимает карту наверх, опционально поднимает перетаскиваемую карту наверх
Card.prototype.bringToTop = function(fixController){
	if(fixController === undefined)
		fixController = true;
	game.cardsGroup.bringToTop(this.base);
	if(fixController && cardControl.card)
		game.cardsGroup.bringToTop(cardControl.card.base);
};

//Запоминает id поля, в которое будет перемещена карта
//Устанавливает перетаскиваемость
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

//Устанавливает угол поворота карты
Card.prototype.setAngle = function(angle){
	if(this.rotator){
		this.rotator.stop();
		this.rotator = null;
	}

	this.sprite.angle = angle;
	this._glowUpdatePosition();
};

//Устанавливает масштаб карты относительно масштаба текущего скина
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
 * @param  {number} x              - позиция
 * @param  {number} y              - позиция
 * @param  {number} time           - время перемещения
 * @param  {number} delay          - задержка перед перемещением
 * @param  {boolean} [relativeToBase=false] - перемещение происходит относительно базы карты
 * @param  {boolean} [shouldRebase=false]   - нужно ли перемещать базу карты или только карту  
 * если база не изменилась, то эта переменная всегда будет false
 * @param  {string} [bringToTopOn='init']   - когда поднимать карту на передний план ('never', 'init', 'start', 'end', 'endAll')
 * @param  {functon} [easing=Phaser.Easing.Quadratic.Out] - функция плавности
 */
Card.prototype.moveTo = function(x, y, time, delay, relativeToBase, shouldRebase, bringToTopOn, easing){

	if(relativeToBase === undefined)
		relativeToBase = false;
	if(shouldRebase === undefined)
		shouldRebase = false;
	if(bringToTopOn === undefined || !~['never', 'init', 'start', 'end', 'endAll'].indexOf(bringToTopOn))
		bringToTopOn = 'init';

	this.bringToTopOn = bringToTopOn;

	if(this.bringToTopOn == 'init' || game.paused && this.bringToTopOn != 'never')
		this.bringToTop();

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

	//Меняем позицию базы карты перед началом анимации
	//и меняем относительную позицию карты так, чтобы ее абсолютная позиция не менялась
	if(shouldRebase){

		//Мы будем двигать карту к новой позиции базы
		moveX = moveY = 0;
		var shiftX = newBaseX - this.base.x,
			shiftY = newBaseY - this.base.y,
			newX = this.sprite.x - shiftX,
			newY = this.sprite.y - shiftY;
		this.setBase(newBaseX, newBaseY, false);
		this.setRelativePosition(newX, newY, false);

		//Смещаем хвост карты
		if(cardControl.trail.parent == this.base){
			cardControl.trailShift(-shiftX, -shiftY);
		}
	}
	else{
		//Если база остается прежней, то двигаем карту к нужной позиции
		moveX = relativeToBase ? x : x - this.base.x;
		moveY = relativeToBase ? y : y - this.base.y;
	}


	//Создаем и запускаем твин или перемещаем карту если игра остановлена
	if(game.paused){
		this._updateValue();
		this.setRelativePosition(moveX, moveY);
		if(this.mover){
			this.mover.stop();
			this.mover = null;
		}
		return;
	}

	if(this.mover){
		var moverData = this.mover.timeline[this.mover.current],
			endPosition = moverData && moverData.vEnd;

		//Не перезапускаем твин, если нет задержки и пункт назначения не изменился
		if(!shouldRebase && endPosition && endPosition.x == moveX && endPosition.y == moveY && moverData.delay == delay){
			this._updateValue();
			if(this.bringToTopOn == 'start')
				this.bringToTop();
			return;
		}

		//Уменьшаем время движения, если твин уже в процессе, чтобы уменьшить заторможенность карт,
		//когда они несколько раз меняют направление движения (игрок проносит курсор над рукой)
		//Ограничиваем минимальное время половиной заданного, чтобы карты резко не прыгали
		if(!delay){		
			time = Math.max(moverData.duration*game.speed - moverData.dt*game.speed, time/2);
		}

		//Останавливаем существующий твин
		this.mover.stop();
	}

	//Запускаем новый твин
	this.mover = game.add.tween(this.sprite);
	this.mover.to(
		{
			x: moveX,
			y: moveY
		},
		(time/game.speed) || 0,
		easing || Phaser.Easing.Quadratic.Out,
		true,
		(delay/game.speed) || 0
	);

	//Переворачиваем карту, когда начинается движение
	this.mover.onStart.addOnce(function(){
		this._updateValue();
		if(this.bringToTopOn == 'start')
			this.bringToTop();
	}, this);

	//Ресет твина по окончанию
	this.mover.onComplete.addOnce(function(){
		this.mover = null;
		if(this.bringToTopOn == 'end' || this.bringToTopOn == 'endAll'){
			if(!this.field || this.bringToTopOn == 'end')
				this.bringToTop();
			else
				this.field.zAlignCards(true);
		}
	}, this);
};

/**
 * Плавно возвращает карту на базу
 * @see  {@link Card#moveTo}
 * @param  {number} time           - время перемещения
 * @param  {number} delay          - задержка перед перемещением
 */
Card.prototype.returnToBase = function(time, delay){
	this.moveTo(0, 0, time || 0, delay || 0, true);
};

//Поворачивает карту 
Card.prototype.rotateTo = function(angle, time, delay, easing){

	var offset = angle < 0 ? 360 : 0,

		angleAbs = Math.abs(angle),
		angleDiv = Math.floor(angleAbs / 360),

		oldAngle = this.sprite.angle,
		oldAngleAbs, oldAngleDiv, oldAnglePos;

	angle = Math.abs( offset - (angleAbs - angleDiv*360) );
	
	if(oldAngle > 0){
		oldAnglePos = oldAngle;
	}
	else{
		oldAngleAbs = Math.abs(oldAngle);
		oldAngleDiv = Math.floor(oldAngleAbs / 360);
		oldAnglePos = 360 - (oldAngleAbs - oldAngleDiv*360);
	}	

	if(angle == oldAnglePos){
		if(this.rotator){
			this.rotator.stop();
			this.rotator = null;
		}
		return;
	}

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

//Применяет текущий скин к карте
Card.prototype.applySkin = function(){
	this.sprite.loadTexture(this.skin.sheetName);
	this.glow.loadTexture(this.skin.glowSheetName);
	this.setScale(1);
	this.setValue(this.suit, this.value, false);
};

//Меняет рубашку карт на текущую
Card.prototype.applyCardback = function(){
	if(!this.suit && this.suit !== 0){
		this.sprite.frame = this.skin.cardbackFrame;
	}
};


//СВЕЧЕНИЕ

//Запускает свечение
Card.prototype._glowStart = function(minGlow, maxGlow, speed, delayRange, color){
	
	this._glowReset();

	this.glow.tint = color || game.colors.white;

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

//Останавливает свечение
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

//Останавливает и восстанавливает свечение
Card.prototype._glowReset = function(){
	this._glowStop();
	this.glow.reset();
	this._glowUpdatePosition();
};

//Обновляет позицию свечения
Card.prototype._glowUpdatePosition = function(){
	this.glow.x = this.sprite.x;
	this.glow.y = this.sprite.y;
	this.glow.scale.setTo(this.sprite.scale.x, this.sprite.scale.y);
	this.glow.angle = this.sprite.angle;
};


//СОБЫТИЯ

//Вызывается при нажатии на карту
Card.prototype._mouseDown = function(sprite, pointer){
	cardControl.cardClick(this, pointer);
};

//Вызывается при окончании нажатия на карту
Card.prototype._mouseUp = function(sprite, pointer){
	cardControl.cardUnclick(this, pointer);
};

//Вызывается при наведении на карту
Card.prototype._mouseOver = function(sprite, pointer){
	if(this.field)
		this.field.focusOnCard(this, pointer);
};

//Вызывается когда указатель покидает спрайт карты
Card.prototype._mouseOut = function(sprite, pointer){
	if(this.field)
		this.field.focusOffCard(this);
};


//БУЛЕВЫ ФУНКЦИИ

//Находится ли указатель над картой
Card.prototype.mouseIsOver = function(){
	if(
		game.input.x < this.base.x + this.sprite.x - this.sprite.width/2 ||
		game.input.x > this.base.x + this.sprite.x + this.sprite.width/2 ||
		game.input.y < this.base.y + this.sprite.y - this.sprite.height/2 ||
		game.input.y > this.base.y + this.sprite.y + this.sprite.height/2
	)
		return false;
	else
		return true;
};


//KILL, RESET, UPDATE

//Убивает спрайты карты (не используется)
Card.prototype.kill = function() {
	this.glow.kill();
	this.sprite.kill();  
	if(this.field){
		this.field.removeCard(this);
	}
};

//Восстанавливает карту (не используется)
Card.prototype.reset = function(){
	this.sprite.reset();  
	this.setValue(this.suit, this.value, false);
};

//Обновление карты
//На данный момент только обновляет позицию свечения
Card.prototype.update = function() {
	this._glowUpdatePosition();
};

//Обновляет позицию текста карты
Card.prototype.updateDebug = function(){
	if(!this.isInDebugMode)
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


