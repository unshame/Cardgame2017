/**
* Менеджер карт.
* @class
* @param {boolean} inDebugMode выводит ли менеджер дебаг информацию
* @extends {external:Phaser.Group}
*/
var CardManager = function(inDebugMode){

	Phaser.Group.call(this, game);

	this.name = 'cardManager';

	/**
	* Карты по id.
	* @type {Object<Card>}
	*/
	this.cards = {};

	/**
	* Кол-во карт в CardManager#cards.
	* @type {Number}
	*/
	this.numOfCards = 0;

	/**
	* Длительность перемещения карт по умолчанию.
	* @type {Number}
	* @default 300
	*/
	this.defaultMoveTime = 300;

	/**
	* Включена ли физика карт.
	* @type {Boolean}
	* @default false
	*/
	this.physicsEnabled = false;

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
	getCards = this.getCards.bind(this);
	/**
	* @method
	* @global
	* @see {@link CardManager#getCard}
	*/
	getCard = this.getCard.bind(this);
};

extend(CardManager, Phaser.Group);

/**
* Создает карты.
* @param {CardInfo[]} cardsInfo информация о создаваемых картах.
*/
CardManager.prototype.createCards = function(cardsInfo){
	this.numOfCards = 0;
	var ids = [];
	for(var i = 0; i < cardsInfo.length; i++){
		this.numOfCards++;
		var c = cardsInfo[i];
		var card = this.cards[c.cid];
		ids.push(c.cid);
		if(!card){
			this.createCard({
				game: 	game,
				x: 		game.screenWidth / 2,
				y:		game.screenHeight + 300,
				id: 	c.cid,
				suit: 	c.suit,
				value: 	c.value,
				debug: 	this.inDebugMode
			});
		}
		else{
			card.presetValue(c.suit, c.value);
			card.fieldId = null;
		}
	}
	for(var ci in this.cards){
		if(!this.cards.hasOwnProperty(ci)){
			continue;
		}
		if(!~ids.indexOf(ci)){
			this.cards[ci].destroy();
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
	var card = new Card(options);
	this.cards[options.id] = card;
	this.add(card);
};

/** Уничтожает все карты. */
CardManager.prototype.reset = function(){
	this.numOfCards = 0;
	this.forEach(function(card){
		card.destroy();
	});
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
CardManager.prototype.enablePhysics = function(makeDraggable, except){

	for(var cid in this.cards){
		// jshint forin:false
		if(!this.cards.hasOwnProperty(cid) || except && except.indexOf && ~except.indexOf(card))
			continue;

		var card = this.cards[cid];
		if(makeDraggable){
			card.setDraggability(true);
		}
		else{
			card.setDraggability(false);
		}
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
		if(card.sprite.body){
			card.sprite.body.destroy();
		}
	}
	this.physicsEnabled = false;
};


/**
* Поднимает указанную карту наверх, опционально поднимает перетаскиваемую карту наверх.
* @param {Card} card карта, которую нужно поднять
* @param {boolean} [fixController=true] нужно ли поднимать {@link cardControl#card} наверх
*/
CardManager.prototype.bringCardToTop = function(card, fixController){
	if(!card || !this.cards[card.id] || !~this.children.indexOf(card)){
		console.error('Card manager: can\'t bring card to top', card);
		return;
	}
	if(fixController === undefined){
		fixController = true;
	}
	this.bringToTop(card);
	if(fixController && cardControl.card && cardControl.card != card){
		this.bringToTop(cardControl.card, false);
	}
};

CardManager.prototype.setInputEnabled = function(enabled){
	this.forEach(function(card){
		card.sprite.inputEnabled = enabled;
	});
}

//@include:CardManagerDebug