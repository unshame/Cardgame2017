
//ОЧЕРЕДЬ

/**
* Добавляет карты в очередь на добавление.
* @param  {Card[]} newCards добавляемые карты
* @param  {number} delay	задержка, добавляемая к первой карте в очереди
* @return {number}		  Планируемое время добавления
* @see  {@link Field#placeQueuedCards}
*/
Field.prototype.queueCards = function(newCards, delay){
	if(!newCards.length)
		return;

	var ci;

	//Если задержка не указана, используем задержку последней карты в очереди
	if(typeof delay != 'number' || isNaN(delay)){
		var lastQueuedCard = this.queuedCards[this.queuedCards.length - 1];
		if(lastQueuedCard)
			delay = this.delays[lastQueuedCard.id] || 0;
		else
			delay = 0;
	}

	//Устанавливаем задержку для всех карт, равную задержке первой карты в очереди
	for(ci = 0; ci < this.cards.length; ci++){
		if(this.delays[this.cards[ci].id] === undefined)
			this.delays[this.cards[ci].id] = delay;
	}

	//Устанавливаем задержку для кард в очереди, увеличивая каждую следующую
	for(ci = 0; ci < newCards.length; ci++){
		var card = newCards[ci];

		//Если карта переходит из поля, одну из карт которых перетаскивает игрок,
		//возвращаем перетаскиваемую карту
		if(cardControl.card && cardControl.card.field && cardControl.card.field == card.field)
			cardControl.cardReturn();
		this.queuedCards.push(card);
		this.delays[card.id] = delay;
		delay += this.delayTime;
	}

	//Запоминаем задержку для uninteractibleTimer
	this.expectedDelay = delay;
	return delay;
};

/**
* Размещает карты из очереди.
* @see  {@link Field#queueCards}
*/
Field.prototype.placeQueuedCards = function(){
	if(!this.queuedCards.length)
		return;
	
	this._appendCards(this.queuedCards);
	var bringToTopOn; 
	if(this.type == 'DECK')
		bringToTopOn = BRING_TO_TOP_ON.INIT;
	else if(this.sorted)
		bringToTopOn = BRING_TO_TOP_ON.END_ALL;
	else
		bringToTopOn = BRING_TO_TOP_ON.START;
	this._sortCards();
	this.placeCards(null, bringToTopOn);
	this.setUninteractibleTimer(this.expectedDelay);
	this.queuedCards = [];
	this.delays = {};
	this.expectedDelay = 0;
};

/**
* Очищает очередь на добавление.
* @see  {@link Field#queueCards}
* @see  {@link Field#placeQueuedCards}
*/
Field.prototype.resetQueue = function(){
	this.queuedCards = [];
	this.delays = {};
	this.expectedDelay = 0;
};
