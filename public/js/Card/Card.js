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
		if(options.hasOwnProperty(o) && options[o] !== undefined)
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
	* @private
	*/
	this._glowIncreaser = null;

	/**
	* Твин уменьшения яркости свечения карты
	* @type {Phaser.Tween}
	* @default null
	* @private
	*/
	this._glowDecreaser = null;

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
	* Твин передвижения карты.
	* По его существованию определяется, передвигается ли карта.
	* @type {Phaser.Tween}
	* @default null
	*/
	this.mover = null;
	/**
	* Твин вращения карты
	* @type {Phaser.Tween}
	* @default null
	* @private
	*/
	this._rotator = null;
	/**
	* Твин переворота карты
	* @type {Phaser.Tween}
	* @default null
	* @private
	*/
	this._flipper = null;

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
	* @see {@link Card#applyValue}
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

//@include:CardValue
//@include:CardPosition
//@include:CardMover
//@include:CardSkin
//@include:CardGlow

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
Card.prototype.destroy = function(delay) {
	if(delay === undefined)
		delay = 0;
	var time = 1000,
		alphaTween = game.add.tween(this.sprite),
		scaleTween = game.add.tween(this.sprite.scale);
	if(cardControl.card == this)
		cardControl.reset();
	delete cardManager.cards[this.id];
	this.setDraggability(false);
	this.setPlayability(false);
	this.setHighlight(false);
	if(this.mover)
		this.mover.stop();
	if(this._rotator)
		this._rotator.stop();
	if(this._flipper)
		this._flipper.stop();
	if(this.field)
		this.field.removeCard(this);

	if(game.paused){
		this._destroyNow();
	}
	else{
		alphaTween.to({alpha: 0}, time/game.speed, Phaser.Easing.Linear.None, true, delay/game.speed);
		scaleTween.to({x: 0.6, y: 0.6}, time/game.speed, Phaser.Easing.Linear.None, true, delay/game.speed);
		alphaTween.onComplete.addOnce(this._destroyNow, this);
	}
};

/**
* Удаляет карту из игры сразу.
* @private
*/
Card.prototype._destroyNow = function() {
	this.base.removeAll(true);
	this.base.destroy();
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
