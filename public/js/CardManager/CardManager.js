/**
* Менеджер карт.
* @class
* @param {boolean} inDebugMode выводит ли менеджер дебаг информацию
*/
var CardManager = function(inDebugMode){

	/**
	 * Карты по id.
	 * @type {Object<Card>}
	 */
	this.cards = {};

	/**
	 * Phaser группа карт.
	 * @type {Phaser.Group}
	 */
	this.cardsGroup = game.add.group();
	this.cardsGroup.name = 'cards';

	game.cards = this.cards;
	game.cardsGroup = this.cardsGroup;

	/**
	 * Включена ли физика карт.
	 * @type {Boolean}
	 * @default false
	 */
	this.physicsEnabled = false;

	/**
	 * Эмиттер карт.
	 * @type {Phaser.Emitter}
	 */
	this.emitter = game.add.emitter(game.world.centerX, -skinManager.skin.height, 100);
	this.emitter.name = 'partyEmitter';
	var frames = [];
	for(var i = 0; i < 52; i++){
		frames.push(i);
	}
	this.emitter.makeParticles(skinManager.skin.sheetName, frames);

	/**
	 * Время пропадания партиклей эмиттера, когда он остановлен.
	 * @type {Number}
	 */
	this.particleFadeTime = 500;

	/**
	 * Выводит ли менеджер дебаг информацию.
	 * @type {boolean}
	 */
	this.inDebugMode = inDebugMode || false;

	/**
	 * @method
	 * @global
	 * @see {@link CardManager#getCards}
	 */
	window.getCards = this.getCards.bind(this);
	/**
	 * @method
	 * @global
	 * @see {@link CardManager#getCard}
	 */
	window.getCard = this.getCard.bind(this);
};

/**
 * Создает карты.
 * @param {CardInfo[]} cardsInfo информация о перемещаемых картах.
 */
CardManager.prototype.createCards = function(cardsInfo){
	for(var ci = 0; ci < cardsInfo.length; ci++){
		var c = cardsInfo[ci];
		var card = this.cards[c.cid];
		if(!card){
			var options = {
				id: c.cid,
				suit: c.suit,
				value: c.value,
				debug: this.inDebugMode
			};
			this.createCard(options);
		}
		else{
			card.setValue(c.suit, c.value);
			card.fieldId = null;
		}
	}
};

/**
 * Добавляет карту.
 * @param {object} options параметры карты
 */
CardManager.prototype.createCard = function(options){
	if(!options || typeof options != 'object' || !options.id){
		console.error('Card manager: incorrect options', options);
		return;
	}
	this.cards[options.id] = new Card(options);
};

/** Уничтожает все карты. */
CardManager.prototype.reset = function(){
	for(var cid in this.cards){
		if(this.cards.hasOwnProperty(cid)){
			this.cards[cid].destroy();
		}
	}
};

/**
 * Находится ли курсор над одной из карт с `draggable == true`.
 * @return {(Card|boolean)} Возращает найденную карту или `false`.
 */
CardManager.prototype.cursorIsOverACard = function(){
	for(var ci in this.cards){
		if(!this.cards.hasOwnProperty(ci))
			continue;
		var card = this.cards[ci];
		if(card.cursorIsOver() && card.draggable){
			return card;
		}
	}
	return false;
};

/** Возвращает карты с `raised == true` на место. */
CardManager.prototype.resetRaised = function(){
	var raised = false;
	for(var ci in this.cards){
		if(!this.cards.hasOwnProperty(ci))
			continue;
		var card = this.cards[ci]; 
		if(card.raised){
			card.raised = false;
			raised = true;
		}
	}
	if(!raised)
		return;
	fieldManager.placeCards();
};

/** Применяет скин ко всем картам и эмиттеру карт. */
CardManager.prototype.applySkin = function(){
	for(var ci in this.cards){
		if(this.cards.hasOwnProperty(ci)){
			var card = this.cards[ci]; 
			card.skin = skinManager.skin;
			card.applySkin();
		}
	}
	this.emitter.minParticleScale = this.emitter.maxParticleScale = skinManager.skin.scale;
	if(this.emitter.on){
		this.emitterRestart();
		setTimeout(this._applySkinToEmitter.bind(this), this.particleFadeTime);
	}
};

/** Применяет скин к эмиттеру карт.
* @private
*/
CardManager.prototype._applySkinToEmitter = function(){
	this.emitter.forEach(function(p){
		p.loadTexture(skinManager.skin.sheetName);
	}, this);
};

/** Устанавливает текущие значения всем картам без анимации. */
CardManager.prototype.forceApplyValues = function(){
	for(var ci in this.cards){
		if(this.cards.hasOwnProperty(ci)){
			var card = this.cards[ci]; 
			card.setValue(card.suit, card.value, false);
		}
	}
};

/**
 * Включает физику карт.
 * @param  {boolean} makeDraggable нужно ли делать карты перетаскиваемыми
 */
CardManager.prototype.enablePhysics = function(makeDraggable){

	for(var cid in this.cards){
		if(!this.cards.hasOwnProperty(cid))
			continue;
		var card = this.cards[cid];
		if(makeDraggable)
			card.setDraggability(true);
		else
			card.setDraggability(false);
		game.physics.arcade.enable(card.sprite);
		card.sprite.body.velocity = {x: Math.random()*50 - 25, y: Math.random()*50 - 25};
		card.sprite.body.drag = {x: Math.random()*25, y: Math.random()*25};
		card.sprite.body.angularVelocity = Math.random()*20 - 10;
		card.sprite.body.angularDrag = Math.random()*5;
	}
	this.physicsEnabled = true;
};

/** Выключает физику карт. */
CardManager.prototype.disablePhysics = function(){

	for(var cid in this.cards){
		if(!this.cards.hasOwnProperty(cid))
			continue;
		var card = this.cards[cid];
		if(card.sprite.body)
			card.sprite.body.destroy();
	}
	this.physicsEnabled = false;
};

/** Выполняет `update` каждой карты. */
CardManager.prototype.update = function(){
	for(var ci in this.cards){
		if(!this.cards.hasOwnProperty(ci))
			continue;
		this.cards[ci].update();
	}
};

//@include:CardManagerEmitter
//@include:CardManagerDebug