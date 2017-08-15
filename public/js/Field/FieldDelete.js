// УДАЛЕНИЕ КАРТ ИЗ ПОЛЯ

/**
* Удаляет карты из поля.
* @param  {Card[]} cardsToRemove карты для удаления
*/
Field.prototype.removeCards = function(cardsToRemove){
	if(!cardsToRemove.length)
		return;
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
	this.cardsToRemove.length = 0;
};

/** Полностью уничтожает поле, убирает все карты предварительно. */
Field.prototype.destroy = function(){
	if(this._bitmapCircle){
		this._bitmapCircle.destroy();
	}
	if(this._bitmapArea){
		this._bitmapArea.destroy();
	}
	this.removeAllCards();
	this.base.removeAll(true);
	this.base.destroy();
};

/**
* Ресет поля. Убирает все карты из поля и очереди.
*/
Field.prototype.reset = function(){
	this.validCards.length = 0;
	this.resetQueue();
	this.removeAllCards();
};