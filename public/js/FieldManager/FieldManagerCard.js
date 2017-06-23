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

FieldManager.prototype.fancyShuffleCards = function(cardsInfo){
	var duration = 500;
	var interval = 15;
	var interval2 = 100;
	var offset = grid.cellHeight*2 + grid.offset.y;
	var height = this.fields[game.pid].base.y - offset;
	var hx = game.screenWidth/2;
	var cx = hx + height/2 - skinManager.skin.width;
	var cy = height/2 + offset;
	var shuffledCardsInfo = shuffleArray(cardsInfo.slice());
	var i = 0;
	var len = cardsInfo.length;
	var minTime = interval * len + 1500;

	var totalTime = minTime + cardsInfo.length*interval2 + cardsInfo.length*interval;
	var trail = game.add.emitter(hx, height/2 + offset);
	background.add(trail);
	var fader;
	trail.lifespan = 1500;

	function revolveCard(i, seq){
		var c = cardManager.cards[shuffledCardsInfo[i].cid];
		var rc = cardManager.cards[cardsInfo[i].cid];
		var info = cardsInfo[i];
		var delay = interval*i;	
		var da = -0.009 + 0.005*Math.random();
		c.presetValue(null, 0);
		c.moveTo(cx, cy, duration, delay, false, true, BRING_TO_TOP_ON.START, Phaser.Easing.Circular.In);
		c.revolveAround(hx, cy, da);
		seq.append(function(){
			rc.stopRevolving();
			var fieldId = info.field;
			if(fieldId == 'BOTTOM'){
				fieldId = 'DECK';
			}
			this.moveCards(this.fields[fieldId], [info]);
		}, interval2, this); 
	}

	gameSeq.start(function(seq){
		seq.append(function(){
			trail.width = trail.height = height/2 - skinManager.skin.width*1.5;
			trail.makeParticles(skinManager.skin.trailName, [0, 1, 2, 3]);
			trail.gravity = 0;
			trail.interval = 20;
			trail.maxParticles = Math.ceil(trail.lifespan / trail.interval);
			trail.start(false, trail.lifespan, trail.interval);
			trail.alpha = 0.6;
			fader = setInterval(function(){
				trail.forEachAlive(function(p){
					p.alpha = p.lifespan / trail.lifespan;
				});
			}, 30)
		}, minTime - duration)
		for(var i = 0; i < cardsInfo.length; i++){
			revolveCard.call(this, i, seq)
		}
		seq.append(function(){
			trail.on = false;
		}, trail.lifespan)
		.then(function(){
			clearInterval(fader);
			trail.destroy();
		})
	}, duration, 0, this);
	return totalTime + 500;
}