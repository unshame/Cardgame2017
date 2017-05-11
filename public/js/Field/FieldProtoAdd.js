
//ДОБАВЛЕНИЕ КАРТ

/**
* Добавляет карты в поле.
* @param {Card[]} newCards - добавляемые карты
* @param {boolean} noDelay  - убирает время ожидание перед добавлением карт
* @return {number} Время добавления
*/
Field.prototype.addCards = function(newCards, noDelay){

	if(!newCards.length)
		return;

	if(this.queuedCards.length){
		var lastQueuedCard = this.queuedCards[this.queuedCards.length - 1];
		var delay = this.delays[lastQueuedCard.id] || 0;
		delay += this.delayTime;
		this.queueCards(newCards, delay);
		this.placeQueuedCards();
		delay += (this.queuedCards.length - 1)*this.delayTime;
		return delay;
	}
	else{
		this._appendCards(newCards);
		this._sortCards();
		this.setUninteractibleTimer(newCards.length * this.delayTime);
		return this.placeCards(newCards, BRING_TO_TOP_ON.START, noDelay);
	}
};

/**
* Добавляет одну карту в поле.
* @param {Card} card - добавляемая карта
* @return {number} Время добавления
* @see {@link Field#addCards}
*/
Field.prototype.addCard = function(card){
	return this.addCards([card]);
};

/**
* Добавляет карты в `{@link Field#cards}`.
* Вычисляет и сохраняет угол карты в `{@link Field#angles}`, если указан `{@link Field#randomAngle}`.
* @private
* @param  {Card[]} cards карты для добавления
*/
Field.prototype._appendCards = function(cards){

	var card, ci,
		addedAngle,
		lastAngle = this.randomAngle ? Math.floor(Math.random()*10)* (Math.random() > 0.5 ? 1 : -1) - 12 : undefined;

	//Находим угол последней карты
	if(this.randomAngle){		
		for(ci = 0; ci < this.cards.length; ci++){
			card = this.cards[ci];
			if(typeof this.angles[card.id] == 'number')
				lastAngle = this.angles[card.id];
		}
	}

	for(ci = 0; ci < cards.length; ci++){
		card = cards[ci];
		card.field = this;
		if(this.addTo == 'front')
			this.cards.push(card);
		else
			this.cards.unshift(card);

		//Сохраняем новый угол карты
		if(this.randomAngle){
			addedAngle = (Math.floor(Math.random()*5) + 8);
			if(this.randomAngle == 'bi' && Math.random() > 0.5 || this.randomAngle != 'bi' && this.direction == 'backward'){
				addedAngle = -addedAngle;
			}
			lastAngle += addedAngle;
			this.angles[card.id] = lastAngle;
		}
	}
};
