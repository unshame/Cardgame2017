/**
 * Менеджер карт
 * 
 * Тестовые функции:
 * throwCards - разлетающиеся карты
 * getCards(num, except) - выбирает num карт из cards, пропускает карты из except
 * getCard(except) - выбирает одну карту из cards, пропускает карты из except
 * @class
 */

var CardManager = function(isInDebugMode){
	this.cards = {};
	this.cardsGroup = game.add.group();
	this.cardsGroup.name = 'cards';
	game.cards = this.cards;
	game.cardsGroup = this.cardsGroup;
	this.emitter = game.add.emitter(game.world.centerX, -skinManager.skin.height, 100);
	this.emitter.name = 'partyEmitter';
	var frames = [];
	for(var i = 0; i < 52; i++){
		frames.push(i);
	}
	this.emitter.makeParticles(skinManager.skin.sheetName, frames);

	this.isInDebugMode = isInDebugMode || false;
};

CardManager.prototype.createCards = function(cards){
	for(var ci = 0; ci < cards.length; ci++){
		var c = cards[ci];
		var card = this.cards[c.cid];
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
			this.cards[cid].destroy();
			delete this.cards[cid];
		}
	}
};

CardManager.prototype.cursorIsOverACard = function(){
	for(var ci in this.cards){
		if(!this.cards.hasOwnProperty(ci))
			continue;
		var card = this.cards[ci];
		if(card.cursorIsOver() && card.isDraggable){
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

CardManager.prototype.applySkin = function(){
	for(var ci in this.cards){
		if(this.cards.hasOwnProperty(ci)){
			var card = this.cards[ci]; 
			card.skin = skinManager.skin;
			card.applySkin();
		}
	}
	this.emitter.minParticleScale = this.emitter.maxParticleScale = skinManager.skin.scale;
	this.emitter.forEach(function(p){
		p.loadTexture(skinManager.skin.sheetName);
	}, this);
};

CardManager.prototype.forceSetValues = function(){
	for(var ci in this.cards){
		if(this.cards.hasOwnProperty(ci)){
			var card = this.cards[ci]; 
			card.setValue(card.suit, card.value, false);
		}
	}

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
CardManager.prototype.throwCardsStart = function(minSpeed, maxSpeed, sway, interval, rotation, gravity){

	this.throwCardsStop();

	if(minSpeed === undefined)
		minSpeed = this.emitter.minParticleSpeed.y;
	if(maxSpeed === undefined)
		maxSpeed = this.emitter.maxParticleSpeed.y;
	if(sway === undefined)
		sway = this.emitter.sway;
	else
		this.emitter.sway = sway;
	if(rotation === undefined)
		rotation = this.emitter.maxRotation;
	if(gravity !== undefined)
		this.emitter.gravity = gravity;
	if(interval === undefined)
		interval = this.emitter.interval;

	this.emitter.minParticleSpeed = {x: -sway*game.speed, y: minSpeed*game.speed};
	this.emitter.maxParticleSpeed = {x: sway*game.speed, y: maxSpeed*game.speed};
	this.emitter.minRotation = -rotation;
	this.emitter.maxRotation = rotation;
	this.emitter.x = game.world.centerX;
	this.emitter.width = game.screenWidth;
	function solveQuadtraticEq(a, b, c) {
		return Math.abs((-1 * b + Math.sqrt(Math.pow(b, 2) - (4 * a * c))) / (2 * a));
	}
	
	var lifespan = solveQuadtraticEq(this.emitter.gravity/2, minSpeed, -(game.screenHeight + skinManager.skin.height*2))*1000;
	if(interval === false)
		interval = lifespan/this.emitter.maxParticles;
	this.emitter.interval = interval;
	this.emitter.start(false, lifespan, interval, undefined, undefined);

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

CardManager.prototype.enablePhysics = function(makeDraggable){

	//Ставим стопку сброса по центру экрана (for fun)
	var position = grid.at(4, Math.floor(grid.numRows/2)-1, 0, 0, 'middle left'),
		field = fieldManager.fields.DISCARD_PILE;
	field.axis = 'horizontal';
	field.direction = 'forward';
	field.forcedSpace = false;
	field.resize((grid.numCols-8)*grid.cellWidth)
	field.setBase(position.x, position.y, true);

	for(var cid in this.cards){
		if(!this.cards.hasOwnProperty(cid))
			continue;
		var card = this.cards[cid];
		if(makeDraggable)
			card.setDraggability(true);
		else
			card.setDraggability(false);
		game.physics.arcade.enable(card.sprite);
	}
}