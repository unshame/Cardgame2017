/*
 * Модуль отвечает за обработку действий от сервера
 * Формирует и передает информацию о действиях FieldManager'у
 */
var ActionHandler = function(){

	this.action = null;
	this.possibleActions = null;
};

//ОБРАБОТКА КОМАНД СЕРВЕРА

/*
 * Выполняет действие
 * action.type
 * 	TRUMP_CARDS - наименьшии козырные карты у каждого игрока и наименьшая козырная карта из них
 * 		.cards Array of {
 * 			cid,
 * 			pid,
 * 			suit,
 * 			value
 * 		}
 * 		.pid String
 * 		
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
 * 	DRAW - раздача карт
 * 		.cards Array of {
 * 			cid,
 * 			pid,
 * 			[suit,]
 * 			[value]
 * 		}
 *
 * 	TAKE - игрок либо хочет взять, либо уже берет карты, зависит от присутствия .cards
 * 		[.cards Array of {
 * 			cid,
 * 			[suit,]
 * 			[value]
 * 		}]
 * 		.pid String
 *
 * 	DEFENSE, ATTACK - игрок атакует/защищается
 * 		.cid String
 * 		.pid String
 * 		.field String
 * 		.suit Number
 * 		.value Number
 *
 * 	DISCARD - карты перекладываются со стола в стопку сброса
 * 		.ids Array of String
 *
 * 	SKIP - игрок пропускает ход
 * 		.pid
 */
ActionHandler.prototype.executeAction = function(action){
	if(action.type == 'GAME_INFO' && action.players.length){
		fieldManager.resetNetwork();
		fieldManager.builder.createFieldNetwork(action.players);
		action.type = 'CARDS';
	}

	this.action = action;

	if(!fieldManager.networkCreated){
		console.error('Action handler: field network hasn\'t been created');
		return;
	}

	var delay = 0,
		cards, card, field, i, ci;

	fieldManager.forEachField(function(field){
		field.setHighlight(false);
	});

	field = fieldManager.fields[fieldManager.pid];
	for(ci = 0; ci < field.cards.length; ci++){
		field.cards[ci].setPlayability(false);
	}

	switch(action.type){

	case 'TRUMP_CARDS':
		if(action.cards && action.cards.length){
			delay = 3000/game.speed;

			//Показываем козырные карты
			for(ci = 0; ci < action.cards.length; ci++){
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
				for(ci = 0; ci < cards.length; ci++){
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
		break;

	case 'CARDS':
		fieldManager.resetFields();
		controller.reset();

		for(var cid in game.cards){
			if(game.cards.hasOwnProperty(cid)){
				game.cards[cid].base.removeAll(true);
			}
		}
		game.cards = {};
		game.cardsGroup.removeAll(true);
		delay = fieldManager.queueCards(action.cards);
		fieldManager.removeMarkedCards();
		fieldManager.placeQueuedCards();
		if(action.numDiscarded){
			var discardCards = [];
			for (i = 0; i < action.numDiscarded; i++) {
				var id = 'discarded_'+i;
				var options = {
					id: id
				};
				game.cards[id] = new Card(options);
				discardCards.push(game.cards[id]);
			}
			fieldManager.fields.DISCARD_PILE.addCards(discardCards);
		}
		break;

	case 'DRAW':
		delay = fieldManager.queueCards(action.cards);
		fieldManager.removeMarkedCards();
		fieldManager.placeQueuedCards();
		break;

	case 'TAKE':
		if(!action.cards)
			break;
		cards = [];
		for(i = 0; i < action.cards.length; i++){
			cards.push({
				cid: action.cards[i].cid,
				suit: action.cards[i].suit,
				value: action.cards[i].value
			});
		}
		field = fieldManager.fields[action.pid];
		delay = fieldManager.placeCards(field, cards, true);
		break;
		
	case 'ATTACK':
		//Fall-through

	case 'DEFENSE':
		card = {
			cid: action.cid,
			suit: action.suit,
			value: action.value
		};
		field = fieldManager.fields[action.field];
		delay = fieldManager.placeCards(field, [card]);
		break;

	case 'DISCARD':
		cards = [];
		for(i = 0; i < action.ids.length; i++){
			cards.push({
				cid: action.ids[i],
				suit: null,
				value: 0
			});
		}
		field = fieldManager.fields.DISCARD_PILE;
		delay = fieldManager.placeCards(field, cards);
		break;

	case 'SKIP':
		break;

	default:
		console.warn('Action handler: Unknown action type', action.type, action);
	}
	return delay;
};

//Подсвечивает карты, которыми можно ходить
ActionHandler.prototype.highlightPossibleActions = function(actions){
	if(!fieldManager.networkCreated){
		console.error('Action handler: field network hasn\'t been created');
		return;
	}

	this.possibleActions = actions;
	
	fieldManager.forEachField(function(field){
		field.setHighlight(false);
		for(var ci = 0; ci < field.cards.length; ci++){
			field.cards[ci].setPlayability(false);
		}
	});

	for(var ai = 0; ai < actions.length; ai++){
		var action = actions[ai],
			tint = action.type == 'ATTACK' ? game.colors.green : game.colors.orange;
		if(action.cid && game.cards[action.cid]){
			game.cards[action.cid].setPlayability(true, tint);
			fieldManager.fields[action.field].setHighlight(true, tint);
		}
	}
};