// РАЗМЕЩЕНИЕ КАРТ

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
			}{
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
* @param {Field} field - Поле, в которое происходит перемещение
* @param {CardInfo[]} cardsInfo информация о перемещаемых картах
* @param {BRING_TO_TOP_ON} [bringToTopOn] когда поднимать карту на передний план 
* @param {boolean} [noDelay=false] - Говорит полю, что перемещение не нужно задерживать
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
		var card = cardManager.cards[c.cid];

		if(!card){
			console.error('Field manager: Card', c.cid, 'not found');
			connection.server.reconnect();
			return;
		}

		if(pid != c.field){
			if(this.fields[c.field]){
				this.fields[c.field].setOwnHighlight(true, ui.colors.red);
			}
			else{
				console.error('Field manager: field', c.field, 'not found');
				continue;
			}
		}

		card.raised = true;

		if(card.field.id != playerManager.field){	
			card.presetValue(c.suit, c.value);	
		}
		card.field.placeCards(null, BRING_TO_TOP_ON.INIT, true);
	}		

	// Выделяем поле игрока с наибольшим козырем
	if(this.fields[pid]){
		this.fields[pid].setOwnHighlight(true, ui.colors.green);
	}
	else{
		console.error('Field manager: field', pid, 'not found');
	}
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
		var card = cardManager.cards[c.cid];	

		if(!card){
			console.error('Field manager: Card', c.cid, 'not found');
			connection.server.reconnect();
			continue;
		}

		this.fields[c.field].setOwnHighlight(false);		

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

/**
* Анимирует перемешивание карт, добавляя карты в колоду по окончании анимации.
* @param  {CardInfo[]} cardsInfo информация о картах
* @return {number}           Время анимации.
*/
FieldManager.prototype.fancyShuffleCards = function(cardsInfo){
	if(game.paused){
		var delay = this.queueCards(cardsInfo);
		this.placeQueuedCards();
		return delay;
	}
	var duration = 500/game.speed,
		interval = 15/game.speed,
		interval2 = 50/game.speed,
		offset = game.scale.cellHeight*2 + game.scale.gridOffset.y,
		height = this.fields[game.pid].base.y - offset,
		hx = game.screenWidth/2,
		cx = hx + height/2 - skinManager.skin.width,
		cy = height/2 + offset,
		shuffledCardsInfo = shuffleArray(cardsInfo.slice()),
		len = cardsInfo.length,
		minTime = interval * len + duration + 1000/game.speed;

	var trail = cardControl.trail;
	cardControl.trailReset();
	trail.lifespan = 1000/game.speed;

	var totalTime = (minTime + len*interval2 + trail.lifespan)*game.speed;

	function revolveCard(i, seq){
		var c = cardManager.cards[shuffledCardsInfo[i].cid];
		var rc = cardManager.cards[cardsInfo[i].cid];
		var info = cardsInfo[i];
		var delay = interval*i;	
		var da = (-0.009 + 0.005*Math.random())*game.speed;
		c.presetValue(null, 0);
		c.moveTo(cx, cy, duration*game.speed, delay*game.speed, false, true, BRING_TO_TOP_ON.START, Phaser.Easing.Cubic.In);
		c.revolveAround(hx, cy, da);
		seq.append(function(){
			rc.stopRevolving();
			var fieldId = info.field;
			this.moveCards(this.fields[fieldId], [info]);
		}, interval2, this); 
	}

	gameSeq.start(function(seq){
		seq.append(function(){
			trail.x = hx;
			trail.y = height/2 + offset;
			trail.lifespan = 1000/game.speed;
			trail.interval = 10;
			trail.maxParticles = Math.ceil(trail.lifespan / trail.interval);
			trail.makeParticles(skinManager.skin.trailName, [0, 1, 2, 3]);
			ui.background.add(trail);
			trail.width = trail.height = height/2 - skinManager.skin.width*1.5;
			trail.start(false, trail.lifespan, trail.interval);
		}, minTime - duration);
		for(var i = 0; i < cardsInfo.length; i++){
			revolveCard.call(this, i, seq);
		}
		seq.append(function(){
			trail.on = false;
		}, trail.lifespan)
		.then(function(){
			cardControl.trailReset();
		});
	}, duration, 0, this);
	return totalTime;
};
