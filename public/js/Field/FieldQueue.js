// ОЧЕРЕДЬ

/**
* Добавляет карты в очередь на добавление.
* @param {Card[]} newCards        добавляемые карты
* @param {number} delay	задержка, добавляемая к первой карте в очереди
*
* @return {number} Планируемое время добавления
* @see  {@link Field#placeQueuedCards}
*/
Field.prototype.queueCards = function(newCards, delay){
	if(!newCards.length)
		return;

	var ci;

	// Если задержка не указана, используем задержку последней карты в очереди
	if(typeof delay != 'number' || isNaN(delay)){
		var lastQueuedCard = this._queuedCards[this._queuedCards.length - 1];
		if(lastQueuedCard){
			delay = this._delays[lastQueuedCard.id] || 0;
		}
		else{
			delay = 0;
		}
	}

	// Устанавливаем задержку для всех карт, равную задержке первой карты в очереди
	for(ci = 0; ci < this.cards.length; ci++){
		if(this._delays[this.cards[ci].id] === undefined){
			this._delays[this.cards[ci].id] = delay;
		}
	}

	// Устанавливаем задержку для кард в очереди, увеличивая каждую следующую
	for(ci = 0; ci < newCards.length; ci++){
		var card = newCards[ci];

		// Если карта переходит из поля, одну из карт которых перетаскивает игрок,
		// возвращаем перетаскиваемую карту
		if(cardControl.card && cardControl.card.field && cardControl.card.field == card.field){
			cardControl.cardReturn();
		}
		this._queuedCards.push(card);
		this._delays[card.id] = delay;
		delay += this.delayTime;
	}

	// Запоминаем задержку для _uninteractibleTimer
	this._expectedDelay = delay;
	return delay;
};

/**
* Размещает карты из очереди.
* @param {BRING_TO_TOP_ON} [bringToTopOn=BRING_TO_TOP_ON.START] когда поднимать карты на передний план
* @param {boolean}         [noDelay=false]                      убирает время ожидания перед добавлением карт
* @see   {@link Field#queueCards}
*/
Field.prototype.placeQueuedCards = function(bringToTopOn, noDelay){
	if(!this._queuedCards.length)
		return;
	
	this._appendCards(this._queuedCards);

	if(bringToTopOn === undefined){
		bringToTopOn = BRING_TO_TOP_ON.START;
	}
	if(this.style.sortable){
		bringToTopOn = BRING_TO_TOP_ON.START_ALL;
	}
	this._sortCards();
	this.placeCards(null, bringToTopOn, noDelay);
	this._setUninteractibleTimer(this._expectedDelay);
	this._queuedCards = [];
	this._delays = {};
	this._expectedDelay = 0;
};

/**
* Очищает очередь на добавление.
* @see  {@link Field#queueCards}
* @see  {@link Field#placeQueuedCards}
*/
Field.prototype.resetQueue = function(){
	this._queuedCards.length = 0;
	this._delays = {};
	this._expectedDelay = 0;
};
