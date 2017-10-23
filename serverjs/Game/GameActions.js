'use strict';

class GameActions{
	constructor(game, players, timeouts, prioritised){

		this.game = game;
		this.log = this.game.log;

		this.complete = null;
		this.deadline = null;
		this.valid = {};
		players.forEach((p) =>{
			this.valid[p.id] = [];
		});
		this.stored = [];

		this.prioritised = prioritised || [];

		// Время ожидания сервера
		this.timeouts = timeouts || {};

		let requiredTimeouts = {
			gameStart: 10,
			gameEnd: 20,
			deal: 10,
			actionComplete: 3,
			afk: 5
		};

		for(let key in requiredTimeouts){
			if(requiredTimeouts.hasOwnProperty(key) && !this.timeouts.hasOwnProperty(key)){
				this.timeouts[key] = requiredTimeouts[key];
			}
		}
	}

	// Ресетит все действия
	reset(){
		this.complete = null;
		this.deadline = null;
		this.stored.length = 0;
		this.clearValid();
	}

	// Получает и обрабатывает действие
	recieve(player, action){

		const game = this.game;

		// Проверяем валидность ответа
		let playersWorking = game.players.working;
		let pi = playersWorking.indexOf(player);

		// Запоздавший или непредвиденный ответ
		if(!~pi){
			this.log.warn( player.name, player.id, 'Late or uncalled response', action);

			// Сообщаем игроку, что действие пришло не вовремя
			if(action){
				game.players.notify({
					type: 'LATE_OR_UNCALLED_ACTION',
					action: action
				},
				[player]);
			}
			return;
		}

		// Ожидается действие, но действие не получено, перепосылаем действия
		if(this.valid[player.id].length && !action){
			this.log.warn(player.name, 'Wating for action but no action recieved');
			if(game.isRunning){
				player.recieveValidActions(this.valid[player.id], this.deadline, game.players.roles, game.turnStages.current);
			}
			return;
		}

		this.log.silly('Response from', player.id, action ? action : '');

		// Выполняем или сохраняем действие
		let waitingForResponse = false;
		if(action){
			// Игрок выбрал действие, он не afk
			if(player.afk){
				player.afk = false;
			}

			// Выполняем или сохраняем действие
			if(game.states.current == 'STARTED'){
				waitingForResponse = true;
				this.process(player, action);
			}
			else{
				this.store(player, action);
			}
		}

		// Если мы не оповещали игроков и не ждем от них нового ответа
		if(!waitingForResponse){
			// Убираем игрока из списка действующих
			playersWorking.splice(pi, 1);	
			game.players.working = playersWorking;

			// Если больше нет действующих игроков, перестаем ждать ответа и продолжаем ход
			if(!playersWorking.length){
				clearTimeout(game.timer);
				// jshint curly:false
				while(game.continue());
			}
		}
	}

	// Выполняет действие, оповещает игроков о результатах действия
	process(player, action){

		const game = this.game;

		let outgoingAction = this.execute(player, action);

		// Если действие легально
		if(outgoingAction){

			// Очищаем список действующих игроков
			game.players.working = [];

			this.complete = outgoingAction;
			// Делаем один шаг в игре, чтобы узнать, нужно ли дать игрокам время на обработку выполненного действия
			game.continue();

			// Сообщаем игрокам о действии
			// Если дальнейших действий пока нет, даем игрокам время на обработку выполненного действия
			if(this.complete == outgoingAction){
				this.complete = null;
				game.waitForResponse(this.timeouts.actionComplete, game.players);
				game.players.completeActionNotify(outgoingAction);
			}
		}
		// иначе сообщаем игроку, что действие нелегально
		else{
			game.players.notify(
				{
					type: 'INVALID_ACTION',
					action: action,
					actions: this.valid[player.id].slice(),
					time: this.deadline,
					timeSent: Date.now()
				},
				[player]
			);
		}		
	}

	// Находит и возвращает локальную копию переданного действия или null
	// ignored может быть массивом игнорируемых свойств действия
	checkValidity(pid, action, ignored){

		let validActions = this.valid[pid];
		outer:	// https:// developer.mozilla.org/en/docs/Web/JavaScript/Reference/Statements/label
		for(let i = 0; i < validActions.length; i++){
			let validAction = validActions[i];
			for(let k in validAction){
				if(!validAction.hasOwnProperty(k)){
					continue;
				}
				if((!ignored || !~ignored.indexOf(k)) && validAction[k] != action[k]){
					continue outer;
				}
			}
			return Object.assign({}, validAction);
		}
		return null;
	}

	// Запоминает возможные действия игроков
	setValid(actions){
		for(let pid in this.valid){
			if(this.valid.hasOwnProperty(pid)){
				this.valid[pid] = actions.slice();
			}
		}
	}

	// Удаляет возможные действия игроков
	clearValid(){
		for(let pid in this.valid){
			if(this.valid.hasOwnProperty(pid)){
				this.valid[pid].length = 0;
			}
		}
	}

	// Возвращает есть ли возможные действия
	hasValid(){
		for(let pid in this.valid){
			if(this.valid.hasOwnProperty(pid) && this.valid[pid].length){
				return true;
			}
		}
		return false;
	}

	// Возвращает названия свойств действий, которые будут игнорироваться при сверении действия
	getIgnoredKeys(action){
		return null;
	}

	// Обрабатывает полученное от игрока действие, возвращает исходящее действие
	execute(player, incomingAction){

		const game = this.game;

		let action = this.checkValidity(player.id, incomingAction, this.getIgnoredKeys(incomingAction));

		// Проверка действия
		if(!action){
			this.log.warn(
				'Invalid action', player.id,
				incomingAction && incomingAction.type, incomingAction, this.valid
			);
			//debugger
			return null;
		}

		// Выполняем действие
		let reaction = game.reactions[action.type];
		if(!reaction){
			this.log.warn('Unknown action', action.type);
			return null;
		}
		action = reaction.call(game, player, action);
		action.pid = player.id;

		// Обнуляем возможные действия
		this.clearValid();

		game.hoverOutCard(player);

		return action;
	}

	// Выполняет первое дейтсие из this.valid
	// Приоритизирует PASS и TAKE
	executeFirst(){
		const game = this.game;

		let playersWorking = game.players.working;
		let player;
		let validActions;
		let actionIndex = 0;
		outer:
		for(let pid in this.valid){
			if(!this.valid.hasOwnProperty(pid)){
				continue;
			}
			validActions = this.valid[pid];
			for(let ai = 0; ai < validActions.length; ai++){
				let action = validActions[ai];
				if(~this.prioritised.indexOf(action.type)){
					player = game.players.byId[pid];
					actionIndex = ai;
					break outer;
				}
			}
		}

		if(!player){
			player = playersWorking[0];
			validActions = this.valid[player.id];
		}

		// Устанавливаем, что игрок не выбрал действие
		player.afk = true;
		let outgoingAction = this.execute(player, validActions[actionIndex]);

		// Обнуляем список действующих
		game.players.working = [];

		game.waitForResponse(this.timeouts.actionComplete, game.players);
		// Отправляем оповещение о том, что время хода вышло
		game.players.notify({type: 'TOO_SLOW'}, playersWorking);
		game.players.completeActionNotify(outgoingAction);
	}

	// Сохраняет полученное действие игрока
	store(player, incomingAction){

		// Проверка действия
		let action = this.checkValidity(player.id, incomingAction);

		if(!action){
			this.log.warn('Invalid action', player.id, incomingAction.type, incomingAction, this.valid);
			return;
		}

		action.pid = player.id;

		this.stored[player.id] = Object.assign({}, action);

		let accepted = action.type == 'ACCEPT';

		this.game.players.forEachOwn((p) => {
			if(p != player){
				p.recieveNotification({type: 'VOTE', accepted, name: player.name, channel: 'extra'});
			}
		})

		if(!accepted){
			this.game.players.disconnect(player);
		}
	}

	// Считает сохраненные голоса и возвращает результаты
	checkStored(){

		const game = this.game;

		let allAccepted = true;
		let allConnected = true;
		let allVoted = true;
		let successful = true;

		// Проверяем, что все, кто проголосовал, проголосовали за
		let results = [];
		for(let pid in this.stored){
			if(!this.stored.hasOwnProperty(pid)){
				continue;
			}
			let action = this.stored[pid];
			if(allAccepted && action.type != 'ACCEPT'){
				allAccepted = false;
			}
			results.push(Object.assign({}, action));
		}

		// Проверяем, что все подключены и все проголосовали
		for(let i = game.players.length - 1; i >= 0; i--){			
			let player = game.players[i];
			if(allConnected && !player.connected){
				allConnected = false;
			}
			if(!this.stored[player.id]){
				allVoted = false;
				game.players.disconnect(player);
			}
		}

		if(!allAccepted){
			this.log.info('Some players voted against rematch');
		}
		else if(!allConnected){
			this.log.info('Some players disconnected');
		}else if(!allVoted){
			this.log.info('Some players didn\'t vote');
		}

		if(!allAccepted || !allConnected || !allVoted){
			successful = false;
		}

		let note = {
			type: 'VOTE_RESULTS',
			results: results,
			successful: successful
		};

		return note;
	}

	// Оповещает игроков о сохраненном выполненном действии
	completeNotify(){
		const game = this.game;

		if(!this.complete){
			return;
		}

		this.complete.noResponse = true;
		game.players.completeActionNotify(this.complete);
		this.complete = null;
	}

	// Записывает действие над картой в лог
	logAction(card, actionType, from, to){
		throw new Error('Must be implemented by subclass');
	}

}

module.exports = GameActions;