/**
* Показывает козырные карты.
* @param {CardInfo[]} cardsInfo информация о картах
* @param {string}     pid       id игрока с наименьшей картой
*
* @return {number} Время показа карт.
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

		if(c.field == pid){
			card.setHighlight(true, ui.colors.green);
		}

		card.raised = true;

		if(card.field.id != gameInfo.field){	
			card.presetValue(c.suit, c.value);	
		}
		card.field.placeCards(null, BRING_TO_TOP_ON.INIT, true);
	}
};

/**
* Прячет козырные карты.
* @param {CardInfo[]} cardsInfo информация о картах
*/
FieldManager.prototype.hideTrumpCards = function(cardsInfo){
	if(!cardsInfo || !cardsInfo.length){
		return;
	}
		
	for(var ci = 0; ci < cardsInfo.length; ci++){
		var c = cardsInfo[ci];
		var card = cardManager.cards[c.cid];	

		if(!card){
			console.error('Field manager: Card', c.cid, 'not found');
			connection.server.reconnect();
			continue;
		}

		card.raised = false;
		card.setHighlight(false);

		if(!card.field){
			continue;
		}

		if(card.field.id != gameInfo.pid){					
			card.presetValue(null, null);
		}
		card.field.placeCards(null, BRING_TO_TOP_ON.INIT, true);
	}			
};


/**
* Анимирует перемешивание карт, добавляя карты в колоду по окончании анимации.
* Также анимирует появления полей игроков и подсвечивает поля стола.
* @param {CardInfo[]} cardsInfo информация о картах
*
* @return {number} Время анимации.
*/
FieldManager.prototype.fancyShuffleCards = function(seq, cardsInfo, trumpSuit){

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
		height = playerField.y - animOffset - offset;	// высота ограничивающая вращение
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
	var minTime = interval * len + duration + 500/gameSpeed;
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
	function revolveCard(i, lastStep){
		var c = cardManager.cards[shuffledCardsInfo[i].cid]; // перемешанная карта		
		var rc = cardManager.cards[cardsInfo[i].cid];		 // неперемешанная карта
		var info = cardsInfo[i];
		var delay = interval*i;		// задержка до перемешения в точку врашения
		var da = (-0.009 + 0.005*Math.random())*gameSpeed;	// скорость вращения

		c.presetValue(null, 0);
		c.moveTo(cx, cy, duration*gameSpeed, delay*gameSpeed, false, true, BRING_TO_TOP_ON.START, Phaser.Easing.Cubic.In);
		c.revolveAround(hx, cy, da);

		return lastStep.then(function(){
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

	seq.append(function(seq){
		// Меняем свойства хвоста карты, ставим его в центр вращения 
		// и планируем запуск сразу как первая карта достигнет точки вращения
		var lastStep = seq.append(function(){
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
			lastStep = revolveCard.call(this, i, lastStep);
		}

		lastStep = lastStep.then(function(){
			// выключаем эмиттер хвоста карты
			trail.on = false;

			// Добавляем колоде текстуру, обозначающую текущую козырную масть
			if(trumpSuit || trumpSuit === 0){
				this.setTrumpSuit(trumpSuit);
			}
		}, 0, this);

		// Подсвечиваем стол
		tables.forEach(function(t, i){
			if(i == tables.length - 1){
				timePerTable += tableLitTime;
			}
			lastStep = lastStep.then(function(){
				t.setOwnPlayability(true);
			}, timePerTable);
		});

		// Выключаем подсветку стола
		timePerTable = tableLightOutTime/tables.length;
		tables.forEach(function(t, i){
			lastStep = lastStep.then(function(){
				t.setOwnPlayability(false);
			}, timePerTable);
		});

		// Завершаем анимацию и ресетим хвост карты
		lastStep.then(function(){
			fields.forEach(function(f){
				f.endAnimation();
			});
			cardControl.trailReset();
		});

	}, duration, this);
};

/**
* Убирает визуальный замок с поля.
* @param {string}  id            id поля
* @param {boolean} [noAnimation] отключает анимацию
*/
FieldManager.prototype.unlockField = function(seq, id, noAnimation){
	var field = this.fields[id];
	if(!field || !field.icon){
		console.error('Field manager: cannot unlock field', id, ', no such field or field has no icon');
		return;
	}
	var icon = field.icon;
	
	if(game.paused || noAnimation){
		field.icon.destroy();
		field.icon = null;
		return;
	}

	var lockDelay = 100/game.speed,
		spinDelay = 300/game.speed,
		spinTime = 1000/game.speed;

	var tween = game.add.tween(icon);	

	seq.append(function(){
		icon.visible = true;
		field.iconStyle.shouldHide = false;
		icon.alpha = 1;
		field.setOwnHighlight(true);
		tween.to({alpha: 0, angle: 720}, spinTime - lockDelay, Phaser.Easing.Quadratic.In, false, spinDelay);
		tween.start();	
	}, lockDelay)
	.then(function(seq){
		icon.loadTexture('unlock');
	}, spinTime + spinDelay - lockDelay)
	.then(function(seq){
		tween.stop();
		icon.destroy();
		field.icon = null;
	}, lockDelay)
	.then(function(){
		if(!field.playable){
			field.setOwnHighlight(false);
		}
	});
};

/**
* Анимирует конец игры в зависимости от результатов.
* @param  {object} results результаты игры
* @param  {object} seq     последовательность, в которую будут добавлены анимации
*/
FieldManager.prototype.animateGameEnd = function(results, seq){
	var discard = fieldManager.fields.DISCARD_PILE,
		dummy = fieldManager.fields.dummy, 
		won = results && results.winners && ~results.winners.indexOf(game.pid),
		lost = results && results.loser && results.loser == game.pid,
		delay = 0;
	
	if(!discard || !dummy){
		return;
	}

	var cards = discard.cards.slice();
	delay = dummy.queueCards(cards, BRING_TO_TOP_ON.START_ALL);	
	delay += cardManager.defaultMoveTime;

	// Перемещаем карты в поле по центру и стартуем анимацию
	seq.append(function(seq){

		discard.removeAllCards();
		dummy.placeQueuedCards();
		if(won){
			return;
		}

		// Анимируем не выигрыш
		seq.abort();
		seq.append(delay - cardManager.defaultMoveTime)
			.then(function(seq, sync){
				if(lost){
					ui.announcer.newMessage('You lost');
				}
				else{
					ui.announcer.newMessage('Better luck next time');
				}

				fieldManager.resetFields();
				cardManager.enablePhysics(true);

				if(!sync){
					game.shake(15, 800, 20, 50);
				}

				ui.menus.endGame.fadeIn();
				ui.layers.hideLayer(ui.actionButtons, true);
			});

	}, delay/game.speed)
	.then(function(){

		// Анимируем выигрыш
		ui.announcer.newMessage('YOU WON!');
		ui.menus.endGame.fadeIn();
		ui.layers.hideLayer(ui.actionButtons, true);

		for(var ci = 0; ci < dummy.cards.length; ci++){
			var card = dummy.cards[ci],
				x = card.sprite.x + card.x + (10 * (ci - dummy.cards.length / 2)),
				time = Math.random() * cardManager.defaultMoveTime + 500;
			card.moveTo(x, -200, time, 0, false, true);
			card.rotateTo(Math.random() * 360 - 180, time);
		}

		cards = dummy.cards.slice();
		fieldManager.resetFields();
		cardManager.enablePhysics(false, dummy.cards);

	}, cardManager.defaultMoveTime + 500)
	.then(function(){

		// Запускаем эмиттер карт
		for(var ci = 0; ci < cards.length; ci++){
			var card = cards[ci];
			card.field = null;
			card.destroy(0, true);
		}

		cardEmitter.start(300, 500, 100, false, 100, 10);

	}, 500);
};

/**
* Анимирует выход противника из игры и его замену ботом.
* @param  {object} action информация об игроках
* @param  {object} seq    последовательность, в которую будут добавлены анимации
*/
FieldManager.prototype.animatePlayerConcede = function(action, seq){
	var player = gameInfo.getPlayer(action.pid);
	ui.eventFeed.newMessage(player.name + ' conceded', 2000);
	player.name = action.name;
	var field = fieldManager.fields[action.pid];
	var duration = field.moveTime/game.speed;
	seq.append(function(){		
		field.badge.visible = false;		
		field.badge.updatePosition();
		field.setupAnimatedAppearance();
	}, duration, 300)
	.then(function(){
		field.badge.visible = true;		
		field.animateAppearance();
	}, duration*2)
	.then(function(){
		field.endAnimation();
	});
};
