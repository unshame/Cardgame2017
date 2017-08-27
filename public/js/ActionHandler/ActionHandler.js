/**
* Модуль отвечает за обработку действий и оповещений от сервера.
* Подсвечивает возможные действия и управляет кнопкой действия и таймером хода.
* @class
*/
var ActionHandler = function(){

	/**
	* Каналы с действиями.
	* @type {Object}
	*/
	this.channels = {};

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
	* Находится игра в режиме быстрой симуляции.
	* Если `true`, все запланированные действия будут завершены перед добавлением новых
	* @type {Boolean}
	*/
	this.simulating = false;

	/**
	* Менеджер последовательностей игровых действий и анимаций.
	* @type {Sequencer}
	*/
	this.sequencer = new Sequencer(connection.server.sendResponse);
};

/**
* Добавляет канал для управление игрой с сервера.
* @param {string}           name               уникальное имя канала
* @param {CHANNEL_TYPE}     type               тип канала
* @param {string}           state              Состояние игры, в котором она должна быть для выполнения действий этого канала.
*                                              Если действие выполняется в неверном состоянии, игра будет переведена в верное состояние.  
* @param {object<function>} [reactions]        объект с функциями, соответствующие типу действий от сервера
* @param {array}            [additionalStates] Дополнительные состояния игры, в которых действия этого канала не могут выполняться,
*                                              но в которых эти действия могут быть приняты. Избавляется от выведения предупреждения
*                                              при получении действия в другом канале, нежеле указаном в `state`.
*/
ActionHandler.prototype.addChannel = function(name, type, state, reactions, additionalStates){
	if(this.channels[name]){
		console.error('ActionHandler: channel already exists', name);
	}
	var channel = {};
	channel.name = name;
	channel.type = type;
	channel.state = state;
	channel.reactions = reactions || null;
	channel.additionalStates = additionalStates || [];
	this.channels[name] = channel;
};

// ОБРАБОТКА КОМАНД СЕРВЕРА

/**
* Выполняет действие.
* @param {object} action         действие
* @param {string} action.type    тип действия по которому будет вызвана соответствующая функция из.
* @param {string} action.channel канал, по которому будет вызвано действие
*
* @return {number} Время выполнения действия.
*/
ActionHandler.prototype.executeAction = function(action){
	
	if(!action){
		console.error('Action handler: no action recieved');
		return;
	}
	var channel = this.channels[action.channel];

	if(!channel){
		console.error('Action handler: channel not found', action.channel, action);
		return;
	}

	switch(channel.type){
		case CHANNEL_TYPE.USER_INVOLVED:
		this.handlePossibleActions(action.actions, action.time, action.timeSent, action.turnStage);
		return;

		case CHANNEL_TYPE.RESPOND:
		if(!action.noResponse){
			connection.serverWaiting = true;
		}
		else if(!action.noInterrupt){
			connection.serverWaiting = false;
		}
		break;

		case CHANNEL_TYPE.INTERRUPT:
		if(!action.noInterrupt){
			connection.serverWaiting = false;
		}
		break;

		case CHANNEL_TYPE.NO_ACTION:
		break;

		default:
		console.error('ActionHandler: invalid channel type', channel.type, channel, action);
		break;
	}

	var reaction = channel.reactions[action.type];
	if(!reaction){
		console.warn('Action handler: unknown action type', action.channel, action.type, action);
		return;
	}

	if(this.simulating || action.instant){
		this.sequencer.finish();
	}
	
	this.sequencer.queueUp(function(seq, sync){
		if(channel.state != game.state.currentSync){
			if(!~channel.additionalStates.indexOf(game.state.currentSync)){
				console.warn('Action handler: wrong game state', game.state.currentSync, action.channel, channel.state, action);
			}
			game.state.change(channel.state, false);
		}
		return reaction.call(channel.reactions, action, seq, sync);
	});
};

/**
* Позволяет игроку выбрать действие из списка при помощи интеракции с игрой.
* @param {object} actions 	возможные действия
* @param {number} time 	время, до которого необходимо выбрать действие
* @param {number} timeSent время в которое действия были отправлены с сервера
* @param {string} turnStage текущая стадия хода
*/
ActionHandler.prototype.handlePossibleActions = function(actions, time, timeSent, turnStage){
	this.sequencer.queueUp(function(){
		var state = this.channels.possible_actions.state;
		if(state != game.state.currentSync){
			console.warn('Action handler: wrong game state', game.state.currentSync, state);
			game.state.change(channel.state);
			return;
		}

		this.turnStage = turnStage;

		time = time - Date.now();
		if(time){
			ui.rope.start(time - 1000);
		}

		this.highlightPossibleActions(actions);
	}, 0, this);
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

	if(!fieldManager.networkCreated){
		console.error('Action handler: field network hasn\'t been created');
		return;
	}

	fieldManager.resetHighlights();

	var button = ui.actionButtons.getByName('action');
	button.disable();

	for(var ai = 0; ai < actions.length; ai++){
		var action = actions[ai];
		if(action.type == 'PASS' || action.type == 'TAKE'){
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
* @param {UI.Button} button кнопка действия
* @param {string}    type   тип действия
*/
ActionHandler.prototype.setButtonAction = function(button, type){
	this.buttonAction = type;
	var typeText = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
	//var typeText = type.toLowerCase();
	//var typeText = type;
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

//@include:reactPrimary
//@include:reactSecondary
//@include:reactExtra
//@include:reactQueue