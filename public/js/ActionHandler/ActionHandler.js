/**
* Модуль отвечает за обработку действий от сервера
* Формирует и передает информацию о действиях FieldManager'у
* @class
*/

var ActionHandler = function(actionReactions, notificationReactions){

	this.actionReactions = actionReactions;
	this.notificationReactions = notificationReactions;
	this.possibleActions = null;

	this.timedAction = null;
	this.timedActionTimeout = null;
};

// ОБРАБОТКА КОМАНД СЕРВЕРА

// Выполняет действие

ActionHandler.prototype.executeAction = function(action){

	if(game.state.currentSync != 'play'){
		console.error('ActionHandler: must be in play state to execute actions');
		return;
	}

	if(!action){
		console.error('Action handler: no action recieved');
		return;
	}

	if(game.inDebugMode){
		feed.newMessage(action.type, 'system', 2000);
	}

	gameSeq.finish();

	var delay = 0;

	var reaction = this.actionReactions[action.type];
	if(!reaction){
		console.warn('Action handler: Unknown action type', action.type, action);
	}
	else{
		delay += reaction.call(this.actionReactions, action);
	}
	return delay;
};

ActionHandler.prototype.handlePossibleActions = function(actions, time, timeSent){

	if(game.state.currentSync != 'play'){
		console.error('ActionHandler: must be in play state to handle possible actions');
		return;
	}

	var actionTypes = actions.map(function(a){return a.type;});
	var button = ui.actionButtons.getByName('action');
	if(~actionTypes.indexOf('SKIP')){
		this.realAction = 'SKIP';
		button.label.setText('Skip');
		button.enable();
	}
	else if(~actionTypes.indexOf('TAKE')){
		this.realAction = 'TAKE';
		button.label.setText('Take');
		button.enable();
	}

	var currentTime = new Date();
	time = time - currentTime.getTime();
	if(time)
		ui.rope.start(time - 1000);

	this.highlightPossibleActions(actions);
};

ActionHandler.prototype.handleNotification = function(note, actions){
	if(game.state.currentSync != 'play'){
		console.error('ActionHandler: must be in play state to recieve game notifications');
		return;
	}

	if(game.inDebugMode){
		feed.newMessage(note.message, 'system', 2000);
	}

	var reaction = this.notificationReactions[note.message];
	if(!reaction){
		console.warn('Action handler: Unknown notification handler', note.message, note, actions);
	}
	else{
		reaction.call(this.notificationReactions, note, actions);
	}
};

// Подсвечивает карты, которыми можно ходить
ActionHandler.prototype.highlightPossibleActions = function(actions){

	if(!actions && !this.possibleActions){
		return;
	}

	var cardHolding = cardControl.card;

	if(actions){
		this.possibleActions = actions;
	}
	else{
		actions = this.possibleActions;
	}

	gameSeq.finish();

	if(!fieldManager.networkCreated){
		console.error('Action handler: field network hasn\'t been created');
		return;
	}

	fieldManager.resetHighlights();

	for(var ai = 0; ai < actions.length; ai++){
		var action = actions[ai];
		var card = cardManager.cards[action.cid];
		var field = fieldManager.fields[action.field];
		if(action.cid && card && (!cardHolding || (cardHolding == card || cardHolding.value == card.value && action.type != 'DEFENSE'))){
			card.setPlayability(true);
			field.setOwnPlayability(action.type, action.linkedField);
			if(action.type == 'DEFENSE'){
				field.validCards.push(card);				
			}
		}
	}
	fieldManager.tryHighlightDummy();
};

//@include:actionReactions
//@include:notificationReactions