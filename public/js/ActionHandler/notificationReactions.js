/**
* Действия, выполняемые в ответ на оповещения от сервера.
* @see  {@link ActionHandler#notificationReactions}
* @namespace notificationReactions
*/

/* exported notificationReactions */
var notificationReactions = {

	/**
	* В игре остались только боты, игра симулируется в ускоренном режиме.
	*/
	SIMULATING: function(){
		ui.feed.newMessage('Simulating', 2000);
	},

	/**
	* Начало хода.
	* @param {object} note сообщение
	*/
	TURN_STARTED: function(note){

	},

	/**
	* Начало игры.
	* @param {object} note       сообщение
	* @param {number} note.index порядковый индекс игры
	*/
	GAME_STARTED: function(note){
		//ui.eventFeed.newMessage('Game ' + (note.index + 1) + ' Started', 4000);
	},

	/**
	* Окончание хода.
	* @param {object} note сообщение
	*/
	TURN_ENDED: function(note){
		fieldManager.resetTableOrder();
	},

	/**
	* Окончание игры, голосование за старт новой.
	* @param {object}                 note         сообщение
	* @param {object}                 note.results результаты игры '{winners<object>, loser<string>}'
	* @param {object<object<number>>} note.scores  очки игроков по id игроков в виде `{wins, losses, cardsWhenLost} `
	* @param {object}                 actions      действия голосования за и против рематча `{ { type: 'ACCEPT' }, { type: 'DECLINE' } }`
	*/
	GAME_ENDED: function(note, actions){

		actionHandler.reset();

		// Ставим стопку сброса по центру экрана
		var discard = fieldManager.fields.DISCARD_PILE,
			dummy = fieldManager.fields.dummy, 
			won = note.results && note.results.winners && ~note.results.winners.indexOf(game.pid),
			delay = 0;
			
		if(!discard || !dummy){
			return;
		}

		var cards = discard.cards.slice();
		delay = dummy.queueCards(cards, BRING_TO_TOP_ON.START_ALL);	
		delay += cardManager.defaultMoveTime;

		game.seq.start(function(seq){
			discard.removeAllCards();
			dummy.placeQueuedCards();
			if(!won){
				seq.abort();
				seq.start(function(){
					ui.announcer.newMessage('Better luck next time');
					fieldManager.resetFields();
					cardManager.enablePhysics(true);
					//game.camera.shake(0.005, 1000);
					game.shake(15, 800, 20, 50);
				}, 0, delay - cardManager.defaultMoveTime);
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
		});
	},

	/**
	* Результаты голосования.
	* @param {object}                 note         сообщение
	* @param {object<object<string>>} note.results результаты голосования по id игроков вида '{type, pid}'
	* @param {boolean}                successful   удачно ли прошло голосование
	*/
	VOTE_RESULTS: function(note){
		console.log(note);
	},

	/**
	* Было выполнено невалидное действие.
	* @param {object}             note          сообщение
	* @param {ActionInfo}         note.action   действие, которое необходимо обратить
	* @param {object}             note.time     время до которого нужно выполнить новое действие
	* @param {object}             note.timeSent время в которое действия были отправленны с сервера
	* @param {object<ActionInfo>} actions       действия из которых нужно выбрать одно в замен неверного
	*/
	INVALID_ACTION: function(note, actions){
		var action = note.action,
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
		if(actions){
			actionHandler.handlePossibleActions(actions, note.time, note.timeSent);
		}
	},

	/**
	* Игрок отключен от игры.
	*/
	CONCEDED: function(){
		ui.feed.newMessage('Disconnected from game', 2000);
		game.state.change('menu');

	},

	PLAYER_CONCEDED: function(note){
		var player = playerManager.getPlayer(note.pid);
		ui.eventFeed.newMessage(player.name + ' conceded', 2000);
		player.name = note.name;
		var field = fieldManager.fields[note.pid];
		var duration = field.moveTime/game.speed;
		game.seq.start(function(){		
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

	HOVER_OVER_CARD: function(note){
		var card = cardManager.cards[note.cid];
		if(card){
			card.setHighlight(true, ui.colors.red);
		}
	},

	HOVER_OUT_CARD: function(note){
		var card = cardManager.cards[note.cid];
		if(card){
			card.setHighlight(false);
		}
	},

	// нужно перенести в отдельный объект

	LEFT_QUEUE: function(){
		ui.feed.newMessage('Left queue', 2000);
		game.state.change('menu');
	},

	TOO_SLOW: function(){
		actionHandler.reset();
	},

	QUEUE_STATUS: function(note){
		if(fieldManager.networkCreated){
			game.state.change('play');
		}
		ui.eventFeed.newMessage('Players in queue: ' + note.playersQueued + '/' + note.playersNeeded);
	},

	QUEUE_FULL: function(){
		ui.eventFeed.clear();
	}

};

/**
* Действие было выполнено невовремя или без запроса
* @memberOf notificationReactions
* @function
* @param {object}     note            сообщение
* @param {ActionInfo} [note.action]   действие, которое необходимо обратить
* @param {object}     [note.time]     время до которого нужно выполнить новое действие
* @param {object}     [note.timeSent] время в которое действия были отправленны с сервера
*/
notificationReactions.LATE_OR_UNCALLED_ACTION = notificationReactions.INVALID_ACTION;