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
	* Кнопка действия.
	* @type {UI.Button}
	*/
	this.actionButton = null;

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
* @param {string}           [state]            Состояние игры, в котором она должна быть для выполнения действий этого канала.
*                                              Если действие выполняется в неверном состоянии, игра будет переведена в верное состояние.  
*                                              Если не указать, действие будет выполняться в любом состоянии.
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

	var reaction;
	var context = null;

	switch(channel.type){
		case CHANNEL_TYPE.USER_INVOLVED:
		connection.serverWaiting = false;
		reaction = this.handlePossibleActions;
		context = this;
		break;

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
		return;
	}

	if(!reaction){
		reaction = channel.reactions[action.type];
	}
	if(!reaction){
		console.warn('Action handler: unknown action type', action.channel, action.type, action);
		return;
	}
	if(!context){
		context = channel.reactions;
	}

	if(gameInfo.simulating || action.instant){
		this.sequencer.finish();
	}

	if(channel.state){
		this.sequencer.queueUp(function(seq, sync){
			if(channel.state != game.state.currentSync){
				if(!~channel.additionalStates.indexOf(game.state.currentSync)){
					console.warn('Action handler: wrong game state', game.state.currentSync, action.channel, channel.state, action);
				}
				game.state.change(channel.state, false);
			}
			return reaction.call(this, action, seq, sync);
		}, null, context);
	}
	else{
		reaction.call(context, action);
	}
};

/**
* Позволяет игроку выбрать действие из списка при помощи интеракции с игрой.
* @param {object} actions 	возможные действия
* @param {number} time 	время, до которого необходимо выбрать действие
* @param {number} timeSent время в которое действия были отправлены с сервера
* @param {string} turnStage текущая стадия хода
*/
ActionHandler.prototype.handlePossibleActions = function(action, seq){
	if(action.actions.length){
		var time = action.time - Date.now();
		if(time){
			ui.rope.start(time - 1000);
		}
	}
	if(action.roles){
		gameInfo.updateTurnInfo(action.roles, action.turnIndex, action.turnStage, action.actions.length !== 0, seq);
		fieldManager.updateBadges();
	}

	this.highlightPossibleActions(action.actions);
};

/**
* Подсвечивает карты, которыми можно ходить и активирует кнопку действия.
* @param {object} actions 	возможные действия
*/
ActionHandler.prototype.highlightPossibleActions = function(actions){
	if(!actions && !this.possibleActions){
		return;
	}

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

	gameInfo.applyInteractivity(actions, this.actionButton);
};

/** Убирает все возможные действия */
ActionHandler.prototype.resetActions = function(){
	this.possibleActions = null;
	this.actionButton.serverAction = null;
	this.actionButton.changeStyle(0);
};

/** Убирает все возможные действия и ресетит связанные с ними элементы игры */
ActionHandler.prototype.reset = function(){
	this.resetActions();
	fieldManager.resetHighlights();	
	this.actionButton.disable();
	this.actionButton.changeStyle(0);
	ui.rope.stop();
};

/** Убирает определенные действия из `possibleActions` в соответствии с `turnStage`. */
ActionHandler.prototype.removeActionsWith = function(card, field, doneAction){
	if(!this.possibleActions){
		return;
	}
	for(var i = this.possibleActions.length - 1; i >= 0; i--){
		var action = this.possibleActions[i];
		if(gameInfo.shouldDeleteAction(action, card, field, doneAction)){
			this.possibleActions.splice(i, 1);
		}
	}
};


//@include:reactPrimary
//@include:reactSecondary
//@include:reactExtra
//@include:reactQueue
//@include:reactMenu
//@include:reactSystem
