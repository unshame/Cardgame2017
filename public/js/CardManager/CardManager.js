/**
* Менеджер карт
* 
* Тестовые функции:
* emitter - разлетающиеся карты
* getCards(num, except) - выбирает num карт из cards, пропускает карты из except
* getCard(except) - выбирает одну карту из cards, пропускает карты из except
* @class
*/

var CardManager = function(inDebugMode){
	this.cards = {};
	this.cardsGroup = game.add.group();
	this.cardsGroup.name = 'cards';
	this.physicsEnabled = false;
	game.cards = this.cards;
	game.cardsGroup = this.cardsGroup;
	this.emitter = game.add.emitter(game.world.centerX, -skinManager.skin.height, 100);
	this.emitter.name = 'partyEmitter';
	var frames = [];
	for(var i = 0; i < 52; i++){
		frames.push(i);
	}
	this.emitter.makeParticles(skinManager.skin.sheetName, frames);
	this.particleFadeTime = 500;

	this.inDebugMode = inDebugMode || false;
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
				debug: this.inDebugMode
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
		}
	}
};

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
	if(this.emitter.on){
		this.emitterRestart();
		setTimeout(this._applySkinToEmitter.bind(this), this.particleFadeTime);
	}
};

CardManager.prototype._applySkinToEmitter = function(){
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
	this.inDebugMode = !this.inDebugMode;
	for(var ci in this.cards){
		if(this.cards.hasOwnProperty(ci))
			this.cards[ci].inDebugMode = this.inDebugMode;
	}
};

//CardManagerEmitter

//ТЕСТОВЫЕ ФУНКЦИИ

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
