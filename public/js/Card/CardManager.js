/* 
 * Менеджер карт
 * 
 * Тестовые функции:
 * throwCards - разлетающиеся карты
 * getCards(num, except) - выбирает num карт из cards, пропускает карты из except
 * getCard(except) - выбирает одну карту из cards, пропускает карты из except
 */

var CardManager = function(isInDebugMode){
	this.cards = {};
	this.cardsGroup = game.add.group();
	this.cardsGroup.name = 'cards';
	game.cards = this.cards;
	game.cardsGroup = this.cardsGroup;
	this.emitter = game.add.emitter(game.world.centerX, -skinManager.skin.height, 100);
	this.emitter.name = 'partyEmitter';

	this.isInDebugMode = isInDebugMode || false;
};

CardManager.prototype.createCards = function(cards){
	for(var ci = 0; ci < cards.length; ci++){
		var c = cards[ci];
		var card = game.cards[c.cid];
		if(!card){
			var options = {
				id: c.cid,
				suit: c.suit,
				value: c.value,
				debug: this.isInDebugMode
			};
			this.addCard(options);
		}
	}
};

CardManager.prototype.addCard = function(options){
	if(!options || typeof options != 'object' || !options.id){
		console.error('Card manager: incorrect options', options);
		return;
	}
	this.cards[options.id] = new Card(options);
};

CardManager.prototype.reset = function(){
	for(var cid in this.cards){
		if(this.cards.hasOwnProperty(cid)){
			this.cards[cid].base.removeAll(true);
		}
	}
	this.cards = {};
	this.cardsGroup.removeAll(true);
	game.cards = this.cards;
};

CardManager.prototype.mouseIsOverACard = function(){
	for(var ci in this.cards){
		if(!this.cards.hasOwnProperty(ci))
			continue;
		var card = this.cards[ci];
		if(card.mouseIsOver() && card.isDraggable){
			return true;
		}
	}
	return false;
};

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

CardManager.prototype.update = function(){
	for(var ci in this.cards){
		if(!this.cards.hasOwnProperty(ci))
			continue;
		this.cards[ci].update();
	}
};

CardManager.prototype.updateDebug = function(){
	for(var ci in this.cards){
		if(!this.cards.hasOwnProperty(ci))
			continue;
		this.cards[ci].updateDebug();
	}
};

CardManager.prototype.toggleDebugMode = function(){
	this.isInDebugMode = !this.isInDebugMode;
	for(var ci in this.cards){
		if(this.cards.hasOwnProperty(ci))
			this.cards[ci].isInDebugMode = this.isInDebugMode;
	}
};

//ТЕСТОВЫЕ ФУНКЦИИ

//Party time
CardManager.prototype.throwCardsStart = function(){

	this.throwCardsStop();

	var frames = [];
	for(var i = 0; i < 52; i++){
		frames.push(i);
	}
	this.emitter.maxParticleSpeed = {x: 100*game.speed, y: 500*game.speed};
	this.emitter.minParticleSpeed = {x: -100*game.speed, y: 300*game.speed};
	this.emitter.makeParticles(skinManager.skin.sheetName, frames);
	this.emitter.x = game.world.centerX;
	this.emitter.width = game.screenWidth;
	var lifespan = game.screenHeight/this.emitter.minParticleSpeed.y * 1000,
		interval = lifespan/this.emitter.maxParticles;
	this.emitter.start(false, lifespan, interval);

	game.world.setChildIndex(this.emitter, game.world.children.length - 3);
};

CardManager.prototype.throwCardsStop = function(){
	if(this.emitter.on){
		this.emitter.on = false;
	}
};

//Возвращает несколько карт в массиве
//Если не указать num, возвратит все карты
CardManager.prototype.getCards = function(num, except){
	if(!num)
		num = this.cards.length;
	var crds = [];
	for(var cid in this.cards){
		if(!this.cards.hasOwnProperty(cid))
			continue;
		var card = this.cards[cid];
		if(except && except.length && ~except.indexOf(card))
			continue;
		if(num-- <= 0)
			break;
		crds.push(card);
	}
	return crds;
};

//Возвращает одну карту, которая не входит в except
CardManager.prototype.getCard = function(except){
	var card = this.getCards(1, except);
	if(card.length)
		card = card[0];
	else
		card = null;
	return card;
};