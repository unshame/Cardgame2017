//УДАЛЕНИЕ КАРТ ИЗ ПОЛЯ

/**
* Удаляет карты из поля.
* @param  {Card[]} cardsToRemove карты для удаления
*/
Field.prototype.removeCards = function(cardsToRemove){
	for(var ci = cardsToRemove.length - 1; ci >= 0; ci--){
		var card = cardsToRemove[ci];
		var i = this.cards.indexOf(card);
		if(~i){
			if(this.focusedCard && this.focusedCard == card)
				this.focusedCard = null;
			this.cards.splice(i, 1);
			card.field = null;
			if(card.fieldId == this.id)
				card.fieldId = null;
			this._angles[card.id] = null;
		}
		else{
			console.warn('Card not found in', this.id, ':', card.id, card.field, card.fieldId);
		}
	}
	if(this.cards.length){
		var bringToTopOn = (this.type == 'DECK') ? BRING_TO_TOP_ON.NEVER : BRING_TO_TOP_ON.END;
		this._sortCards();
		this.placeCards(null, bringToTopOn);
	}
};

/**
* Удаляет карты из `{@link Field#cardsToRemove}`.
*/
Field.prototype.removeMarkedCards = function(){
	this.removeCards(this.cardsToRemove);
	this.cardsToRemove.length = 0;
};

/**
* Удаляет все карты из поля.
* @see  {@link Field#removeCards}
*/
Field.prototype.removeAllCards = function(){
	this.removeCards(this.cards);
};

/**
* Удаляет одну карту из поля.
* @param  {Card} cardToRemove карта для удаления
* @see  {@link Field#removeCards}
*/
Field.prototype.removeCard = function(cardToRemove){
	this.removeCards([cardToRemove]);
};

/**
* Полностью уничтожает поле, убирае все карты предварительно.
*/
Field.prototype.destroy = function(){
	this.removeAllCards();
	this.area.kill();
	this.base.removeAll(true);
	game.world.removeChild(this.base);
};
