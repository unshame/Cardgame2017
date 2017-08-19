// РАЗМЕЩЕНИЕ КАРТ

/**
* Добавляет карты в очередь соответствующим полям.
* @param {CardInfo[]} cardsInfo       информация о перемещаемых картах
* @param {boolean}    [noDelay=false] Обнуляет задержку карт. 
*                                     Рекомендуется использовать `noDelay` в {@link FieldManager#placeQueuedCards} вместо указания здесь.
*
* @return {number} Время до начала движения последней перемещаемой карты.
*/
FieldManager.prototype.queueCards = function(cardsInfo, noDelay){

	var delay = 0;
	for(var ci = 0; ci < cardsInfo.length; ci++){
		var c = cardsInfo[ci];
		var card = cardManager.cards[c.cid];
		var fieldChanged;

		if(card){
			card.presetValue(c.suit, c.value);		
			fieldChanged = card.presetField(c.field || c.pid);
		}
		else{
			console.error('Field manager: Card', c.cid, 'not found');
			connection.server.reconnect();
			return;
		}

		if(fieldChanged){
			if(card.field){
				card.field.cardsToRemove.push(card);
			}
			var fieldId = card.fieldId;
			var field = this.fields[fieldId];
			if(!field){
				console.error('Field manager: cannot queue card, field', fieldId, 'not found');
				return 0;
			}
			delay = this.fields[fieldId].queueCards([card], noDelay ? 0 : delay);
		}
		else{
			console.warn('Field manager: Card', c.cid, 'already on field', (c.field || c.pid));
		}

	}
	return delay;
};

/**
* Устанавливает значения карт без переноса в другое поле.
* @param {CardInfo[]} cardsInfo информация о картах
*/
FieldManager.prototype.revealCards = function(cardsInfo){
	for(var ci = 0; ci < cardsInfo.length; ci++){
		var c = cardsInfo[ci];
		var card = cardManager.cards[c.cid];
		if(card){
			
			if(card.fieldId == 'DISCARD_PILE'){
				card.presetValue(c.suit, c.value);
			}
			else{
				card.setValue(c.suit, c.value);						
			}
		}
		else{
			console.error('Field manager: Card', c.cid, 'not found');
			connection.server.reconnect();
			return;
		}
	}
};

/**
* Перемещает карты в соответствующие поля.
* @param {Field}           field           Поле, в которое происходит перемещение
* @param {CardInfo[]}      cardsInfo       информация о перемещаемых картах
* @param {BRING_TO_TOP_ON} [bringToTopOn]  когда поднимать карту на передний план
* @param {boolean}         [noDelay=false] Говорит полю, что перемещение не нужно задерживать
*
* @return {number} Время до начала движения последней перемещаемой карты
*/
FieldManager.prototype.moveCards = function(field, cardsInfo, bringToTopOn, noDelay){
	if(!cardsInfo || !cardsInfo.length)
		return 0;

	if(!field || !this.fields[field.id]){
		console.error('Field manager: cannot move cards to field', field);
		return 0;
	}

	var cardsToPlace = [];
	for(var i = 0; i < cardsInfo.length; i++){
		var cid = cardsInfo[i].cid,
			suit = cardsInfo[i].suit,
			value = cardsInfo[i].value, 
			fieldId = cardsInfo[i].field,
			card = cardManager.cards[cid];
		
		if(card){
			card.presetValue(suit, value);
			var fieldChanged = card.presetField(fieldId || field.id);
			if(fieldChanged){
				if(card.field){
					card.field.cardsToRemove.push(card);
				}
				cardsToPlace.push(card);
			}
		}
		else{
			console.error('Field manager: Card', cid, 'not found');
			connection.server.reconnect();
			return;
		}
	}
	this.removeMarkedCards();
	return field.addCards(cardsToPlace, bringToTopOn, noDelay);
};

/** Удаляет карты {@link Field#cardsToRemove} из соответсвующих полей. */
FieldManager.prototype.removeMarkedCards = function(){
	this.forEachField(function(field, si){
		field.removeMarkedCards();
	});
};

/** Выполняет размещение очередей карт каждого поля. */
FieldManager.prototype.placeQueuedCards = function(bringToTopOn, noDelay){
	this.forEachField(function(field){
		field.placeQueuedCards(bringToTopOn, noDelay);
	});
};