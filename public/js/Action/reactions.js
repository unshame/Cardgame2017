/*
 * Действия, выполняемые в ответ на действия сервера
 * Выполняются в контексте ActionHandler
 */

window.reactions = {
	
	/*
	 * 	TRUMP_CARDS - наименьшии козырные карты у каждого игрока и наименьшая козырная карта из них
	 * 		.cards Array of {
	 * 			cid,
	 * 			pid,
	 * 			suit,
	 * 			value
	 * 		}
	 * 		.pid String
	 */
	TRUMP_CARDS: function(action){
		var delay = 0, card;
		if(action.cards && action.cards.length){
			delay = 3000/game.speed;

			//Показываем козырные карты
			for(var ci = 0; ci < action.cards.length; ci++){
				var c = action.cards[ci];
				card = game.cards[c.cid];

				if(action.pid != c.pid)
					fieldManager.fields[c.pid].setHighlight(true, game.colors.red);

				card.raised = true;

				if(card.field.id != playerManager.pid){	
					card.presetValue(c.suit, c.value);	
				}
				card.field.placeCards(null, 'init', true);
			}		

			//Выделяем поле игрока с наибольшим козырем
			fieldManager.fields[action.pid].setHighlight(true, game.colors.green);

			//Прячем козырные карты
			setTimeout(function(handler){	
				var cards = handler.action.cards;			
				for(var ci = 0; ci < cards.length; ci++){
					var c = cards[ci];
					card = game.cards[c.cid];	

					fieldManager.fields[c.pid].setHighlight(false);		

					card.raised = false;

					if(card.field.id != playerManager.pid){					
						card.presetValue(null, null);
					}
					card.field.placeCards(null, 'init', true);
				}			

			}, delay, this);

			delay += 500;
		}
		return delay;
	},

	/*
	 * 	CARDS - карты, присутствующие в игре
	 * 		.cards Array of {
	 * 			cid,
	 * 			field,
	 * 			[suit,]
	 * 			[value]
	 * 		}
	 * 		[.numDiscarded Number]
	 * 		[.trumpSuit Number]
	 *
	 */
	CARDS: function(action){

		fieldManager.resetFields();
		cardControl.reset();
		cardManager.reset();
		cardManager.createCards(action.cards);

		var delay = fieldManager.queueCards(action.cards);
		fieldManager.removeMarkedCards();
		fieldManager.placeQueuedCards();
		if(action.numDiscarded){
			var discardCards = [];
			for (var i = 0; i < action.numDiscarded; i++) {
				var id = 'discarded_'+i;
				var options = {
					id: id
				};
				cardManager.addCard(options);
				discardCards.push(game.cards[id]);
			}
			fieldManager.fields.DISCARD_PILE.addCards(discardCards);
		}
		return delay;
	},

	/*
	 * 	DRAW - раздача карт
	 * 		.cards Array of {
	 * 			cid,
	 * 			pid,
	 * 			[suit,]
	 * 			[value]
	 * 		}
	 */
	DRAW: function(action){
		var delay = fieldManager.queueCards(action.cards);
		fieldManager.removeMarkedCards();
		fieldManager.placeQueuedCards();
		return delay;
	},

	/*
	 * 	TAKE - игрок либо хочет взять, либо уже берет карты, зависит от присутствия .cards
	 * 		[.cards Array of {
	 * 			cid,
	 * 			[suit,]
	 * 			[value]
	 * 		}]
	 * 		.pid String
	 */
	TAKE: function(action){
		var delay = 0;
		if(!action.cards)
			return delay;
		var cards = [];
		for(var i = 0; i < action.cards.length; i++){
			cards.push({
				cid: action.cards[i].cid,
				suit: action.cards[i].suit,
				value: action.cards[i].value
			});
		}
		var field = fieldManager.fields[action.pid];
		delay = fieldManager.placeCards(field, cards, true);
		return delay;
	},

	/*
	 * 	DEFENSE, ATTACK - игрок атакует/защищается
	 * 		.cid String
	 * 		.pid String
	 * 		.field String
	 * 		.suit Number
	 * 		.value Number
	 */
	DEFENSE: function(action){
		var delay = 0;
		var card = {
			cid: action.cid,
			suit: action.suit,
			value: action.value
		};
		var field = fieldManager.fields[action.field];
		delay = fieldManager.placeCards(field, [card]);
		return delay;
	},

	/*
	 * 	DISCARD - карты перекладываются со стола в стопку сброса
	 * 		.ids Array of String
	 */
	DISCARD: function(action){
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
		delay = fieldManager.placeCards(field, cards);
		return delay;
	},

	/*
	 * 	SKIP - игрок пропускает ход
	 * 		.pid
	 */
	SKIP: function(action){
		return 0;
	}
};

reactions['ATTACK'] = reactions['DEFENSE'];