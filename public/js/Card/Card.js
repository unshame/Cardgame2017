//@include:CardManager
//@include:CardControl
//@include:CardPickNotifier
//@include:CardEmitter

/**
* Конструктор карт.  
* Два основных компонента: {@link Card#sprite} и {@link Card#glow}.  
* Имеет методы для перемещения (с анимацией и без), установки значений,
* установки флагов, применения скинов. Передает информацию о курсоре
* присвоенному полю ({@link Field}) и контроллеру карт ({@link CardControl}).
* @class
* @extends {external:Phaser.Group}
* @param {object}        options                         Опции, используемые при создании карты
* @param {Game}          options.game                    игра, к которой пренадлежит карта
* @param {string}        options.id                      id карты
* @param {number}        [options.x=0]                   позиция по горизонтали
* @param {number}        [options.y=0]                   позиция по вертикали
* @param {(number|null)} [options.suit=null]             масть карты
* @param {number}        [options.value=0]               значение карты
* @param {number}        [options.flipTime=150]          время переворота карты
* @param {object}        [options.skin=skinManager.skin] скин карты
* @param {string}        [options.fieldId=null]          id поля, в которое будет добавлена карта
* @param {boolean}       [options.debug=false]           вывод дебаг информации
*/


var Card = function (options) {

	// Options
	this.options = mergeOptions(this.getDefaultOptions(), options);

	Phaser.Group.call(this, this.options.game);

	/**
	* Выводить ли дебаг информацию
	* @type {boolean}
	*/
	this.inDebugMode = this.options.debug;

	/**
	* Можно ли перетаскивать карту
	* @type {boolean}
	* @see  Card#setDraggability
	*/
	this.draggable = false;

	/**
	* Играбильна ли карта
	* @type {boolean}
	* @see  Card#setPlayability
	*/
	this.playable = false;

	/**
	* Подсвечена ли карта.
	* @type {Boolean}
	*/
	this.highlighted = false;

	/**
	* Должна ли карта быть подсвечена по окончании движения
	* и каким цветом нужно будет подсветить карту.
	* @type {(boolean|number)}
	*/
	this._shouldHighlight = false;

	/**
	* Говорит {@link Card#field}, что карту нужно поднять
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
	this.sprite.inputEnabled = false;
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
	*/
	this._glowIncreaser = null;

	/**
	* Твин уменьшения яркости свечения карты
	* @type {Phaser.Tween}
	*/
	this._glowDecreaser = null;

	this.x = this.options.x;
	this.y = this.options.y;
	this.add(this.glow);
	this.add(this.sprite);

	/**
	* Твин передвижения карты.
	* По его существованию определяется, передвигается ли карта.
	* @type {Phaser.Tween}
	*/
	this.mover = null;
	/**
	* Информация о задержанных твинах.
	* @type {object<object>}
	*/
	this._delayedTweenInfos = {};
	/**
	* Твин вращения карты
	* @type {Phaser.Tween}
	*/
	this._rotator = null;
	/**
	* Твин переворота карты
	* @type {Phaser.Tween}
	*/
	this._flipper = null;

	/**
	* Информация для вращения карты вокруг точки.
	* @type {object}
	*/
	this._revolveInfo = null;

	/**
	* Когда карта будет перемещена вверх группы  
	* @type {BRING_TO_TOP_ON}
	* @see  {@link Card#moveTo}
	*/
	this._bringToTopOn = BRING_TO_TOP_ON.NEVER;

	/**
	* Ожидает ли карта перемещения.
	* @type {Boolean}
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
	* @type {number}
	*/
	this._lowestTint = 0x666666;

	this._shouldEnablePhysics = false;

	this._destroyPending = false;

	/**
	* Скин карты
	* @type {object}
	* @see {@link SkinManager}
	*/
	this.skin = this.options.skin || skinManager.skin;
	this.applySkin();	
};

extend(Card, Phaser.Group);

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

/**
* Обновление карты.  
*/
Card.prototype.update = function() {
	this._revolve();
	this._glowUpdatePosition();
	if(this.cursorIsOver()){
		ui.layers.updateCursorOverlap(this);
	}
	this._tryStartDelayedTween('mover', this.moveTo);
	this._tryStartDelayedTween('rotator', this.rotateTo);
};

/**
* Обновляет позицию дебаг информации.
*/
Card.prototype.updateDebug = function(){
	if(!this.inDebugMode){
		return;
	}

	var x = this.x + this.sprite.x - this.skin.width/2;
	var y = this.y + this.sprite.y + this.skin.height/2 + 12;
	if(this.suit || this.suit === 0){
		this.game.debug.text(
			getSuitStrings('EN')[this.suit] + ' ' + 
			cardValueToString(this.value, 'EN'),
			x, y 
		);
		y += 14;
	}
	this.game.debug.text(
		Math.round(this.x + this.sprite.x) + ' ' + 
		Math.round(this.y + this.sprite.y),
		x, y 
	);
};

//@include:CardCursor
//@include:CardValue
//@include:CardPosition
//@include:CardMover
//@include:CardRotator
//@include:CardSkin
//@include:CardGlow
//@include:CardDelayedTweens
//@include:CardPhysics
//@include:CardDestroy