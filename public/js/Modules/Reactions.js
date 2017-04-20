/*
 * Действия, выполняемые в ответ на действия сервера
 * Выполняются в контексте ActionHandler
 */

window.reactions = {
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

				if(card.field.id == fieldManager.pid)
					continue;

				this.highlightingTrumpCards = true;

				card.presetValue(c.suit, c.value);
				card.field.focusOnCard(card, null, true);				

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

					if(card.field.id == fieldManager.pid)
						continue;									
			
					card.presetValue(null, null);
					card.field.focusOffCard(card, true);
				}
				fieldManager.highlightingTrumpCards = false;				

			}, delay, this);

			delay += 500;
		}
		return delay;
	},

	CARDS: function(action){
		fieldManager.resetFields();
		controller.reset();

		for(var cid in game.cards){
			if(game.cards.hasOwnProperty(cid)){
				game.cards[cid].base.removeAll(true);
			}
		}
		game.cards = {};
		game.cardsGroup.removeAll(true);
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
				game.cards[id] = new Card(options);
				discardCards.push(game.cards[id]);
			}
			fieldManager.fields.DISCARD_PILE.addCards(discardCards);
		}
		return delay;
	},

	DRAW: function(action){
		var delay = fieldManager.queueCards(action.cards);
		fieldManager.removeMarkedCards();
		fieldManager.placeQueuedCards();
		return delay;
	},

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

	SKIP: function(action){
		return 0;
	}
};

reactions['ATTACK'] = reactions['DEFENSE'];