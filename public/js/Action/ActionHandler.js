/**
* Модуль отвечает за обработку действий от сервера
* Формирует и передает информацию о действиях FieldManager'у
* @class
*/

var ActionHandler = function(reactions){

	this.actionReactions = window.actionReactions;
	this.notificationReactions = window.notificationReactions;
	this.possibleActions = null;

	this.timedAction = null;
	this.timedActionTimeout = null;
};

//ОБРАБОТКА КОМАНД СЕРВЕРА

//Выполняет действие

ActionHandler.prototype.executeAction = function(action){

	this.executeTimedAction();

	var delay = 0;

	if(fieldManager.networkCreated){
		fieldManager.resetHighlights();
		cardManager.resetRaised();
	}

	var reaction = this.actionReactions[action.type];
	if(!reaction){
		console.warn('Action handler: Unknown action type', action.type, action);
	}
	else{
		delay += reaction.call(this, action);
	}
	return delay;
};

ActionHandler.prototype.handlePossibleActions = function(actions, time, timeSent){

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
	var reaction = this.notificationReactions[note.message];
	if(!reaction){
		console.warn('Action handler: Unknown notification handler', note.message, note, actions);
	}
	else{
		reaction.call(this, note, actions);
	}
};

//Подсвечивает карты, которыми можно ходить
ActionHandler.prototype.highlightPossibleActions = function(actions){

	if(!actions && !this.possibleActions){
		return;
	}

	if(actions){
		this.possibleActions = actions;
	}
	else{
		actions = this.possibleActions;
	};

	this.executeTimedAction();

	if(!fieldManager.networkCreated){
		console.error('Action handler: field network hasn\'t been created');
		return;
	}

	fieldManager.resetHighlights();

	for(var ai = 0; ai < actions.length; ai++){
		var action = actions[ai];
		if(action.cid && game.cards[action.cid]){
			var field = fieldManager.fields[action.field],
				card = game.cards[action.cid];
			card.setPlayability(true);
			field.marked = true;
			if(action.type == 'DEFENSE'){
				field.validCards.push(card);
				field.setHighlight(true, null, action.linkedField);
			}
			else{
				field.linkedField = fieldManager.fields[action.linkedField] || null;
			}
		}
	}
	fieldManager.highlightMarkedFields();
};

ActionHandler.prototype.executeTimedAction = function(){
	if(!this.timedAction)
		return;

	clearTimeout(this.timedActionTimeout);
	this.timedAction();
	if(this.timedAction || this.timedActionTimeout)
		this.timedAction = this.timedActionTimeout = null;
};

ActionHandler.prototype.setTimedAction = function(callback, delay, context, args){
	this.executeTimedAction();

	this.timedAction = function(){
		callback.apply(context, args || []);
		this.timedAction = this.timedActionTimeout = null;
	};

	this.timedActionTimeout = setTimeout(this.timedAction.bind(this), delay);
};
