/*
 * Действия, выполняемые в ответ на сообщения от сервера
 * Выполняются в контексте ActionHandler
 * @namespace notificationReactions
 */

window.notificationReactions = {

	/*
	 * 	SIMULATING - в игре остались только боты, игра симулируется в ускоренном режиме
	 */
	SIMULATING: function(){

	},

	/*
	 * 	TURN_ENDED - окончание хода
	 */
	TURN_ENDED: function(note){

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
		if(note.results && note.results.winners && ~note.results.winners.indexOf(game.pid))
			cardManager.throwCardsStart();
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
			fieldManager.moveCards(field, [cardInfo]);
		}
		if(actions){
			this.handlePossibleActions(actions, note.time, note.timeSent);
		}
	}



};

/*jshint undef:false*/

notificationReactions['LATE_OR_UNCALLED_ACTION'] = notificationReactions['INVALID_ACTION'];