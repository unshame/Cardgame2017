/**
* Действия, выполняемые в ответ на действия сервера  
* @namespace actionReactions
*/
window.actionReactions = {
	
	/**
	* Наименьшии козырные карты у каждого игрока и наименьшая козырная карта из них
	* @param {object} action - Обрабатываемое действие
	* @param {CardInfo[]} action.cards - Информация о козырных картах
	* @param {string} action.pid - id игрока с наименьшим козырем
	* @return {number} Время выполнения действия
	* @memberof actionReactions
	*/
	TRUMP_CARDS: function(action){
		if(!action.cards || !action.cards.length)
			return 0;		

		var cardsInfo = action.cards.slice(),
			pid = action.pid;

		fieldManager.resetHighlights();

		gameSeq.start(function(){
			fieldManager.showTrumpCards(cardsInfo, pid);
		}, 3000/game.speed, 0)
		.then(function(){
			fieldManager.hideTrumpCards(cardsInfo);
		}, 500);

		return gameSeq.duration;
	},

	/**
	* Информация об игре.
	* @param {object} action - Обрабатываемое действие
	* @param {CardInfo[]} action.cards - Информация о картах
	* @param {number} [action.numDiscarded] - Количество карт в стопке сброса
	* @param {number} [action.trumpSuit] - Масть козырных карт
	* @param {boolean} [noDelay=false] - нужно ли анимировать раздачу карт
	* @return {number} Время до начала добавления последней карты
	* @memberof actionReactions
	*/
	GAME_INFO: function(action, noDelay){

		cardManager.createCards(action.cards);
		
		if(action.players.length){
			playerManager.savePlayers(action.players);
			cardManager.disablePhysics();
			if(fieldManager.networkCreated){
				fieldManager.builder.adjustFieldNetwork(action.lockedFields);
			}
			else{
				fieldManager.builder.createFieldNetwork(action.lockedFields);
			}
		}

		if(!fieldManager.networkCreated){
			console.error('Action handler: field network hasn\'t been created');
			return;
		}

		announcer.clear();
		cardEmitter.stop();
		fieldManager.resetHighlights();
		fieldManager.resetFields();
		cardControl.reset();
		var hasTrumpSuit = action.trumpSuit || action.trumpSuit === 0;
		var delay;
		if(noDelay){
			delay = fieldManager.queueCards(action.cards, noDelay);
			fieldManager.removeMarkedCards();
			fieldManager.placeQueuedCards(BRING_TO_TOP_ON.START, noDelay);
		}
		else{
			delay = fieldManager.fancyShuffleCards(action.cards);
		}

		if(hasTrumpSuit){
			fieldManager.setTrumpSuit(action.trumpSuit, noDelay ? game.defaultMoveTime : delay);
		}

		return delay;
	},

	/**
	* Информация об игре при переподключении к игре.
	* @param {object} action {@link actionReactions.GAME_INFO}
	* @return {number} Время выполнения действия
	* @memberof actionReactions
	*/
	GAME_INFO_UPDATE: function(action){
		feed.newMessage('Reconnected', 'system', 2000);
		return this['GAME_INFO'].call(this, action, true);
	},

	/**
	* Раскрытие значений карт
	* @param {object} action - Обрабатываемое действие
	* @param {CardInfo[]} action.cards - Информация о картах
	* @return {number} Время выполнения действия (0)
	* @memberof actionReactions
	*/
	REVEAL: function(action){
		fieldManager.resetHighlights();
		fieldManager.revealCards(action.cards);
		return 0;
	},

	/**
	* Раздача карт
	* @param {object} action - Обрабатываемое действие
	* @param {CardInfo[]} action.cards - Информация о картах
	* @return {number} Время до начала добавления последней карты
	* @memberof actionReactions
	*/
	DRAW: function(action){
		fieldManager.resetHighlights();
		var delay = fieldManager.queueCards(action.cards);
		fieldManager.removeMarkedCards();
		fieldManager.placeQueuedCards(BRING_TO_TOP_ON.START);
		return delay;
	},

	/**
	* Игрок либо хочет взять, либо уже берет карты, зависит от присутствия action.cards
	* @param {object} action - Обрабатываемое действие
	* @param {CardInfo[]} [action.cards] - Информация о картах
	* @param {string} action.pid - id берущего игрока	 
	* @return {number} Время выполнения действия
	* @memberof actionReactions
	*/
	TAKE: function(action){
		var delay = 0;
		if(!action.cards)
			return delay;
		fieldManager.resetHighlights();
		var field = fieldManager.fields[action.pid];
		delay = fieldManager.moveCards(field, action.cards.slice(), BRING_TO_TOP_ON.START);
		return delay;
	},

	/**
	* Игрок защищается
	* @param {object} action - Обрабатываемое действие
	* @param {string} action.cid - id карты
	* @param {string} action.pid - id игрока
	* @param {string} action.field - id поля
	* @param {number} action.suit - масть карты
	* @param {number} action.value - значение карты
	* @return {number} Время выполнения действия
	* @memberof actionReactions
	*/
	DEFENSE: function(action){
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
	* Карты перемещаются в стопку сброса
	* @param {object} action - Обрабатываемое действие
	* @param {string[]} action.ids - массив id перемещаемых карт
	* @return {number} Время выполнения действия
	* @memberof actionReactions
	*/
	DISCARD: function(action){
		fieldManager.resetHighlights();
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
			delay += fieldManager.unlockField(action.unlockedField);
		}
		return delay;
	},

	/**
	* Игрок пропускает ход
	* @param {object} action - Обрабатываемое действие
	* @param {string} action.pid - id игрока
	* @return {number} Время выполнения действия
	* @memberof actionReactions
	*/
	SKIP: function(action){
		return 0;
	}
};

/*jshint undef:false*/

/**
* Игрок атакует
* @method  ATTACK
* @param {object} action - Обрабатываемое действие
* @param {string} action.cid - id карты
* @param {string} action.pid - id игрока
* @param {string} action.field - id поля
* @param {number} action.suit - масть карты
* @param {number} action.value - значение карты
* @return {number} Время выполнения действия
* @memberof actionReactions
*/
actionReactions['ATTACK'] = actionReactions['DEFENSE'];