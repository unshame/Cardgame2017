'use strict';

class Actions{
	constructor(game){

		this.game = game;
		this.log = this.game.log;

		this.complete = null;
		this.deadline = null;
		this.valid = [];
		this.stored = [];

		//Время ожидания сервера
		this.timeouts = {
			gameStart: 10,
			gameEnd: 20,
			trumpCards: 10,
			deal: 10,
			discard: 5,
			take: 5,
			actionComplete: 3,
			actionAttack: 20,
			actionDefend: 20,
			afk: 5
		};
	}

	reset(){
		this.valid.length = 0;
		this.stored.length = 0;
	}

	//Получает и обрабатывает действие
	recieve(player, action){

		const game = this.game;

		//Проверяем валидность ответа
		let playersWorking = game.players.working;
		let pi = playersWorking.indexOf(player);

		// Запоздавший или непредвиденный ответ
		if(!~pi){
			if(player.type != 'player' || !this.simulating){
				this.log.warn( player.name, player.id, 'Late or uncalled response');
			}

			//Сообщаем игроку, что действие пришло не вовремя
			if(action){
				game.players.notify({
					message: 'LATE_OR_UNCALLED_ACTION',
					action: action
				},
				null,
				[player]);
			}
			return;
		}

		// Ожидается действие, но действие не получено, перепосылаем действия
		if(this.valid.length && !action){
			this.log.warn(player.name, 'Wating for action but no action recieved');
			if(game.isGoing){
				player.recieveValidActions(this.valid.slice(), (this.deadline - Date.now())/1000);
			}
			return;
		}

		this.log.silly('Response from', player.id, action ? action : '');

		//Выполняем или сохраняем действие
		let waitingForResponse = false;
		if(action){
			//Игрок выбрал действие, он не afk
			if(player.afk){
				player.afk = false;
			}

			if(game.states.current == 'STARTED'){
				waitingForResponse = true;
				this.process(player, action);
			}
			else{
				this.store(player, action);
			}
		}

		//Если мы не оповещали игроков и не ждем от них нового ответа
		if(!waitingForResponse){
			//Убираем игрока из списка действующих
			playersWorking.splice(pi, 1);	
			game.players.working = playersWorking;

			//Если больше нет действующих игроков, перестаем ждать ответа и продолжаем ход
			if(!playersWorking.length){
				clearTimeout(game.timer);
				while(game.continue());
			}
		}
	}


	//Выполняет или сохраняет действие, оповещает игроков о результатах действия
	//Возвращает ожидается ли ответ от игроков или нет
	process(player, action){

		const game = this.game;

		let outgoingAction = this.execute(player, action);

		//Если действие легально
		if(outgoingAction){

			//Убираем игрока из списка действующих (он там один)
			game.players.working = [];

			this.complete = outgoingAction;
			// Делаем один шаг в игре, чтобы узнать, нужно ли дать игрокам время на обработку выполненного действия
			game.continue();

			//Сообщаем игрокам о действии
			//Если дальнейших действий пока нет, даем игрокам время на обработку выполненного времени
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
					message: 'INVALID_ACTION',
					action: action,
					time: this.deadline,
					timeSent: Date.now()
				},
				this.valid.slice(),
				[player]
			);
		}		
	}

	// Находит и возвращает локальную копию переданного действия или null
	// ignored может быть 1 или массивом игнорируемых свойств действия
	checkValidity(action, ignored){

		if(ignored && !ignored.indexOf){
			ignored = [ignored];
		}

		outer:	// https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Statements/label
		for(let i = 0; i < this.valid.length; i++){
			let validAction = this.valid[i];
			for(let k in validAction){
				if(!validAction.hasOwnProperty(k))
					continue;
				if((!ignored || !~ignored.indexOf(k)) && validAction[k] != action[k]){
					continue outer;
				}
			}
			return validAction;
		}
		return null;
	}

	//Обрабатывает полученное от игрока действие, возвращает исходящее действие
	execute(player, incomingAction){

		const game = this.game;

		let action = this.checkValidity(incomingAction, 'linkedField');

		//Проверка действия
		if( !action ){
			this.log.warn(
				'Invalid action', player.id,
				incomingAction && incomingAction.type, incomingAction, this.valid
			);
			return null;
		}

		//Выполняем действие
		let reaction = game.reactions[action.type];
		if(!reaction){
			this.log.warn('Unknown action', action.type);
			return null;
		}
		action = reaction.call(game, player, action);
		action.pid = player.id;

		//Обнуляем возможные действия
		this.valid.length = 0;		

		return action;
	}

	//Выполняет первое дейтсие из this.valid
	//Приоритезирует SKIP и TAKE
	executeFirst(){
		const game = this.game;

		let playersWorking = game.players.working;
		let actionIndex = 0;
		for(let ai = 0; ai < this.valid.length; ai++){
			let action = this.valid[ai];
			if(action.type == 'SKIP' || action.type == 'TAKE'){
				actionIndex = ai;
				break;
			}
		}

		//У нас поддерживается только одно действие от одного игрока за раз
		let player = playersWorking[0];	

		//Устанавливаем, что игрок не выбрал действие
		player.afk = true;

		let outgoingAction = this.execute(player, this.valid[actionIndex]);

		//Убираем игрока из списка действующих
		game.players.working = [];

		game.waitForResponse(this.timeouts.actionComplete, game.players);
		//Отправляем оповещение о том, что время хода вышло
		player.handleLateness();
		game.players.completeActionNotify(outgoingAction);
	}

	//Сохраняет полученное действие игрока
	store(player, incomingAction){

		//Проверка действия
		let action = this.checkValidity(incomingAction);

		if( !action ){
			this.log.warn('Invalid action', player.id, incomingAction.type, incomingAction, this.valid);
			return;
		}

		action.pid = player.id;

		this.stored[player.id] = Object.assign({}, action);
	}

	//Считает сохраненные голоса и возвращает результаты
	checkStored(){

		const game = this.game;

		//Считаем голоса
		let numAccepted = 0;

		//TODO: заменить на game.players.length в финальной версии
		let minAcceptedNeeded = Math.ceil(game.players.length / 2); 
		
		let allConnected = true;

		for(let pi = 0; pi < game.players.length; pi++){
			let player = game.players[pi];
			let pid = player.id;
			let action = this.stored[pid];

			if(!player.connected){
				allConnected = false;
				continue;
			}

			if(action && action.type == 'ACCEPT')
				numAccepted++;
		}

		this.log.info(numAccepted, 'out of', game.players.length, 'voted for rematch');
		if(!allConnected)
			this.log.info('Some players disconnected');

		let results = [];
		for(let pid in this.stored){
			if(!this.stored.hasOwnProperty(pid))
				continue;
			results.push(Object.assign({}, this.stored[pid]));
		}

		let note = {
			message: 'VOTE_RESULTS',
			results: results
		};

		if(allConnected && numAccepted >= minAcceptedNeeded){
			note.successful = true;
		}
		else{
			note.successful = false;
		}

		return note;
	}

	completeNotify(){
		const game = this.game;

		if(!this.complete)
			return;

		this.complete.noResponse = true;
		game.players.completeActionNotify(this.complete);
		this.complete = null;
	}

	//Записывает действие над картой в лог
	logAction(card, actionType, from, to){
		const game = this.game;

		let playersById = game.players.byId;
		this.log.debug(
			'%s %s%s %s => %s',
			actionType,
			['♥', '♦', '♣', '♠'][card.suit], ['J', 'Q', 'K', 'A'][card.value - 11] || (card.value == 10 ? card.value : card.value + ' '),
			playersById[from] ? playersById[from].name : from,
			playersById[to] ? playersById[to].name : to
		);
	}

}

module.exports = Actions;