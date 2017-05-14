//РАЗМЕЩЕНИЕ КАРТ

/**
* Добавляет карты в очередь соответствующим полям.
* @param {object} 		cardsInfo 			- Информация о перемещаемых картах
* @param {string} 		cardsInfo.cid 		- id карты
* @param {string} 		cardsInfo.pid/field - id игрока/поля
* @param {(number|null)} [cardsInfo.suit=null] - масть карты
* @param {number} 		[cardsInfo.value=0]	- значение карты
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
			continue;
		}
		if(fieldChanged){
			if(card.field){
				card.field.cardsToRemove.push(card);
			}
			var fieldId = card.fieldId;
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
* @param {object} 		cardsInfo 			- Информация о картах
* @param {string} 		cardsInfo.cid 		- id карты
* @param {(number|null)} [cardsInfo.suit=null] - масть карты
* @param {number} [cardsInfo.value=0] - значение карты
*/
FieldManager.prototype.revealCards = function(cardsInfo){
	for(var ci = 0; ci < cardsInfo.length; ci++){
		var c = cardsInfo[ci];
		var card = game.cards[c.cid];
		if(card){
			card.setValue(c.suit, c.value);		
		}
		else{
			console.warn('Field manager: Card', c.cid, 'not found');
			continue;
		}
	}
};

/**
* Перемещает карты в соответствующие поля.
* @param {Field} field - Поле, в которое происходит перемещение
* @param {object} cardsInfo - Информация о перемещаемых картах
* @param {string} cardsInfo.cid - id карты
* @param {(number|null)} [cardsInfo.suit=null] - масть карты
* @param {number} [cardsInfo.value=0] - значение карты
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
			card = game.cards[cid];
		
		if(card){
			card.presetValue(suit, value);
			var fieldChanged = card.presetField(field.id);
			if(fieldChanged){
				card.field && card.field.removeCard(card);
				cardsToPlace.push(card);
			}
		}
		else{
			console.error('Field manager: Card', cid, 'not found');
		}
	}
	return field.addCards(cardsToPlace, bringToTopOn, noDelay);
};

/**
* Показывает козырные карты.
* @param {object} cardsInfo 	Информация о картах
* @param {string} cardsInfo.cid id карты
* @param {string} cardsInfo.pid id игрока
* @param {(number|null)} [cardsInfo.suit=null] - масть карты
* @param {number} [cardsInfo.value=0] - значение карты
* @param {string} pid   		id игрока с наименьшей картой
* @return {number}      Время показа карт.
*/
FieldManager.prototype.showTrumpCards = function(cardsInfo, pid){
	
	for(var ci = 0; ci < cardsInfo.length; ci++){
		var c = cardsInfo[ci];
		var card = game.cards[c.cid];

		if(!card){
			console.error('Action handler: Card', c.cid, 'not found');
			continue;
		}

		if(pid != c.pid){
			this.fields[c.pid].setHighlight(true, ui.colors.red);
		}
		else{
			fieldManager.setTrumpSuit(c.suit);
		}

		card.raised = true;

		if(card.field.id != playerManager.pid){	
			card.presetValue(c.suit, c.value);	
		}
		card.field.placeCards(null, BRING_TO_TOP_ON.INIT, true);
	}		

	//Выделяем поле игрока с наибольшим козырем
	this.fields[pid].setHighlight(true, ui.colors.green);

	var delay = 3000/game.speed;
	actionHandler.setTimedAction(this.hideTrumpCards, delay, this, [cardsInfo]);
	return delay + 500;
};

/**
* Прячет козырные карты.
* @param {object} cardsInfo 	Информация о картах
* @param {string} cardsInfo.cid id карты
* @param {string} cardsInfo.pid id игрока
*/
FieldManager.prototype.hideTrumpCards = function(cardsInfo){
	if(!cardsInfo || !cardsInfo.length)
		return;
		
	for(var ci = 0; ci < cardsInfo.length; ci++){
		var c = cardsInfo[ci];
		var card = game.cards[c.cid];	

		if(!card){
			console.error('Action handler: Card', c.cid, 'not found');
			continue;
		}

		this.fields[c.pid].setHighlight(false);		

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