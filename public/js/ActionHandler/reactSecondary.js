/**
* Действия, выполняемые в ответ на оповещения от сервера.
* @see  {@link ActionHandler#reactSecondary}
* @namespace reactSecondary
*/

/* exported reactSecondary */
var reactSecondary = {

	GOES_FIRST: function(action, seq){
		ui.layers.setLayerIndex(ui.eventFeed, ui.eventFeed.zIndexBelowCards);
	},

	/**
	* В игре остались только боты, игра симулируется в ускоренном режиме.
	*/
	SIMULATING: function(action, seq){
		ui.feed.newMessage('Simulating', 2000);
		gameInfo.simulating = true;
	},

	STOP_SIMULATING: function(){
		gameInfo.simulating = false;
	},

	/**
	* Начало хода.
	* @param {object} action сообщение
	*/
	TURN_STARTED: function(action, seq){

	},

	/**
	* Начало игры.
	* @param {object} action       сообщение
	* @param {number} action.index порядковый индекс игры
	*/
	GAME_STARTED: function(action, seq){
		//ui.eventFeed.newMessage('Game ' + (action.index + 1) + ' Started', 4000);
	},

	/**
	* Окончание хода.
	* @param {object} action сообщение
	*/
	TURN_ENDED: function(action, seq){
		fieldManager.resetTableOrder();
		gameInfo.resetTurnInfo(seq);
	},

	/**
	* Окончание игры, голосование за старт новой.
	* @param {object}                 action         сообщение
	* @param {object}                 action.results результаты игры '{winners<object>, loser<string>}'
	* @param {object<object<number>>} action.scores  очки игроков по id игроков в виде `{wins, losses, cardsWhenLost} `
	* @param {object}                 action.actions      действия голосования за и против рематча `{ { type: 'ACCEPT' }, { type: 'DECLINE' } }`
	*/
	GAME_ENDED: function(action, seq){
		actionHandler.reset();
		gameInfo.resetTurnInfo(seq);
		fieldManager.updateBadges();
		ui.layers.setLayerIndex(ui.eventFeed, ui.eventFeed.zIndexAboveCards);
		fieldManager.animateGameEnd(action.results, seq);
	},

	/**
	* Результаты голосования.
	* @param {object}                 action         сообщение
	* @param {object<object<string>>} action.results результаты голосования по id игроков вида '{type, pid}'
	* @param {boolean}                successful   удачно ли прошло голосование
	*/
	VOTE_RESULTS: function(action, seq){
		ui.menus.endGame.fadeOut();
		if(!action.successful){
			game.state.change('queue', false);
		}
	},

	/**
	* Было выполнено невалидное действие.
	* @param {object}             action          сообщение
	* @param {ActionInfo}         action.action   действие, которое необходимо обратить
	* @param {object}             action.time     время до которого нужно выполнить новое действие
	* @param {object}             action.timeSent время в которое действия были отправленны с сервера
	* @param {object<ActionInfo>} action.actions  действия из которых нужно выбрать одно в замен неверного
	*/
	INVALID_ACTION: function(action, seq){
		var undoAction = action.action,
			card = cardManager.cards[undoAction.cid];

		// Отменяем невалидное действие
		if(undoAction.cid && card){
			fieldManager.resetTableOrder();
			var cardInfo = {
				cid: card.id,
				suit: card.suit,
				value: card.value
			};
			var field = fieldManager.fields[gameInfo.pid];
			fieldManager.moveCards(field, [cardInfo], BRING_TO_TOP_ON.END_ALL);
		}

		// Даем игроку действовать снова
		if(action.actions){
			actionHandler.handlePossibleActions(action, seq);
		}
		else{
			actionHandler.reset();
		}
	},

	PLAYER_CONCEDED: function(action, seq){
		if(action.pid == game.pid){
			ui.feed.newMessage('Disconnected from game', 2000);
			game.state.change('menu', false);
			return;
		}
		fieldManager.animatePlayerConcede(action, seq);

	},

	DISCONNECTED: function(action, seq){
		game.state.change('menu', false);
	},

	TOO_SLOW: function(){
		actionHandler.reset();
	}

};

/**
* Действие было выполнено невовремя или без запроса
* @memberOf reactSecondary
* @function
* @param {object}     action            сообщение
* @param {ActionInfo} [action.action]   действие, которое необходимо обратить
* @param {object}     [action.time]     время до которого нужно выполнить новое действие
* @param {object}     [action.timeSent] время в которое действия были отправленны с сервера
*/
reactSecondary.LATE_OR_UNCALLED_ACTION = reactSecondary.INVALID_ACTION;