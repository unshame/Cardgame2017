/**
* Конструктор карт  
* Три основных компонента: {@link Card#base}, {@link Card#sprite} и {@link Card#glow}.  
* Имеет методы для перемещения (с анимацией и без), установки значений,
* установки флагов, применения скинов. Передает информацию о курсоре
* присвоенному полю ({@link Field}) и контроллеру карт ({@link CardControl}).
* @class
* @param {object} options 		 - Опции, используемые при создании карты
* @param {Game} options.game игра, к которой пренадлежит карта
* @param {string} options.id 	 - id карты
* @param {number} [options.x=0] 	 - позиция по горизонтали
* @param {number} [options.y=0] - позиция по вертикали
* @param {(number|null)} [options.suit=null]  - масть карты
* @param {number} [options.value=0] 		 - значение карты
* @param {number} [options.flipTime=150] - время переворота карты
* @param {object} [options.skin=skinManager.skin] - скин карты
* @param {string} [options.fieldId=null] - id поля, в которое будет добавлена карта
* @param {boolean} [options.debug=false] - вывод дебаг информации
*/


var Card = function (options) {

	// Options
	this.options = this.getDefaultOptions();
	for(var o in options){
		if(options.hasOwnProperty(o) && options[o] !== undefined)
			this.options[o] = options[o];
	}

	this.game = this.options.game;

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
	this.fieldId = null;
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
	* Информация для вращения карты вокруг точки.
	* @type {object}
	* @default null
	* @private
	*/
	this._revolveInfo = null;

	/**
	* Когда карта будет перемещена вверх группы  
	* @private
	* @type {BRING_TO_TOP_ON}
	* @default BRING_TO_TOP_ON.NEVER
	* @see  {@link Card#moveTo}
	*/
	this._bringToTopOn = BRING_TO_TOP_ON.NEVER;

	/**
	* Ожидает ли карта перемещения.
	* @type {Boolean}
	* @default false
	*/
	this.delayed = false;

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
	* Минимальное значение яркости карты при перевороте.
	* @private
	* @type {number}
	*/
	this._lowestTint = 0x666666;

	/**
	* Скин карты
	* @type {object}
	* @see {@link SkinManager}
	*/
	this.skin = this.options.skin || skinManager.skin;
	this.applySkin();

	Object.seal(this);
};

/** 
* Возвращает опции по умолчанию (см. {@link Card|Card options}).
* @return {object} опции по умолчанию
*/
Card.prototype.getDefaultOptions = function(){
	return {
		game: null,
		id:null,
		x: 0,
		y: 0,
		suit:null,
		value:0,
		flipTime: 250,
		skin: null,
		fieldId: null,
		debug: false
	};
};

//@include:CardValue
//@include:CardPosition
//@include:CardMover
//@include:CardRotator
//@include:CardSkin
//@include:CardGlow

// СОБЫТИЯ

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


// БУЛЕВЫ ФУНКЦИИ

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
		this.game.input.x,
		this.game.input.y
	);
};


// DESTROY, UPDATE

/**
* Полностью удаляет карту из игры с анимацией.
* @param {number} [delay=0] задержка перед удалением
* @param {boolean} [now] убирает анимацию удаления и игнорирует задержку
*/
Card.prototype.destroy = function(delay, now) {
	if(delay === undefined || now)
		delay = 0;
	var time = 1000,
		alphaTween = this.game.add.tween(this.sprite),
		scaleTween = this.game.add.tween(this.sprite.scale);
	if(cardControl.card == this)
		cardControl.reset('card destroyed');
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
		this.field.removeCards([this]);

	if(this.game.paused || now){
		this._destroyNow();
	}
	else{
		alphaTween.to({alpha: 0}, time/this.game.speed, Phaser.Easing.Linear.None, true, delay/this.game.speed);
		scaleTween.to({x: 0.6, y: 0.6}, time/this.game.speed, Phaser.Easing.Linear.None, true, delay/this.game.speed);
		alphaTween.onComplete.addOnce(this._destroyNow, this);
	}
};

/**
* Удаляет карту из игры сразу.
* @private
*/
Card.prototype._destroyNow = function() {
	if(cardControl.card == this)
		cardControl.reset('card destroyed');
	this.sprite.destroy();
	this.glow.destroy();
	this.base.removeAll();
	this.base.destroy();
};

/**
* Обновление карты.  
*/
Card.prototype.update = function() {
	this._revolve();
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
		this.game.debug.text(
			getSuitStrings('EN')[this.suit] + ' ' + 
			cardValueToString(this.value, 'EN'),
			x, y 
		);
		y += 14;
	}
	this.game.debug.text(
		Math.round(this.base.x + this.sprite.x) + ' ' + 
		Math.round(this.base.y + this.sprite.y),
		x, y 
	);
};
