/* Менеджер карт */

var CardManager = function(isInDebugMode){
	this.cards = {};
	this.cardsGroup = game.add.group();
	game.cards = this.cards;
	game.cardsGroup = this.cardsGroup;

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
				fieldId: c.field || c.pid,
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

CardManager.prototype.update = function(){
	for(var ci in this.cards){
		if(!this.cards.hasOwnProperty(ci))
			continue;
		this.cards[ci].update();
	}
};

CardManager.prototype.updateDebug = function(){
	for(var ci in game.cards){
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
