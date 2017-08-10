/**
* Действия, выполняемые в ответ на сообщения от сервера
* @namespace notificationReactions
*/

notificationReactions = {

	/**
	* В игре остались только боты, игра симулируется в ускоренном режиме
	* @memberOf notificationReactions
	*/
	SIMULATING: function(){
		feed.newMessage('Simulating', 2000);
	},

	/**
	* Начало хода
	* @memberOf notificationReactions
	* @param {object} note сообщение
	*/
	TURN_STARTED: function(note){

	},

	/**
	* Начало игры
	* @memberOf notificationReactions
	* @param {object} note сообщение
	*/
	GAME_STARTED: function(note){
		eventFeed.newMessage('Game ' + (note.index + 1) + ' Started', 4000);
	},

	/**
	* Окончание хода
	* @memberOf notificationReactions
	* @param {object} note сообщение
	*/
	TURN_ENDED: function(note){
		fieldManager.resetTableOrder();
	},

	/*
	* 	GAME_ENDED - окончание игры, голосование за старт новой
	* 		note: {
	* 			results: {
	* 				winners,
	* 				loser
	* 			},
	* 			scores: Object
	* 		},
	* 		actions: [
	* 			{ type: 'ACCEPT' },
	* 			{ type: 'DECLINE' }
	* 		]
	*/
	GAME_ENDED: function(note, actions){

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
		delay += game.defaultMoveTime;		

		gameSeq.start(function(seq){
			discard.removeAllCards();
			dummy.placeQueuedCards();
			if(!won){
				seq.abort();
				seq.start(function(){
					announcer.newMessage('Better luck next time');
					fieldManager.resetFields();
					cardManager.enablePhysics(true);
				}, 0, delay - game.defaultMoveTime);
			}
		}, delay/game.speed, game.defaultMoveTime)
		.then(function(){
			announcer.newMessage('YOU WON!');
			for(var ci = 0; ci < dummy.cards.length; ci++){
				var card = dummy.cards[ci],
					x = card.sprite.x + card.base.x + (10*(ci - dummy.cards.length/2)),
					time = Math.random()*game.defaultMoveTime + 500;
				card.moveTo(x, -200, time, 0, false, true);
				card.rotateTo(Math.random()*360 - 180, time);
			}
			cards = dummy.cards.slice();
			fieldManager.resetFields();
			cardManager.enablePhysics(false, dummy.cards);
		}, game.defaultMoveTime + 500)
		.then(function(){
			for(var ci = 0; ci < cards.length; ci++){
				var card = cards[ci];
				card.field = null;
				card.destroy(0, true);
			}
			cardEmitter.start(300, 500, 100, false, 100, 10);
		});
	},

	/*
	* 	VOTE_RESULTS - результаты голосования
	* 		note: {
	* 			results: {
	* 				pid: {
	* 					type: 'ACCEPT' | 'DECLINE',
	* 				 	pid
	* 				},
	* 				...
	* 			},
	* 			successful: bool
	* 		}
	*/
	VOTE_RESULTS: function(note){
		console.log(note);
	},

	/*
	* 	INVALID_ACTION, LATE_OR_UNCALLED_ACTION - неверное действие или действие с запозданием\без запроса
	* 		note: {
	* 			action,  - действие, которое необходимо обратить
	* 			time,	
	* 			timeSent
	* 		},
	* 		actions [
	* 			любые действия
	* 		]
	*/
	INVALID_ACTION: function(note, actions){
		var action = note.action,
			card = cardManager.cards[action.cid];
		if(action.cid && card){
			var cardInfo = {
				cid: card.id,
				suit: card.suit,
				value: card.value
			};
			var field = fieldManager.fields[playerManager.pid];
			fieldManager.moveCards(field, [cardInfo], BRING_TO_TOP_ON.END_ALL);
		}
		if(actions){
			this.handlePossibleActions(actions, note.time, note.timeSent);
		}
	},

	DISCONNECTED: function(){
		feed.newMessage('Disconnected', 2000);
		game.state.change('menu');
	}

};

/*jshint undef:false*/

notificationReactions['LATE_OR_UNCALLED_ACTION'] = notificationReactions['INVALID_ACTION'];