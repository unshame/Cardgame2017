/**
* Менеджер игроков и информации об игре.
* @class
*/

var GameInfo = function(){
	this.reset();

	this.buttonActions = ['PASS', 'TAKE'];
};

GameInfo.prototype.savePlayers = function(players, gameId){
	this.gameId = gameId;
	this.players = players;
	var playersById = this.playersById = {};
	this.pid = game.pid;
	this.pi = players.map(function(p){ 
		playersById[p.id] = p;
		return p.id;
	}).indexOf(this.pid);
	if(!~this.pi){
		console.error('Game info: Player', this.pid, 'not found in players\n', players);
		return;
	}
};

GameInfo.prototype.reset = function(){
	this.gameId = null;
	this.pi = null;
	this.pid = null;
	this.defender = null;
	this.attacker = null;
	this.players = [];
	this.player = null;
	this.playersById = {};
	if(this.message){
		ui.eventFeed.removeMessage(this.message);
	}
	this.message = null;

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

	this.rules = null;
};

GameInfo.prototype.resetTurnInfo = function(){
	if(this.message){
		ui.eventFeed.removeMessage(this.message);
		this.message = null;
	}
	this.turnStage = null;
	this.players.forEach(function(p){
		p.role = null;
		p.roleIndex = null;
	});
};

GameInfo.prototype.getPlayer = function(pid){
	if(this.playersById[pid]){
		return this.playersById[pid];
	}
	else{
		console.error('Game info: Player', pid, 'not found in players\n', this.players);
		return null;
	}
};

GameInfo.prototype.updateInfo = function(roles, turnStage){
	var oldMessage = this.message;

	var player = this.playersById[this.pid];

	this.turnStage = turnStage;
	console.log('------')
	this.players.forEach(function(p){
		var role = roles[p.id];
		console.log(p.name, role.role, role.roleIndex, role.working)
	})
	this.players.forEach(function(p){
		var role = roles && roles[p.id] && roles[p.id].role;
		var roleIndex = role && roles[p.id].roleIndex;
		var working = role && roles[p.id].working;
		if(!role){
			p.role = null;
			p.roleIndex = null;
			p.working = false;
			if(p.role == 'defender' || role == 'takes'){
				this.defender = null;
			}
			if(p.role == 'attacker'){
				this.attacker = null;
			}
		}
		else if(role != p.role || roleIndex != p.roleIndex || working != p.working){
			p.role = roles[p.id].role;
			p.roleIndex = roleIndex;
			p.working = working;
			if(role == 'defender' || role == 'takes'){
				this.defender = p;
			}
			else if(role == 'attacker' && working){
				this.attacker = p;
			}
		}
	}, this);

	var messageText = '',
		messageStyle = null;

	if(player == this.defender || player == this.attacker){
		switch(player.role){
			case 'attacker':
			if(fieldManager.fields[this.pid].cards.length > 0){
				messageText = (this.defender.role == 'takes' ? 'You\'re following up on ' : 'You\'re attacking ') + this.defender.name;
			}
			messageStyle = 'neutral';
			break;

			case 'defender':
			messageText = 'You\'re defending';
			messageStyle = 'neutral';
			break;

			case 'takes':
			messageText = 'Following up...';
			messageStyle = 'system';
			break;

			default:
			console.error('Game info: unknown player role', player.role);
		}
	}
	else if(this.attacker){
		var defenderName = this.defender.id == game.pid ? 'you' : this.defender.name;
		messageText = this.attacker.name + (this.defender.role == 'takes' ? ' is following up on ' : ' is attacking ') + defenderName;
		messageStyle = 'system';
	}
	if(!oldMessage || oldMessage.text != messageText){
		if(messageText){
			this.message = ui.eventFeed.newMessage(messageText, messageStyle);
		}
		else{
			this.message = null;
		}
	}
	if(oldMessage && (oldMessage.text != messageText || !this.message)){
		actionHandler.sequencer.queueUp(300).then(ui.eventFeed.removeMessage.bind(ui.eventFeed, oldMessage));
	}
};

GameInfo.prototype.findAppropriateField = function(field){
	if(field.linkedField && !field.icon && !field.cards.length){
		fieldManager.swapFields(field, field.linkedField);
		return field.linkedField;
	}
	if(field.type == 'TABLE' && field.playable == 'ATTACK'){
		var emptyTable = fieldManager.getFirstEmptyTable();
		if(emptyTable){
			return emptyTable;
		}
	}
	return field;
};

GameInfo.prototype.cardIsPlayable = function(card, action, cardHolding){
	return action.cid && card && (!cardHolding || (cardHolding == card || cardHolding.value == card.value && action.type != 'DEFENSE'));
};

GameInfo.prototype.shouldResetActions = function(actions){
	return actions.length == 1 && actions[0].type == 'TAKE';
};

/**
* Возвращает нужно ли удалить действие в соответствии с `turnStage`
*/
GameInfo.prototype.shouldDeleteAction = function(action, card, field, doneAction){
	switch(this.turnStage){
		case 'INITIAL_ATTACK':
		if(card.value !== cardManager.cards[action.cid].value){
			return true;
		}
		/* falls through */

		case 'REPEATING_ATTACK':
		/* falls through */

		case 'ATTACK':
		/* falls through */

		case 'SUPPORT':
		/* falls through */

		case 'FOLLOWUP':
		if(card.id === action.cid){
			return true;
		}
		if(field.id === action.field){
			return this._fixActionField(action);
		}
		return true;

		case 'DEFENSE':
		if(doneAction.type == 'ATTACK'){
			if(action.type == 'ATTACK'){
				return this._fixActionField(action);
			}
			else{
				return true;
			}
		}
		return card.id === action.cid || field.id === action.field || action.type == 'ATTACK';
		
		default:
		console.error('ActionHandler: unknown turnStage', this.turnStage);
		break;
	}
};

GameInfo.prototype._fixActionField = function(action){
	var table = fieldManager.getFirstEmptyTable();
	if(table){
		action.field = table.id;
		return false;
	}
	return true;
}

GameInfo.prototype.applyInteractivity = function(actions, button){

	fieldManager.resetHighlights();

	var cardHolding = cardControl.card;
	var hasButtonAction = false;

	var defenseFields = [];
	actions.forEach(function(action){
		if(action.type == 'DEFENSE'){
			defenseFields.push(fieldManager.fields[action.field]);
		}
	});

	var emptyTable = fieldManager.getFirstEmptyTable();

	for(var ai = 0; ai < actions.length; ai++){
		var action = actions[ai];

		if(~this.buttonActions.indexOf(action.type)){
			hasButtonAction = true;
			this._setButtonAction(button, action.type);
			continue;
		}

		var card = cardManager.cards[action.cid];
		var field = fieldManager.fields[action.field];

		if(this.cardIsPlayable(card, action, cardHolding)){
			this._makeInteractible(card, field, action, defenseFields, emptyTable);
		}
	}

	if(hasButtonAction){
		if(actions.length == 1){
			button.changeStyle(1);
		}
		else if(actions.length > 1){
			button.changeStyle(0);
		}
	}
	else{
		button.serverAction = null;
		button.disable();
		button.changeStyle(0);
	}

	fieldManager.tryHighlightDummy();
};

GameInfo.prototype._makeInteractible = function(card, field, action, defenseFields, emptyTable){
	card.setPlayability(true);
	field.setOwnPlayability(action.type);
	switch(action.type){
		case 'DEFENSE':
		field.validCards.push(card);				
		break;

		case 'ATTACK':
		if(!emptyTable){
			break;
		}
		fieldManager.table.forEach(function(f){
			if(!~defenseFields.indexOf(f)){
				f.setOwnPlayability(action.type, emptyTable);
			}
		});
		break;		
	}
};

/**
* Устанавливает текст и действие кнопки действия.
* @param {UI.Button} button кнопка действия
* @param {string}    type   тип действия
*/
GameInfo.prototype._setButtonAction = function(button, type){
	button.serverAction = type;
	var typeText = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
	//var typeText = type.toLowerCase();
	//var typeText = type;
	button.label.setText(typeText);
	button.enable();
};