/**
* Менеджер информации об игроках, игре и игровых действиях.  
* Производит подсветку возможных действий и активирует кнопку действий,
* перенаправляет сыгранные карты на правильные поля и выводит сообщения о состоянии хода. 
* @class
*/
var GameInfo = function(){

	// Чтобы не копировать, все поля инициализируются в ресете
	this.reset();

	/**
	* Действия, которые будут перенаправлены на {@link ActionHandler#actionButton}.
	* @type {string[]}
	*/
	this.buttonActions = ['PASS', 'TAKE'];

	/**
	* Стадии хода, которые изменяют роли игроков во время хода
	* и требуют ресета информации о ходе для обработки.
	* @type {Array}
	*/
	this.roleAlteringTurnStages = ['DEFENSE_TRANSFER'];
};

GameInfo.prototype = {

	/**
	* Убирает всю информацию об игре (игроков, роли, информацию о ходе, свойства игры).  
	*/
	reset: function(){
		/**
		* id игры
		* @type {string}
		*/
		this.gameId = null;
		/**
		* Индекс игры.
		* @type {number}
		*/
		this.gameIndex = -1;

		/**
		* Правила игры.
		* @type {object}
		*/
		this.rules = null;
		/**
		* Находится игра в режиме быстрой симуляции.
		* Если `true`, все запланированные действия будут завершены перед добавлением новых
		* @type {Boolean}
		*/
		this.simulating = false;

		/**
		* Индекс локального игрока в массиве игроков.
		* @type {number}
		*/
		this.pi = null;
		/**
		* id локального игрока.
		* @type {string}
		*/
		this.pid = null;
		/**
		* Информация о локальном игроке.
		* @type {object}
		*/
		this.player = null;
		/**
		* Массив информации об игроках.
		* @type {Object[]}
		*/
		this.players = [];
		/**
		* Информация об игроках по id игроков.
		* @type {Object<Object>}
		*/
		this.playersById = {};

		/**
		* Индекс хода.
		* @type {number}
		*/
		this.turnIndex = -1;
		/**
		* Текущая стадия хода.
		* @type {string}
		*/
		this.turnStage = null;
		/**
		* Текущий защищающийся.
		* @type {object}
		*/
		this.defender = null;
		/**
		* Текущий доминирующий атакующий.
		* @type {object}
		*/
		this.attacker = null;

		if(this.message){
			this._removeMessage(this.message);
		}
		/**
		* Сообщение о текущем состоянии хода.
		* @type {Phaser.Text}
		*/
		this.message = null;
	},

	/**
	* Сохраняет информацию об игре.
	* @param {string}  gameId     id игры
	* @param {number}  gameIndex  индекс игры
	* @param {object}  rules      правила игры
	* @param {boolean} simulating находится ли игра в режиме ускоренной симуляции
	*/
	saveGameInfo: function(gameId, gameIndex, rules, simulating){
		this.gameId = gameId;
		this.gameIndex = gameIndex;
		this.rules = rules;
		this.simulating = simulating || false;
	},

	/**
	* Сохраняет информацию об игроках.
	* @param  {array} players
	*/
	savePlayers: function(players){
		this.pid = game.pid;
		this.players = players;
		this.playersById = {};
		players.forEach(function(p, i){ 
			this.playersById[p.id] = p;
			if(p.id == this.pid){
				this.player = p;
				this.pi = i;
			}
		}, this);
		if(!~this.pi){
			console.error('Game info: Player', this.pid, 'not found in players\n', players);
		}		
	},

	/**
	* Возвращает информацию об игрока по id.
	* @param {string} pid
	*
	* @return {object}
	*/
	getPlayer: function(pid){
		if(this.playersById[pid]){
			return this.playersById[pid];
		}
		else{
			console.error('Game info: Player', pid, 'not found in players\n', this.players);
			return null;
		}
	},

	/**
	* Обновляет статусы и роли игроков, запоминает текущую стадию хода,
	* и выводит сообщение о состоянии хода. 
	* @param {object} statuses  статусы игроков
	* @param {number} turnIndex номер хода
	* @param {string} turnStage стадия хода
	* @param {object} [seq]     последовательность действий, в которую будет добавлено
	*                           удаление старого сообщения о состоянии хода
	*/
	updateTurnInfo: function(statuses, turnIndex, turnStage, seq){

		if(~this.roleAlteringTurnStages.indexOf(turnStage)){
			this.resetTurnInfo(seq);
		}

		this.turnStage = turnStage;
		this.turnIndex = turnIndex;

		if(game.inDebugMode && statuses){
			this._logPlayerRoles(statuses);
		}

		this._updatePlayerRoles(statuses);

		this._updateMessage(seq);
	},

	/**
	* Обнуляет роли игроков и стадию хода, удаляет сообщение о статусе хода.
	* @param {object} [seq] последовательность в которую будет добавлено удаление сообщения о состоянии хода
	*/
	resetTurnInfo: function(seq){
		if(this.message){
			this._removeMessage(this.message, seq);
			this.message = null;
		}
		this.turnStage = null;
		this.players.forEach(function(p){
			p.role = null;
			p.roleIndex = null;
		});
		this.attacker = null;
		this.defender = null;
	},

	/**
	* Выводит статусы игроков в консоль.
	* @param  {object} statuses
	*/
	_logPlayerRoles: function(statuses){
		console.log('------');
		this.players.forEach(function(p){
			var status = statuses[p.id];
			console.log(p.name, ':', status.role, status.roleIndex, status.working, status.defenseStartCards);
		});
	},

	/**
	* Обновляет роли игроков.
	* @param {object} statuses текущие статусы игроков
	*/
	_updatePlayerRoles: function(statuses){

		if(!statuses){
			this.resetTurnInfo();
			return;
		}

		var playerIsAttacker = this._roleIsAttacker(statuses[this.player.id]);

		this.players.forEach(function(p){
			var status = statuses[p.id];
			var role = status && status.role || null;
			var roleIndex = role && status.roleIndex || null;
			var working = role && status.working || false;
			var defenseStartCards = status.defenseStartCards || 0;
			if(!role){
				if(this.defender == p){
					this.defender = null;
				}
				if(this.attacker == p){
					this.attacker = null;
				}
			}
			else if(role != p.role || roleIndex != p.roleIndex || working != p.working){

				if(role == 'defender' || role == 'takes'){
					this.defender = p;
				}
				else if(
					playerIsAttacker && p == this.player ||
					!playerIsAttacker && this._roleIsAttacker(status)
				){
					this.attacker = p;
				}
			}

			p.role = role;
			p.roleIndex = roleIndex;
			p.working = working;
			p.defenseStartCards = defenseStartCards;
		}, this);
	},

	/**
	* Определяет, является ли игрок атакуюшим по статусу.
	* @param {object} status
	*
	* @return {boolean}
	*/
	_roleIsAttacker: function(status){
		if(!status){
			return false;
		}
		return status.role == 'attacker' && status.working;
	},

	/**
	* Обновляет сообщение о состоянии хода, удаляет предыдущее сообщение.
	* @param {object} [seq] последовательность, в которую будет добавлено удаление старого сообщения
	*/
	_updateMessage: function(seq){

		var oldMessage = this.message;
		var newMessage = this._getNewMessage();

		if(!oldMessage || oldMessage.text != newMessage.text){
			if(newMessage.text){
				this.message = ui.eventFeed.newMessage(newMessage.text, newMessage.style);
			}
			else{
				this.message = null;
			}
		}
		if(oldMessage && (oldMessage.text != newMessage.text || !this.message)){
			this._removeMessage(oldMessage, seq);
		}
	},

	/**
	* Удаляет сообщение о состоянии хода.
	* @param {Phaser.Text} message
	* @param {object}      [seq]   последовательность, в которую будет добавлено удалени
	*/
	_removeMessage: function(message, seq){
		if(seq){
			seq.append(300).then(ui.eventFeed.removeMessage.bind(ui.eventFeed, message));
		}
		else{
			ui.eventFeed.removeMessage(message);
		}
	},

	/**
	* Возвращает сообщение о состоянии хода.
	* @return {object} `{text, style}`
	*/
	_getNewMessage: function(){
		var player = this.player;

		var messageText = '',
			messageStyle = null;

		var onlyOneAttacker = !this.rules.freeForAll || this.turnStage == 'INITIAL_ATTACK';

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
		else if(this.attacker && onlyOneAttacker){
			var action = this.defender.role == 'takes' ? ' is following up on ' : ' is attacking ';
			var defenderName = this.defender.id == game.pid ? 'you' : this.defender.name;
			messageText = this.attacker.name + action + defenderName;
			messageStyle = 'system';
		}
		else if(this.defender){
			messageText = this.defender.name + ' is defending'; 
			messageStyle = 'system';
		}

		return {
			text: messageText,
			style: messageStyle
		};
	},

	/**
	* Находит поле, на которое можно положиь карту.  
	* Меняет местами `field` с `field.linkedField` и возвращает `linkedField` если оно есть.
	* @param {Field} field поле, над которым находится карта
	*
	* @return {Field} Поле, на которое можно положить карту.
	*/
	findAppropriateField: function(field){
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
	},

	/**
	* Возвращает нужно ли удалить действие в соответствии с типом действия, правилами игры и `turnStage`.  
	* В некоторых случаях модифицирует едйствие.
	* @param {ActionInfo} action     проверяемое действий
	* @param {Card}       card       использованная в `doneAction` карта
	* @param {Field}      field      использованное в `doneAction` поле
	* @param {ActionInfo} doneAction исполненное действие
	*
	* @return {boolean}
	*/
	shouldDeleteAction: function(action, card, field, doneAction){

		// Избавляемся от кнопочных действий
		switch(action.type){
			case 'TAKE':
			return doneAction.type == 'ATTACK' || fieldManager.getFieldsWith(1).length === 0;

			case 'PASS':
			return this.turnStage != 'FOLLOWUP';
		}

		// Избавляемся от действий с картой, которой мы походили
		if(card.id === action.cid){
			return true;
		}

		// Избавляемся от действий, специфичных определенным стадиям хода
		switch(this.turnStage){

			case 'INITIAL_ATTACK':
			if(this.rules.canTransfer || card.value !== cardManager.cards[action.cid].value){
				return true;
			}
			return this._fixActionField(action);

			case 'FOLLOWUP':
			return (
				this.rules.limitFollowup && this.defender.defenseStartCards <= 
				fieldManager.getFieldsWith(function(f){
					return f.cards.length > 0;
				}).length
			);			

			case 'ATTACK_DEFENSE':
			if(this.player.role == 'attacker'){
				return this._fixActionField(action);
			}
			/* falls through */

			case 'DEFENSE':
			return field.id === action.field;

			case 'DEFENSE_TRANSFER':
			if(doneAction.type == 'ATTACK'){
				return true;
			}
			return field.id === action.field || action.type == 'ATTACK';

			default:
			console.error('ActionHandler: unknown turnStage', this.turnStage);
			return true;
		}
	},

	/**
	* Заменяет поле действия на первое свободное поле если оно есть.
	* @param {ActionInfo} action
	*
	* @return {boolean} Нужно ли удалить действие.
	*/
	_fixActionField: function(action){
		var table = fieldManager.getFirstEmptyTable();
		if(table){
			action.field = table.id;
			return false;
		}
		return true;
	},

	/**
	* Делает элементы игры интерактивными в соответствии с переданными действиям.
	* @param {ActionInfo[]} actions
	* @param {UI.Button}    button  кнопка, на которую будет навешено действие из {@link GameInfo#buttonActions|buttonActions}.
	*/
	applyInteractivity: function(actions, button){

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

			if(this._cardShouldBePlayable(card, action, cardHolding)){
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
			button.label.setText(this.player.role == 'defender' ? 'Take' : 'Pass');
		}

		fieldManager.tryHighlightDummy();
	},

	/** 
	* Возвращает нужно ли сделать карту играбильной.
	* @param {Card}       card
	* @param {ActionInfo} actions
	* @param {Card}       cardHolding карта, которую держит игрок
	*
	* @return {boolean}
	*/
	_cardShouldBePlayable: function(card, action, cardHolding){
		return action.cid && card && (!cardHolding || (cardHolding == card || cardHolding.value == card.value && action.type != 'DEFENSE'));
	},

	/** 
	* Делает поле и карту интерактивной в соответствии с действием.
	* @param {Card}       card
	* @param {Field}      field
	* @param {ActionInfo} action
	* @param {Field[]}    defenseFields поля, которые игрок должен отбивать
	* @param {Field}      emptyTable    первое свободное поле на столе
	*/
	_makeInteractible: function(card, field, action, defenseFields, emptyTable){
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
	},

	/**
	* Устанавливает текст и действие кнопки действия.
	* @param {UI.Button} button кнопка действия
	* @param {string}    type   тип действия
	*/
	_setButtonAction: function(button, type){
		button.serverAction = type;
		var typeText = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
		//var typeText = type.toLowerCase();
		//var typeText = type;
		button.label.setText(typeText);
		button.enable();
	}
};
