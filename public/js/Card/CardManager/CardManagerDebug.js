// ДЕБАГ

CardManager.prototype.updateDebug = function(){
	for(var ci in this.cards){
		if(!this.cards.hasOwnProperty(ci)){
			continue;
		}
		this.cards[ci].updateDebug();
	}
};

CardManager.prototype.toggleDebugMode = function(){
	this.inDebugMode = !this.inDebugMode;
	options.set('debug_cards', this.inDebugMode);
	options.save();
	for(var ci in this.cards){
		if(this.cards.hasOwnProperty(ci)){
			this.cards[ci].inDebugMode = this.inDebugMode;
		}
	}
	ui.setDebugButtonText('cards', 'Cards', this.inDebugMode);
};



// ТЕСТОВЫЕ ФУНКЦИИ

/**
* Возвращает несколько карт, которые не входят в `except`.
* @param {number} [num=this.cards.length] желаемое количество карт
* @param {Card[]} [except]                игнорируемые карты
*
* @return {Card[]} Карты.
*/
CardManager.prototype.getCards = function(num, except){
	if(!num){
		num = this.cards.length;
	}
	var crds = [];
	for(var cid in this.cards){
		if(!this.cards.hasOwnProperty(cid)){
			continue;
		}
		var card = this.cards[cid];
		if(except && except.length && ~except.indexOf(card)){
			continue;
		}
		if(num-- <= 0){
			break;
		}
		crds.push(card);
	}
	return crds;
};

/**
* Возвращает одну карту, которая не входит в `except`.
* @param {Card[]} [except] игнорируемые карты
*
* @return {Card} Карта.
*/
CardManager.prototype.getCard = function(except){
	var card = this.getCards(1, except);
	if(card.length){
		card = card[0];
	}
	else{
		card = null;
	}
	return card;
};
