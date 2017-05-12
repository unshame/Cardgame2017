/**
* Модуль отвечает за обработку действий от сервера
* Формирует и передает информацию о действиях FieldManager'у
* @class
*/

var ActionHandler = function(reactions){

	this.actionReactions = window.actionReactions;
	this.notificationReactions = window.notificationReactions;
	this.action = null;
	this.possibleActions = null;

	this.timedAction = null;
	this.timedActionTimeout = null;
};

//ОБРАБОТКА КОМАНД СЕРВЕРА

//Выполняет действие

ActionHandler.prototype.executeAction = function(action){

	this.executeTimedAction();

	if(action.type == 'GAME_INFO' && action.players.length){
		playerManager.savePlayers(action.players);
		cardManager.disablePhysics();
		if(fieldManager.networkCreated){
			fieldManager.builder.adjustFieldNetwork();
		}
		else{
			fieldManager.builder.createFieldNetwork();
		}
	}

	this.action = action;

	if(!fieldManager.networkCreated){
		console.error('Action handler: field network hasn\'t been created');
		return;
	}

	fieldManager.resetHighlights();

	cardManager.resetRaised();

	var reaction = this.actionReactions[action.type],
		delay = 0;
	if(!reaction){
		console.warn('Action handler: Unknown action type', action.type, action);
	}
	else{
		delay = reaction.call(this, action);
	}
	return delay;
};

ActionHandler.prototype.handlePossibleActions = function(actions, time, timeSent){

	var actionTypes = actions.map(function(a){return a.type;});
	if(~actionTypes.indexOf('SKIP')){
		this.realAction = 'SKIP';
		ui.actionButtons.getByName('action').label.setText('Skip');
		ui.actionButtons.getByName('action').enable();
	}
	else if(~actionTypes.indexOf('TAKE')){
		this.realAction = 'TAKE';
		ui.actionButtons.getByName('action').label.setText('Take');
		ui.actionButtons.getByName('action').enable();
	}

	var currentTime = new Date();
	time = time - currentTime.getTime();
	if(time)
		ui.rope.start(time - 1000);

	this.highlightPossibleActions(actions, time, timeSent);
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

	this.executeTimedAction();

	if(!fieldManager.networkCreated){
		console.error('Action handler: field network hasn\'t been created');
		return;
	}

	this.possibleActions = actions;
	
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
