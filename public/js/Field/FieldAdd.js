
//ДОБАВЛЕНИЕ КАРТ

/**
* Добавляет карты в поле.
* @param {Card[]} newCards добавляемые карты
* @param  {BRING_TO_TOP_ON} [bringToTopOn=BRING_TO_TOP_ON.START] когда поднимать карты на передний план
* @param {boolean} [noDelay=false]  убирает время ожидания перед добавлением карт
* @return {number} Время добавления
*/
Field.prototype.addCards = function(newCards, bringToTopOn, noDelay){

	if(!newCards.length)
		return;

	if(bringToTopOn === undefined)
		bringToTopOn = BRING_TO_TOP_ON.START;
	if(this.style.sortable){
		bringToTopOn = BRING_TO_TOP_ON.END_ALL;
	}

	if(this._queuedCards.length){
		var lastQueuedCard = this._queuedCards[this._queuedCards.length - 1];
		var delay = this._delays[lastQueuedCard.id] || 0;
		delay += this.delayTime;
		this.queueCards(newCards, delay);
		this.placeQueuedCards(bringToTopOn, noDelay);
		delay += (this._queuedCards.length - 1)*this.delayTime;
		return delay;
	}
	else{
		this._appendCards(newCards);
		this._sortCards();
		this.setUninteractibleTimer(newCards.length * this.delayTime);
		return this.placeCards(newCards, bringToTopOn, noDelay);
	}
};

/**
* Добавляет одну карту в поле.
* @param {Card} card - добавляемая карта
* @param  {BRING_TO_TOP_ON} [bringToTopOn] когда поднимать карту на передний план
* @return {number} Время добавления
* @see {@link Field#addCards}
*/
Field.prototype.addCard = function(card, bringToTopOn){
	return this.addCards([card], bringToTopOn);
};

/**
* Добавляет карты в {@link Field#cards}.
* Вычисляет и сохраняет угол карты в {@link Field#_angles}, если указан {@link Field#randomAngle}.
* @private
* @param  {Card[]} cards карты для добавления
*/
Field.prototype._appendCards = function(cards){

	var card, ci,
		addedAngle,
		lastAngle = this.style.randomAngle ? Math.floor(Math.random()*10)* (Math.random() > 0.5 ? 1 : -1) - 12 : undefined;

	//Находим угол последней карты
	if(this.style.randomAngle){		
		for(ci = 0; ci < this.cards.length; ci++){
			card = this.cards[ci];
			if(typeof this._angles[card.id] == 'number')
				lastAngle = this._angles[card.id];
		}
	}

	for(ci = 0; ci < cards.length; ci++){
		card = cards[ci];
		card.field = this;
		if(this.style.addTo == 'front')
			this.cards.push(card);
		else
			this.cards.unshift(card);

		//Сохраняем новый угол карты
		if(this.style.randomAngle){
			addedAngle = (Math.floor(Math.random()*5) + 8);
			if(this.style.randomAngle == 'bi' && Math.random() > 0.5 || this.style.randomAngle != 'bi' && this.style.direction == 'backward'){
				addedAngle = -addedAngle;
			}
			lastAngle += addedAngle;
			this._angles[card.id] = lastAngle;
		}
	}
};
