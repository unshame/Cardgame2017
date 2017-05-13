//ДЕБАГ

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
