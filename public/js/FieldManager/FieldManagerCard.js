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
* Также анимирует появления полей игроков и подсвечивает поля стола.
* @param  {CardInfo[]} cardsInfo информация о картах
* @return {number}           Время анимации.
*/
FieldManager.prototype.fancyShuffleCards = function(cardsInfo){

	if(game.paused){
		this.endFieldAnimations();
		var delay = this.queueCards(cardsInfo);
		this.placeQueuedCards();
		return delay;
	}
	var	playerField = this.fields[game.pid];
	// если поле игрока будет анимироваться, нужно это учесть в радиусе вращения карт
	var animOffset = playerField._entranceTween ? playerField.area.height : 0;
	var gameSpeed = game.speed; // анимация будет проходить с этим множителем

	// this was a mistake
	var duration = 500/gameSpeed,	// время передвижения карты в позицию из которой они будут вращаться
		interval = 15/gameSpeed,	// интервал между началом передвижения карт в эту позицию
		interval2 = 50/gameSpeed;	// интервал между началом движения карт в колоду

	var offset = game.scale.cellHeight*2 + game.scale.gridOffset.y,		// отступ сверху до верхней границы вращения
		maxHeight = game.screenWidth - game.scale.cellWidth*4,
		height = playerField.base.y - animOffset - offset;	// высота ограничивающая вращение
	if(height > maxHeight){
		height = maxHeight;
		offset = game.screenHeight/2 - offset - height/2;
	}
	var hx = game.screenWidth/2,						// позиция по горизонтали вокруг которой вращаются карты
		cx = hx + height/2 - skinManager.skin.width,	// позиция по горизонтали откуда начнут вращаться карты
		cy = height/2 + offset;							// позиция по вертикали откуда начнут вращаться карты и вокруг которой вращаются карты

	var shuffledCardsInfo = shuffleArray(cardsInfo.slice()),	// перемешанный массив с информацией о картах
		len = cardsInfo.length;	

	// Используем хвост карты в анимации с измененными свойствами
	var trail = cardControl.trail;
	cardControl.trailReset();
	var trailLifespan = 1000/gameSpeed;

	var tableLitTime = 500;		// Время остановки на подсвеченном столе
	var tableLightOutTime = 500;	// Время отключения подсветки стола
	// Минимальное время до перемещения карт в колоду
	var minTime = interval * len + duration + 1000/gameSpeed;
	// Полное время анимации
	var totalTime = minTime + len*interval2 + trailLifespan + tableLitTime + tableLightOutTime;

	// Поля, которые нужно будет анимировать
	var fields = [].concat(
		playerField,
		this.opponents,
		this.fields.DISCARD_PILE
	);
	// Поля стола, которые будут подсвечены
	var tables = this.builder.tableOrder.map(function(i){
		return this.table[i];
	}, this);
	var timeForTables = trailLifespan,		// Время подсветки стола
		timePerField = (totalTime - timeForTables - 1000)/fields.length,	// Время между анимацией двух полей
		timePerTable = timeForTables/tables.length;					// Время между подсветкой двух полей стола
	// Анимируем поля с задержкой асинхронно остальной анимации
	fields.forEach(function(f, i){
		f.animateAppearance(timePerField*i);
	});

	// Передвигает карту из перемешанного массива в точку начала вращения, запускает вращение
	// и планирует перемещение карты из неперемешанного массива в колоду
	function revolveCard(i, seq){
		var c = cardManager.cards[shuffledCardsInfo[i].cid]; // перемешанная карта		
		var rc = cardManager.cards[cardsInfo[i].cid];		 // неперемешанная карта
		var info = cardsInfo[i];
		var delay = interval*i;		// задержка до перемешения в точку врашения
		var da = (-0.009 + 0.005*Math.random())*gameSpeed;	// скорость вращения

		c.presetValue(null, 0);
		c.moveTo(cx, cy, duration*gameSpeed, delay*gameSpeed, false, true, BRING_TO_TOP_ON.START, Phaser.Easing.Cubic.In);
		c.revolveAround(hx, cy, da);

		seq.append(function(){
			rc.stopRevolving();
			var fieldId = info.field;
			this.moveCards(this.fields[fieldId], [info]);
		}, interval2, this); 
	}

	/*
	*  Ход анимации: 
	*  Карты перемещаются в точку начала вращения с interval, где они вращаются
	*  В это же время анимируются поля игроков
	*  Как только первая карта достигла точки вращения, запускается эмиттер
	*  Спустя секунду как все карты достигли точки вращения, они начинают перемещаться в колоду с interval2
	*  Как только последняя карта отправилась в колоду, выключается эмиттер
	*  Здесь заканчивается анимация полей игроков
	*  После этого подсвечиваются и выключаются поля стола
	*  Конец анимации, ресет эмиттера
	*/

	game.seq.start(function(seq){
		// Меняем свойства хвоста карты, ставим его в центр вращения 
		// и планируем запуск сразу как первая карта достигнет точки вращения
		seq.append(function(){
			trail.x = hx;
			trail.y = height/2 + offset;
			trail.lifespan = trailLifespan;
			trail.interval = 10;

			trail.maxParticles = Math.ceil(trail.lifespan / trail.interval);
			trail.makeParticles(skinManager.skin.trailName, [0, 1, 2, 3]);

			// Добавляем хвост к фону, чтобы он был за картами
			ui.background.add(trail);

			trail.width = trail.height = height/2 - skinManager.skin.width*1.5;
			trail.start(false, trail.lifespan, trail.interval);
		}, minTime - duration);

		// Запускаем перемещение и вращение карт, планируем перемешения в колоду
		for(var i = 0; i < cardsInfo.length; i++){
			revolveCard.call(this, i, seq);
		}

		// выключаем эмиттер хвоста карты
		seq.append(function(){
			trail.on = false;		
		}, 0);

		// Подсвечиваем стол
		tables.forEach(function(t, i){
			if(i == tables.length - 1){
				timePerTable += tableLitTime;
			}
			seq.append(function(){
				t.setOwnPlayability(true);
			}, timePerTable);
		});

		// Выключаем подсветку стола
		timePerTable = tableLightOutTime/tables.length;
		tables.forEach(function(t, i){
			seq.append(function(){
				t.setOwnPlayability(false);
			}, timePerTable);
		});

		// Завершаем анимацию и ресетим хвост карты
		seq.append(function(){
			fields.forEach(function(f){
				f.endAnimation();
			});
			cardControl.trailReset();
		});

	}, duration, 0, this);
	return totalTime*gameSpeed;
};
