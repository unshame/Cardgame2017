/*
 * Модуль отвечает за обработку действий от сервера
 * Формирует и передает информацию о действиях FieldManager'у
 */
var ActionHandler = function(reactions){

	this.reactions = reactions;
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

	fieldManager.forEachField(function(field){
		field.setHighlight(false);
	});

	var field = fieldManager.fields[fieldManager.pid];
	for(var ci = 0; ci < field.cards.length; ci++){
		field.cards[ci].setPlayability(false);
	}

	var react = this.reactions[action.type],
		delay = 0;
	if(!react){
		console.warn('Action handler: Unknown action type', action.type, action);
	}
	else{
		delay = react.call(this, action);
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