/**
* Модуль отвечает за обработку действий и оповещений от сервера.
* Подсвечивает возможные действия и управляет кнопкой действия и таймером хода.
* @class
* @param {string}           correctState
* @param {object<function>} actionReactions
* @param {object<function>} notificationReactions
*/

var ActionHandler = function(correctState, actionReactions, notificationReactions){

	/**
	* Состояние игры в котором можно обрабатывать действия и оповещения.
	* @type {string}
	*/
	this.correctState = correctState;

	/**
	* Методы, реагирующие на действия переданные от сервера.
	* @see  {@link actionReactions}
	* @type {object<function>}
	*/
	this.actionReactions = actionReactions;

	/**
	* Методы, реагирующие на оповещения от сервера.
	* @see  {@link notificationReactions}
	* @type {object<function>}
	*/
	this.notificationReactions = notificationReactions;

	/**
	* Сохраненные возможные действия.
	* @type {object}
	*/
	this.possibleActions = null;

	/**
	* Текущая стадия хода.
	* @type {string}
	*/
	this.turnStage = null;

	/**
	* Ожидает ли модуль информации об игре от сервера
	* @type {Boolean}
	* @private
	*/
	this._waitingForGameInfo = false;
};

// ОБРАБОТКА КОМАНД СЕРВЕРА

/** Переставляет игру в правильное состояние и запрашивает информацию об игре у сервера */
ActionHandler.prototype.changeToCorrectState = function(){
	console.warn('ActionHandler: changing to ' + this.correctState + ' state');
	this._waitingForGameInfo = true;
	game.state.change(this.correctState);
	connection.server.reconnect();
};

/**
* Выполняет действие.
* @param {object} action      действие
* @param {string} action.type тип действия по которому будет вызвана соответствующая функция из {@link ActionHandler#actionReactions}
*
* @return {number} Время выполнения действия.
*/
ActionHandler.prototype.executeAction = function(action){

	if(!action){
		console.error('Action handler: no action recieved');
		return;
	}

	if(this._waitingForGameInfo && action.type == 'GAME_INFO_UPDATE' || action.type == 'GAME_INFO'){
		this._waitingForGameInfo = false;
	}

	if(game.inDebugMode){
		ui.feed.newMessage(action.type, 'system', 2000);
	}

	if(game.state.currentSync != this.correctState){
		this.changeToCorrectState();
		return;
	}

	if(this._waitingForGameInfo){		
		console.error('Action handler: waiting for game info, instead got', action.type, action);
		return;
	}

	game.seq.finish();

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

/**
* Позволяет игроку выбрать действие из списка при помощи интеракции с игрой.
* @param {object} actions 	возможные действия
* @param {number} time 	время, до которого необходимо выбрать действие
* @param {number} timeSent время в которое действия были отправлены с сервера
* @param {string} turnStage текущая стадия хода
*/
ActionHandler.prototype.handlePossibleActions = function(actions, time, timeSent, turnStage){
	if(!actions){
		console.error('Action handler: no actions recieved');
		return;
	}

	if(game.state.currentSync != this.correctState){
		this.changeToCorrectState();
		return;
	}

	if(this._waitingForGameInfo){		
		console.error('Action handler: waiting for game info, instead got possible actions', actions);
		return;
	}

	this.turnStage = turnStage;

	time = time - Date.now();
	if(time){
		ui.rope.start(time - 1000);
	}

	this.highlightPossibleActions(actions);
};

/**
* Реагирует на оповещение от сервера
* @param  {object} note 		   оповещение
* @param  {string} note.message    тип оповещения по которому будет вызвана соответствующая функция из {@link ActionHandler#notificationReactions}
*/
ActionHandler.prototype.handleNotification = function(note, actions){
	if(!note){
		console.error('Action handler: no note recieved');
		return;
	}

	if(game.inDebugMode){
		ui.feed.newMessage(note.message, 'system', 2000);
	}

	if(game.state.currentSync != this.correctState){
		this.changeToCorrectState();
		return;
	}

	if(this._waitingForGameInfo){		
		console.error('Action handler: waiting for game info, instead got', note.message, note);
		return;
	}

	var reaction = this.notificationReactions[note.message];
	if(!reaction){
		console.warn('Action handler: Unknown notification handler', note.message, note, actions);
	}
	else{
		reaction.call(this.notificationReactions, note, actions);
	}
};

/**
* Подсвечивает карты, которыми можно ходить и активирует кнопку действия.
* @param {object} actions 	возможные действия
*/
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

	game.seq.finish();

	if(!fieldManager.networkCreated){
		console.error('Action handler: field network hasn\'t been created');
		return;
	}

	fieldManager.resetHighlights();

	var button = ui.actionButtons.getByName('action');
	button.disable();

	for(var ai = 0; ai < actions.length; ai++){
		var action = actions[ai];
		if(action.type == 'SKIP' || action.type == 'TAKE'){
			this.setButtonAction(button, action.type);
			continue;
		}
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

/**
* Устанавливает текст и действие кнопки действия.
* @param {Button} button кнопка действия
* @param {string} type   тип действия
*/
ActionHandler.prototype.setButtonAction = function(button, type){
	this.buttonAction = type;
	var typeText = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
	button.label.setText(typeText);
	button.enable();
};

/** Убирает все возможные действия */
ActionHandler.prototype.resetActions = function(){
	this.possibleActions = null;
	this.turnStage = null;
};

/** Убирает все возможные действия и ресетит связанные с ними элементы игры */
ActionHandler.prototype.reset = function(){
	this.resetActions();
	fieldManager.resetHighlights();
	ui.actionButtons.getByName('action').disable();
	ui.rope.stop();
};

/** Убирает определенные действия из `possibleActions` в соответствии с `turnStage`. */
ActionHandler.prototype.removeActionsWith = function(card, field, doneAction){
	if(!this.possibleActions){
		return;
	}
	for(var i = this.possibleActions.length - 1; i >= 0; i--){
		var action = this.possibleActions[i];
		if(this._shouldDeleteAction(action, card, field, doneAction)){
			this.possibleActions.splice(i, 1);
		}
	}
	if(this.possibleActions.length == 1 && this.possibleActions[0].type == 'TAKE'){
		this.possibleActions.length = 0;
	}
};

/**
* Возвращает нужно ли удалить действие в соответствии с `turnStage`
*/
ActionHandler.prototype._shouldDeleteAction = function(action, card, field, doneAction){
	switch(this.turnStage){
		case 'INITIAL_ATTACK':
		return card.id === action.cid || card.value !== cardManager.cards[action.cid].value;

		case 'REPEATING_ATTACK':
		/* falls through */

		case 'ATTACK':
		/* falls through */

		case 'SUPPORT':
		/* falls through */

		case 'FOLLOWUP':
		return card.id === action.cid || field.id === action.linkedField;

		case 'DEFENSE':
		if(doneAction.type == 'ATTACK'){
			return true;
		}
		else{
			return card.id === action.cid || field.id === action.field || action.type == 'ATTACK';
		}
		break;
		
		default:
		console.error('ActionHandler: unknown turnStage', this.turnStage);
		break;
	}
};

//@include:actionReactions
//@include:notificationReactions