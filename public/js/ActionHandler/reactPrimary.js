/**
* Действия, выполняемые в ответ на действия сервера  
* @see  {@link ActionHandler#reactPrimary}
* @namespace reactPrimary
*/
var reactPrimary = {
	
	/**
	* Наименьшии козырные карты у каждого игрока и наименьшая козырная карта из них.
	* @param {object}     action       Обрабатываемое действие
	* @param {CardInfo[]} action.cards Информация о козырных картах
	* @param {string}     action.pid   id игрока с наименьшим козырем
	*
	* @return {number} Время выполнения действия
	*/
	TRUMP_CARDS: function(action, seq){
		if(!action.cards || !action.cards.length){
			return 0;		
		}

		var cardsInfo = action.cards.slice(),
			pid = action.pid,
			player = playerManager.getPlayer(pid),
			message;

		if(player){
			message = ui.eventFeed.newMessage(player.name + ' is going first', 'positive');
		}
		fieldManager.showTrumpCards(cardsInfo, pid);

		seq.append(function(){
			if(message){
				ui.eventFeed.removeMessage(message);
			}
			fieldManager.hideTrumpCards(cardsInfo);
		}, 500);

		return 3000;
	},

	/**
	* Информация об игре.
	* @param {object}     action                Обрабатываемое действие
	* @param {CardInfo[]} action.cards          Информация о картах
	* @param {number}     [action.numDiscarded] Количество карт в стопке сброса
	* @param {number}     [action.trumpSuit]    Масть козырных карт
	* @param {boolean}    [noDelay=false]       нужно ли анимировать раздачу карт
	*
	* @return {number} Время до начала добавления последней карты
	*/
	GAME_INFO: function(action, seq, noDelay){

		// Ресет модулей
		actionHandler.resetActions();
		ui.announcer.clear();
		cardEmitter.stop();
		cardControl.reset();
		cardManager.disablePhysics();
		actionHandler.simulating = action.simulating;

		// Создаем недостающие карты
		cardManager.createCards(action.cards);
		
		// Создаем поля с учетом новой информации об игроках
		if(action.players.length){
			// Сохраняем информацию об игроках
			var gameId = playerManager.gameId;
			playerManager.savePlayers(action.players, action.gameId);

			// Если id игры не совпадает с локальным id игры, значит каким-то образом
			// мы переподключились к другой игре, значит удаляем поля
			if(fieldManager.networkCreated && gameId != action.gameId){
				fieldManager.resetHighlights();
				fieldManager.resetNetwork();
			}

			// Создаем или исправляем поля
			if(fieldManager.networkCreated){
				fieldManager.builder.adjustFieldNetwork(action.lockedFields);
			}
			else{
				fieldManager.builder.createFieldNetwork(action.lockedFields);
			}
		}
		else{
			fieldManager.resetHighlights();
			fieldManager.resetFields();
		}

		if(!fieldManager.networkCreated){
			console.error('Action handler: field network hasn\'t been created');
			return;
		}

		// Распологаем карты по полям и показываем кнопки действий
		var duration = 0;
		if(noDelay){
			// Без анимации
			duration = cardManager.defaultMoveTime;
			fieldManager.endFieldAnimations();
			fieldManager.queueCards(action.cards, true);
			fieldManager.removeMarkedCards();
			fieldManager.placeQueuedCards(BRING_TO_TOP_ON.START, true);

			ui.layers.showLayer(ui.actionButtons, true);
		}
		else{
			// С анимацией
			fieldManager.fancyShuffleCards(seq, action.cards);

			seq.append(function(){
				ui.layers.showLayer(ui.actionButtons, true);
			});
		}	

		// Добавляем колоде текстуру, обозначающую текущую козырную масть
		if(action.trumpSuit || action.trumpSuit === 0){
			seq.append(function(){
				fieldManager.setTrumpSuit(action.trumpSuit);
			});
		}

		return duration;
	},

	/**
	* Информация об игре при переподключении к игре.
	* @param {object} action {@link reactPrimary.GAME_INFO}
	*
	* @return {number} Время выполнения действия
	*/
	GAME_INFO_UPDATE: function(action, seq){
		ui.feed.newMessage('Reconnected to game', 2000);
		return this.GAME_INFO.call(this, action, seq, true);
	},

	/**
	* Раскрытие значений карт.
	* @param {object}     action       Обрабатываемое действие
	* @param {CardInfo[]} action.cards Информация о картах
	*
	* @return {number} Время выполнения действия (0)
	*/
	REVEAL: function(action, seq){
		fieldManager.revealCards(action.cards);
		return 0;
	},

	/**
	* Раздача карт.
	* @param {object} action - Обрабатываемое действие
	* @param {CardInfo[]} action.cards - Информация о картах
	* @return {number} Время до начала добавления последней карты
	* @memberof reactPrimary
	*/
	DRAW: function(action, seq){
		var delay = fieldManager.queueCards(action.cards);
		fieldManager.removeMarkedCards();
		fieldManager.placeQueuedCards(BRING_TO_TOP_ON.START_ALL);
		return delay;
	},

	/**
	* Игрок либо хочет взять, либо уже берет карты, зависит от присутствия `action.cards`.
	* @param {object}     action         Обрабатываемое действие
	* @param {CardInfo[]} [action.cards] Информация о картах
	* @param {string}     action.pid     id берущего игрока
	*
	* @return {number} Время выполнения действия
	*/
	TAKE: function(action, seq){
		var delay = 0;
		if(!action.cards){
			return delay;
		}
		actionHandler.reset();
		var field = fieldManager.fields[action.pid];
		delay = fieldManager.moveCards(field, action.cards.slice(), BRING_TO_TOP_ON.START);
		return delay;
	},

	/**
	* Игрок защищается.
	* @param {ActionInfo} action Обрабатываемое действие
	*
	* @return {number} Время выполнения действия
	*/
	DEFENSE: function(action, seq){
		var delay = 0;
		var card = {
			cid: action.cid,
			suit: action.suit,
			value: action.value
		};
		var field = fieldManager.fields[action.field];
		delay = fieldManager.moveCards(field, [card]);
		return delay || field.moveTime;
	},

	/**
	* Карты перемещаются в стопку сброса.
	* @param {object}   action     Обрабатываемое действие
	* @param {string[]} action.ids массив id перемещаемых карт
	*
	* @return {number} Время выполнения действия
	*/
	DISCARD: function(action, seq){
		actionHandler.reset();
		var delay = 0;
		var cards = [];
		for(var i = 0; i < action.ids.length; i++){
			cards.push({
				cid: action.ids[i],
				suit: null,
				value: 0
			});
		}
		var field = fieldManager.fields.DISCARD_PILE;
		delay = fieldManager.moveCards(field, cards);
		if(action.unlockedField){
			fieldManager.unlockField(seq, action.unlockedField);
		}
		return delay;
	},

	/**
	* Игрок пропускает ход.
	* @param {object} action     Обрабатываемое действие
	* @param {string} action.pid id игрока
	*
	* @return {number} Время выполнения действия
	*/
	SKIP: function(action, seq){
		return 0;
	}
};

/**
* Игрок атакует.
* @method  ATTACK
* @memberof reactPrimary
* @param {ActionInfo} action Обрабатываемое действие
*
* @return {number} Время выполнения действия
*/
reactPrimary.ATTACK = reactPrimary.DEFENSE;