var Spot = function(options){
	this.options = {
		id:null,
		x:0,
		y:0,
		width:800,
		height:300,
		type:'HAND'
	};
	for(o in options){
		if(options.hasOwnProperty(o))
			this.options[o] = options[o];
	}
	this.base = game.add.group();
	this.base.x = this.options.x;
	this.base.y = this.options.y;
	this.area = game.add.tileSprite(0, 0, this.options.width, this.options.height, 'spot');
	this.base.add(this.area);
	game.world.setChildIndex(this.base, 1);
	this.cardsGroup = game.add.group();
	this.cards = [];
}

Spot.prototype.sortCards = function(){
	this.cards.sort(this.comparator);
}

Spot.prototype.comparator = function(a, b){
	if(!a.suit && a.suit !== 0){
		if(b.suit || b.suit === 0)
			return -1
		else
			return 0
	}
	if(!b.suit && b.suit !== 0){
		if(a.suit || a.suit === 0)
			return 1
		else
			return 0
	}
	if(a.suit == b.suit){
		if(a.value == b.value)
			return 0
		else if(a.value > b.value)
			return 1
		else
			return -1;
	}
	else if(a.suit > b.suit)
		return 1
	else
		return -1;
}

Spot.prototype.addCards = function(cards){
	for(ci in cards){
		var card = cards[ci];
		card.spot = this;
		this.cards.push(card);
	}
	this.sortCards();
	this.placeCards(cards);
}

Spot.prototype.placeCards = function(newCards, delayStray){
	this.spaceWidth = this.area.width/this.cards.length;
	di = 0;
	for(ci in this.cards){
		var i = Number(ci);
		var card = this.cards[ci];		
		var x = this.spaceWidth*i + card.sprite.width/4 + this.base.x;
		var y = this.base.y + this.area.height/2;
		if(newCards && ~newCards.indexOf(card) || delayStray && (card.base.x != x || card.base.y != y))
			di++;
		card.moveTo(x, y, 200, 50*di, false, true);
	}
}

Spot.prototype.reset = function(){
	this.cards = [];
}