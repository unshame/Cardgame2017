/**
* Действия, выполняемые в ответ на сообщения от сервера
* Выполняются в контексте ActionHandler
* @namespace notificationReactions
*/

window.notificationReactions = {

	/**
	* В игре остались только боты, игра симулируется в ускоренном режиме
	* @memberOf notificationReactions
	*/
	SIMULATING: function(){

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

		//Ставим стопку сброса по центру экрана
		var discard = fieldManager.fields.DISCARD_PILE,
			dummy = fieldManager.fields.dummy, 
			won = note.results && note.results.winners && ~note.results.winners.indexOf(game.pid),
			delay = 0;
			
		if(!discard || !dummy){
			return;
		}

		var cards = discard.cards.slice();
		discard.reset();
		
		gameSeq.start(function(){	
			delay = dummy.queueCards(cards, BRING_TO_TOP_ON.START_ALL);
			delay += game.defaultMoveTime;		
			discard.removeAllCards();
		}, game.defaultMoveTime)
		.then(function(seq){
			dummy.placeQueuedCards();
			if(!won){
				seq.abort();
				seq.start(function(){
					fieldManager.resetFields();
					cardManager.enablePhysics(true);
				}, 0, delay - game.defaultMoveTime);
			}
		}, function(){return delay})
		.then(function(){
			for(var ci = 0; ci < dummy.cards.length; ci++){
				var card = dummy.cards[ci],
					x = card.sprite.x + card.base.x + (10*(ci - dummy.cards.length/2)),
					time = Math.random()*game.defaultMoveTime + 500;
				card.moveTo(x, -200, time, 0, false, true);
				card.rotateTo(Math.random()*360 - 180, time);
			}
		}, game.defaultMoveTime + 500)
		.then(function(){
			for(var ci = 0; ci < dummy.cards.length; ci++){
				var card = dummy.cards[ci];
				card.field = null;
				card.destroy(0, true);
			}
			fieldManager.resetFields();
			cardEmitter.start(300, 500, 100, false, 100, 10);
			cardManager.enablePhysics(false);
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
	}

};

/*jshint undef:false*/

notificationReactions['LATE_OR_UNCALLED_ACTION'] = notificationReactions['INVALID_ACTION'];