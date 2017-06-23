//РАЗМЕЩЕНИЕ КАРТ

/**
* Добавляет карты в очередь соответствующим полям.
* @param {CardInfo[]} cardsInfo информация о перемещаемых картах
* @param {boolean} [noDelay=false] Обнуляет задержку карт.
* Рекомендуется использовать `noDelay` в {@link FieldManager#placeQueuedCards} вместо указания здесь.
* @return {number} Время до начала движения последней перемещаемой карты.
*/
FieldManager.prototype.queueCards = function(cardsInfo, noDelay){

	var delay = 0;
	for(var ci = 0; ci < cardsInfo.length; ci++){
		var c = cardsInfo[ci];
		var card = game.cards[c.cid];
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
			console.log(fieldId)
			if(fieldId == 'BOTTOM')
				fieldId = 'DECK';
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
		var card = game.cards[c.cid];
		if(card){
			card.setValue(c.suit, c.value);		
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
* @param {Field} field - Поле, в которое происходит перемещение
* @param {CardInfo[]} cardsInfo информация о перемещаемых картах
* @param {BRING_TO_TOP_ON} [bringToTopOn] когда поднимать карту на передний план 
* @param {boolean} [noDelay=false] - Говорит полю, что перемещение не нужно задерживать
* @return {number} Время до начала движения последней перемещаемой карты
*/
FieldManager.prototype.moveCards = function(field, cardsInfo, bringToTopOn, noDelay){
	if(!cardsInfo.length)
		return 0;

	var cardsToPlace = [];
	for(var i = 0; i < cardsInfo.length; i++){
		var cid = cardsInfo[i].cid,
			suit = cardsInfo[i].suit,
			value = cardsInfo[i].value, 
			fieldId = cardsInfo[i].field,
			card = game.cards[cid];
		
		if(card){
			card.presetValue(suit, value);
			var fieldChanged = card.presetField(fieldId || field.id);
			if(fieldChanged){
				if(card.field){
					card.field.removeCards([card]);
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
	return field.addCards(cardsToPlace, bringToTopOn, noDelay);
};

/**
* Показывает козырные карты.
* @param {CardInfo[]} cardsInfo информация о картах
* @param {string} pid   		id игрока с наименьшей картой
* @return {number}      Время показа карт.
*/
FieldManager.prototype.showTrumpCards = function(cardsInfo, pid){
	
	for(var ci = 0; ci < cardsInfo.length; ci++){
		var c = cardsInfo[ci];
		var card = game.cards[c.cid];

		if(!card){
			console.error('Field manager: Card', c.cid, 'not found');
			connection.server.reconnect();
			return;
		}

		if(pid != c.pid){
			this.fields[c.pid].setOwnHighlight(true, ui.colors.red);
		}

		card.raised = true;

		if(card.field.id != playerManager.pid){	
			card.presetValue(c.suit, c.value);	
		}
		card.field.placeCards(null, BRING_TO_TOP_ON.INIT, true);
	}		

	//Выделяем поле игрока с наибольшим козырем
	this.fields[pid].setOwnHighlight(true, ui.colors.green);
};

/**
* Прячет козырные карты.
* @param {CardInfo[]} cardsInfo информация о картах
*/
FieldManager.prototype.hideTrumpCards = function(cardsInfo){
	if(!cardsInfo || !cardsInfo.length)
		return;
		
	for(var ci = 0; ci < cardsInfo.length; ci++){
		var c = cardsInfo[ci];
		var card = game.cards[c.cid];	

		if(!card){
			console.error('Field manager: Card', c.cid, 'not found');
			connection.server.reconnect();
			continue;
		}

		this.fields[c.pid].setOwnHighlight(false);		

		card.raised = false;

		if(!card.field){
			continue;
		}

		if(card.field.id != playerManager.pid){					
			card.presetValue(null, null);
		}
		card.field.placeCards(null, BRING_TO_TOP_ON.INIT, true);
	}			
};