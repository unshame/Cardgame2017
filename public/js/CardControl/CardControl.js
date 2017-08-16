/**
* Модуль, отвечающий за перетаскивание карт.  
* Обрабатывает клики по картам, перемещение карт по экрану игроком, перемещение карт между полями игроком,
* а также хвост карты при перемещении игроком.  
* Основные элементы: `{@link CardControl#card|card}, {@link CardControl#trail|pointer}, {@link CardControl#trail|trail}, {@link CardControl#trailDefaultBase|trailDefaultBase}`.
* @class
*/
var CardControl = function(inDebugMode){

	/**
	* Находится ли контроллер в дебаг режиме.
	* @type {boolean}
	*/
	this.inDebugMode = inDebugMode || false;

	/**
	* Контролируемая карта.
	* @type {Card}
	*/
	this.card = null;

	/**
	* Указатель, "держущий" карту
	* @type {Phaser.Pointer}
	*/
	this.pointer = null;

	/**
	* Хвост карты.
	* Представляет из себя эмиттер партиклей в виде иконок масти карты.
	* @type {Phaser.Particles.Arcade.Emitter}
	*/
	this.trail = null;

	/**
	* База хвоста карты, когда он не прикреплен к карте.
	* @type {Phaser.Group}
	*/
	this.trailDefaultBase = null;
	
	/**
	* Нужно ли прикрепить хвост к текущей карте.
	* @type {Boolean}
	* @private
	*/
	this._trailShouldReappend = false;

	/** 
	* Время сдвига центра карты к указателю.
	* @type {Number}
	*/
	this.cardShiftDuration = 100;
	/**
	* Время возвращения карты на свою базу.
	* @type {Number}
	*/
	this.cardReturnTime = 200;
	/**
	* Время между кликами по карте, когда она будет поднята вторым кликом.
	* @type {Number}
	*/
	this.cardClickMaxDelay = 200;
	/**
	* На сколько должна быть свдвинута карта, чтобы было заметно покачивание
	* и чтобы хвост уменьшил пространство, на котором спавнятся партикли.
	* @type {Number}
	*/
	this.cardMoveThreshold = 2;

	/**
	* Максимальный угол покачивания карты при движении.
	* @type {Number}
	*/
	this.cardMaxMoveAngle = 30;

	/**
	* История инерции карты.
	* @type {Array}
	* @private
	*/
	this._inertiaHistory = [];
};

/** Инициалищирует модуль - создает хвост карты и группу для него. */
CardControl.prototype.initialize = function(){
	this.trail = game.add.emitter(0, 0);
	this.trailDefaultBase = game.add.group();
	this.trail.makeParticles(skinManager.skin.trailName, 0);
	this.trailDefaultBase.name = 'trail';
	this.trailReset();
};

/**
* Обрабатывает нажатие на карту.
* @param  {Card} card    карта
* @param  {Phaser.Pointer} pointer указатель, нажавший на карту
*/
CardControl.prototype.cardClick = function(card, pointer){
	if(pointer.button == 1 || pointer.button == 4)
		console.log(card);

	if(!card.draggable || this.card && this.card != card || !this.card && card.field && !card.field.interactible)
		return;

	if(this.inDebugMode)
		console.log('Card control: Clicked', card.id);

	if(this.card){
		this.cardPutDown();
	}
	else{
		this.cardPickup(card, pointer);
	}
};

/**
* Обрабатывает поднятие кнопки после нажатия на карту.
* @param  {Card} card карта
*/
CardControl.prototype.cardUnclick = function(card){
	if(!this.card || this.card != card)
		return;

	if(this.inDebugMode)
		console.log('Card control: Unclicked', card.id);

	if(!this.pointer.withinGame){
		this.cardReturn();
	}
	else if(!this._cardPointerInbound() || !this.cardClickTimer || !this.pointer.isMouse || cardManager.physicsEnabled && this.card.sprite.body){
		this.cardPutDown();
	}
};


/** 
* Проверка нажатия на базу карты.
* @private
*/
CardControl.prototype._cardPointerInbound = function(){
	var width = this.card.field ? skinManager.skin.width*(1 + this.card.field.style.scaleDiff) : skinManager.skin.width,
		height = this.card.field ? skinManager.skin.height*(1 + this.card.field.style.scaleDiff) : skinManager.skin.height;
	return Phaser.Rectangle.containsRaw(
		this.card.x - width / 2,
		this.card.y - height / 2,
		width,
		height,
		this.pointer.x,
		this.pointer.y
	);
};

/**
* Проверка корректности позиции карты (возащает false или поля).
* @private
*/
CardControl.prototype._cardOnValidField = function(){
	if(!this.card.playable)
		return false;

	var fields = fieldManager.forEachField(function(field, si){
		if(field.playable && field.cardIsInside(this.card, false)){
			return field;
		}
	}, this);
	if(!fields.length){
		fields = fieldManager.forEachField(function(field, si){
			if(field.playable && field.cardIsInside(this.card, false, true)){
				return field;
			}
		}, this);
	}
	if(fields.length){
		return fields;
	}
	return false;
};

//@include:CardControlAction
//@include:CardControlCard
//@include:CardControlTrail

/** Обновляет контролируемую карту и ее хвост. */
CardControl.prototype.update = function(){
	var shouldUpdateTrail = this._updateCard();
	if(shouldUpdateTrail && !this._trailShouldReappend){
		this._trailSpawnParticle();
	}
	else if(!shouldUpdateTrail){
		this._trailShouldReappend = false;
	}
	this._updateTrail();
};

/**
* Ресет контроллера
* @param  {string} [reason] Причина ресета для дебага.
*/
CardControl.prototype.reset = function(reason){

	if(this.inDebugMode)
		console.log('Card control: Reset' + (reason ? ': ' + reason : ''));

	this.trailReset(true);
	this.card = null;
	this.pointer = null;
};

//@include:CardControlDebug
