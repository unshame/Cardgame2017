/**
* Действия, выполняемые в ответ на оповещения от сервера.
* @see  {@link ActionHandler#reactSecondary}
* @namespace reactSecondary
*/

/* exported reactSecondary */
var reactSecondary = {

	NO_TRUMP_CARDS: function(action, seq){

	},

	/**
	* В игре остались только боты, игра симулируется в ускоренном режиме.
	*/
	SIMULATING: function(action, seq){
		ui.feed.newMessage('Simulating', 2000);
		actionHandler.simulating = true;
	},

	STOP_SIMULATING: function(){
		actionHandler.simulating = false;
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

		// Ставим стопку сброса по центру экрана
		var discard = fieldManager.fields.DISCARD_PILE,
			dummy = fieldManager.fields.dummy, 
			won = action.results && action.results.winners && ~action.results.winners.indexOf(game.pid),
			delay = 0;
			
		if(!discard || !dummy){
			return;
		}

		var cards = discard.cards.slice();
		delay = dummy.queueCards(cards, BRING_TO_TOP_ON.START_ALL);	
		delay += cardManager.defaultMoveTime;

		seq.append(function(seq){
			discard.removeAllCards();
			dummy.placeQueuedCards();
			if(!won){
				seq.abort();
				seq.append(delay - cardManager.defaultMoveTime)
					.then(function(){
						ui.announcer.newMessage('Better luck next time');
						fieldManager.resetFields();
						cardManager.enablePhysics(true);
						//game.camera.shake(0.005, 1000);
						game.shake(15, 800, 20, 50);
					}, 500)
					.then(function(){
						ui.menus.endGame.fadeIn();
					});
			}
		}, delay/game.speed)
		.then(function(){
			ui.announcer.newMessage('YOU WON!');
			for(var ci = 0; ci < dummy.cards.length; ci++){
				var card = dummy.cards[ci],
					x = card.sprite.x + card.x + (10*(ci - dummy.cards.length/2)),
					time = Math.random()*cardManager.defaultMoveTime + 500;
				card.moveTo(x, -200, time, 0, false, true);
				card.rotateTo(Math.random()*360 - 180, time);
			}
			cards = dummy.cards.slice();
			fieldManager.resetFields();
			cardManager.enablePhysics(false, dummy.cards);
		}, cardManager.defaultMoveTime + 500)
		.then(function(){
			for(var ci = 0; ci < cards.length; ci++){
				var card = cards[ci];
				card.field = null;
				card.destroy(0, true);
			}
			cardEmitter.start(300, 500, 100, false, 100, 10);
		}, 500)
		.then(function(){
			ui.menus.endGame.fadeIn();
		});
	},

	/**
	* Результаты голосования.
	* @param {object}                 action         сообщение
	* @param {object<object<string>>} action.results результаты голосования по id игроков вида '{type, pid}'
	* @param {boolean}                successful   удачно ли прошло голосование
	*/
	VOTE_RESULTS: function(action, seq){
		ui.menus.endGame.fadeOut();
		if(!action.results.successful){
			game.state.change('queue', false);
		}
	},

	/**
	* Было выполнено невалидное действие.
	* @param {object}             action          сообщение
	* @param {ActionInfo}         action.action   действие, которое необходимо обратить
	* @param {object}             action.time     время до которого нужно выполнить новое действие
	* @param {object}             action.timeSent время в которое действия были отправленны с сервера
	* @param {object<ActionInfo>} action.actions       действия из которых нужно выбрать одно в замен неверного
	*/
	INVALID_ACTION: function(action, seq){
		var action = action.action,
			card = cardManager.cards[action.cid];
		if(action.cid && card){
			fieldManager.resetTableOrder();
			var cardInfo = {
				cid: card.id,
				suit: card.suit,
				value: card.value
			};
			var field = fieldManager.fields[playerManager.pid];
			fieldManager.moveCards(field, [cardInfo], BRING_TO_TOP_ON.END_ALL);
		}
		if(action.actions){
			actionHandler.handlePossibleActions(action.actions, action.time, action.timeSent);
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
		var player = playerManager.getPlayer(action.pid);
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