/*
 * Конструктор игры
 * Раздает карты и управляет правилами игры
 *
 * Отправляет информацию игрокам через экземпляры игроков (Player) и группу игроков (GamePlayers)
 * После каждого отправления ожидает ответа от игроков (waitForResponse)
 * После ответа игроков (recieveResponse) или по истечении времени (setResponseTimer)
 * автоматически продолжает игру (continue)
 */

'use strict';

const 
	generateId = requirejs('generateId'),
	Bot = requirejs('Players/Bot'),
	GameCards = requirejs('Game/GameCards'),
	GamePlayers = requirejs('Game/GamePlayers'),
	GameStates = requirejs('Game/GameStates'),
	GameTurnStages = requirejs('Game/GameTurnStages'),
	GameReactions = requirejs('Game/GameReactions'),
	GameDirectives = requirejs('Game/GameDirectives'),
	Log = requirejs('logger');

class Game{
	constructor(players, canTransfer, debugMode){

		//Генерируем айди игры
		var id = generateId();
		this.id = 'game_' + id;

		this.log = Log(module, id, debugMode);

		if(!players || !players.length){
			this.log.error('Can\'t start a game without players');
			return;
		}

		this.states = new GameStates(this);
		this.turnStages = new GameTurnStages(this);
		this.reactions = new GameReactions();
		this.directives = new GameDirectives();

		//Добавляем бота, если игрок один
		if(players.length < 2){
			players.push(new Bot(['addedBot']));
			this.log.warn('Only one player at the start of the game, adding a bot');
		}
		//Сохраняем ссылки на игроков локально
		this.players = new GamePlayers(this, players.slice());

		//Карты
		this.cards = new GameCards(this);

		//Можно ли переводить карты
		this.canTransfer = canTransfer;

		//Номер игры
		this.index = -1;

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
		this.completedAction = null;
		this.actionDeadline = null;
		this.timer = null;


		//Запускаем игру
		this.reset();
		this.start();
	}

	//Запущена ли игра
	//Игра не запущена, когда идет голосование о рестарте
	get isStarted(){
		return this.states.current != 'NOT_STARTED';
	}


	//Методы игры

	//Ресет игры
	reset(){

		//Свойства игры
		this.index++;
		this.states.current = 'NOT_STARTED';
		this.result = {
			winners: [],
			loser: null
		};

		this.simulating = !this.players.getWith('type', 'player').length;

		//Ресет игроков
		this.players.resetGame();

		//Ресет карт
		this.cards.reset(true);

		//Счетчик пропущенных ходов
		this.skipCounter = 0;

		//Возможные действия игроков
		this.validActions = [];
		this.storedActions = [];

		//Свойства хода
		this.turnNumber = 1;
		this.turnStages.next = 'DEFAULT';
	}

	//Подготовка и начало игры
	start(){

		this.log.notice('Game started', this.index);

		this.states.current = 'SHOULD_START';

		//Перемешиваем игроков
		this.players.shuffle();

		//Создаем карты, поля и колоду
		this.cards.make();

		let note = {
			message: 'GAME_STARTED',
			index: this.index	 
		};
		this.players.notify(note);

		//Начинаем игру
		while(this.continue());
	}

	//Заканчивает игру, оповещает игроков и позволяет им голосовать за рематч
	end(){

		this.log.info('Game ended', this.id, '\n\n');
		
		let results = Object.assign({}, this.result);
		results.winners = this.result.winners.slice();

		let note = {
			message: 'GAME_ENDED',
			scores: this.players.scores,
			results: results				 
		};
		let actionAccept = {
			type: 'ACCEPT'
		};
		let actionDecline = {
			type: 'DECLINE'
		};

		this.players.gameStateNotify(this.players, {cards: true}, true, 'REVEAL', true);

		this.reset();
		
		this.validActions.push(actionAccept);
		this.validActions.push(actionDecline);

		this.waitForResponse(this.timeouts.gameEnd, this.players);
		this.players.notify(note, this.validActions.slice());
	}

	//Перезапускает игру 
	rematch(voteResults){
		this.log.info('Rematch');

		//Оповещаем игроков о результате голосования
		
		this.players.notify(voteResults);

		this.validActions = [];
		this.storedActions = [];

		this.start();
	}

	//Возвращает игру в лобби
	backToLobby(voteResults){
		//Оповещаем игроков о результате голосования
		this.players.notify(voteResults);

		this.log.info('No rematch');

		//TODO: оповестить лобби
	}

	//Если остались только боты, убираем игроков из списка ожидания ответа, чтобы ускорить игру
	trySimulating(){
		let humanActivePlayer = this.players.getWithFirst('type', 'player', this.players.active);
		if(!humanActivePlayer){
			this.log.notice('Simulating');
			let humanPlayers = this.players.getWith('type', 'player');
			this.players.notify({message: 'SIMULATING'}, null, humanPlayers);
			this.simulating = true;
		}
	}


	//Методы хода

	//Сбрасываем счетчики и стадию игры
	resetTurn(){

		this.log.info('Turn Ended', (Date.now() - this.turnStartTime)/1000);
		
		this.table.usedFields = 0;
		this.skipCounter = 0;
		this.turnStages.current = null;
		this.turnStages.next = 'DEFAULT';	
		this.playerTook = false;

		this.players.resetTurn();
		this.players.notify({message: 'TURN_ENDED'});
	}

	//Начинает ход
	startTurn(){
		this.players.logTurnStart();

		this.turnStartTime = Date.now();

		//Увеличиваем счетчик ходов, меняем стадию игры на первую атаку и продолжаем ход
		this.turnNumber++;	

		this.players.notify({
			message: 'TURN_STARTED',
			index: this.turnNumber
		});
		this.setNextTurnStage('INITIAL_ATTACK');	
	}


	//Методы выбора статуса игры и стадии хода

	//Устанавливает следующую фазу хода и запоминает текущую
	//INITIAL_ATTACK -> DEFENSE -> REPEATING_ATTACK -> DEFENSE -> REPEATING_ATTACK -> DEFENSE -> ... ->
	//SUPPORT -> DEFENSE -> ATTACK -> DEFENSE -> ... -> FOLLOWUP -> DEFENSE -> END -> END_DEAL -> ENDED
	setNextTurnStage(stage){
		this.turnStages.current = this.turnStages.next;
		this.turnStages.next = stage;
		this.log.debug(stage);
	}

	//Выполняет следующую стадию игры
	//Возвращает нужно ли продолжать игру, или ждать игроков
	continue(){

		/*this.players.notify({
			states.current: this.states.current,
			turnStages.next: this.turnStages.next
		})*/

		let state = this.states[this.states.current];
		if(!state){
			this.log.error('invalid game state', this.states.current);
			return false;
		}
		return state.call(this);
	}

	//Выполняет следующую стадию хода
	//Возвращает нужно ли продолжать игру, или ждать игроков
	doTurn(){

		let turnStage = this.turnStages[this.turnStages.next];
		if(!turnStage){
			this.log.error('Invalid turn stage', this.turnStages.next);
			return false;
		}
		return turnStage.call(this);
	}

	//Позволяет игроку выполнить действие
	//Возвращает нужно ли продолжать игру, или ждать игроков
	let(dirName, player){

		let directive = this.directives[dirName];
		if(!directive){
			this.log.error('Invalid directive', dirName);
			return false;
		}
		return directive.call(this, player);
	}
	

	//Методы передачи и обработки действий, установки таймера действий

	//Ждет ответа от игроков
	waitForResponse(time, players){

		if(this.timer){
			clearTimeout(this.timer);
			this.timer = null;
		}

		if(this.completedAction){
			this.completedAction.noResponse = true;
			this.players.completeActionNotify(this.completedAction);
			this.completedAction = null;
		}

		if(!this.simulating){
			this.trySimulating();
		}

		if(this.simulating){
			players = this.players.getWith('type', 'bot', false, players);
		}

		this.players.working = players;
		if(players.length){
			let duration = time * 1000;

			//Если игрок afk, время действия уменьшается
			if(players.length == 1 && players[0].afk){
				duration = this.timeouts.afk * 1000;
			}

			this.actionDeadline = Date.now() + duration;
			this.timer = setTimeout(this.timeOut.bind(this), duration);
		}
		else{
			this.log.error('Set to wait for response but nobody to wait for');
			return;
		}
	}

	//Выполняется по окончанию таймера ответа игроков 
	//Выполняет случайное действие или продолжает игру
	timeOut(){
		this.timer = null;
		this.players.logTimeout();

		//Если есть действия, выполняем первое попавшееся действие
		if(this.validActions.length && this.states.current == 'STARTED'){
			this.executeFirstAction();
		}
		//Иначе, обнуляем действующих игроков, возможные действия и продолжаем ход
		else{
			this.players.working = [];
			this.validActions = [];
			while(this.continue());
		}	
	}

	//Получает ответ от игрока асинхронно
	recieveResponse(player, action){
		setTimeout(() => {
			this.recieveResponseSync(player, action);
		}, 0);
	}

	//Получает ответ от игрока синхронно
	recieveResponseSync(player, action){

		//Проверяем валидность ответа
		let playersWorking = this.players.working;
		let pi = playersWorking.indexOf(player);

		// Запоздавший или непредвиденный ответ
		if(!~pi){
			if(player.type != 'player' || !this.simulating){
				this.log.warn( player.name, player.id, 'Late or uncalled response');
			}

			//Сообщаем игроку, что действие пришло не вовремя
			if(action){
				this.players.notify(
					{
						message: 'LATE_OR_UNCALLED_ACTION',
						action: action
					},
					null,
					[player]
				);
			}
			return;
		}

		// Ожидается действие, но действие не получено, перепосылаем действия
		if(this.validActions.length && !action){
			this.log.warn(player.name, 'Wating for action but no action recieved');
			if(this.isStarted){
				player.recieveValidActions(this.validActions.slice(), (this.actionDeadline - Date.now())/1000);
			}
			return;
		}

		this.log.silly('Response from', player.id, action ? action : '');

		//Выполняем или сохраняем действие
		let waitingForResponse = false;
		if(action){
			waitingForResponse = this.processAction(player, action);
		}

		//Если мы не оповещали игроков и не ждем от них нового ответа
		if(!waitingForResponse){
			//Убираем игрока из списка действующих
			playersWorking = this.players.working;
			pi = playersWorking.indexOf(player);
			if(~pi){
				playersWorking.splice(pi, 1);	
				this.players.working = playersWorking;
			}

			//Если больше нет действующих игроков, перестаем ждать ответа и продолжаем ход
			if(!playersWorking.length){
				clearTimeout(this.timer);
				while(this.continue());
			}
		}
	}


	//Выполняет или сохраняет действие, оповещает игроков о результатах действия
	//Возвращает ожидается ли ответ от игроков или нет
	processAction(player, action){
		//Игрок выбрал действие, он не afk
		if(player.afk)
			player.afk = false;

		let outgoingAction;

		//Во время игры один игрок действует за раз
		if(this.states.current == 'STARTED'){

			outgoingAction = this.executeAction(player, action);

			//Если действие легально
			if(outgoingAction){

				//Убираем игрока из списка действующих (он там один)
				this.players.working = [];

				this.completedAction = outgoingAction;
				// Делаем один шаг в игре, чтобы узнать, нужно ли дать игрокам время на обработку выполненного действия
				this.continue();

				//Сообщаем игрокам о действии
				//Если дальнейших действий пока нет, даем игрокам время на обработку выполненного времени
				if(this.completedAction == outgoingAction){
					this.completedAction = null;
					this.waitForResponse(this.timeouts.actionComplete, this.players);
					this.players.completeActionNotify(outgoingAction);
				}			

			}
			// иначе сообщаем игроку, что действие нелегально
			else{
				this.players.notify(
					{
						message: 'INVALID_ACTION',
						action: action,
						time: this.actionDeadline,
						timeSent: Date.now()
					},
					this.validActions.slice(),
					[player]
				);
			}
			return true;			
		}
		//Если игра закончена, действовать могут все
		else{
			this.storeAction(player, action);
		}

		return false;
	}

	// Находит и возвращает локальную копию переданного действия или null
	// ignored может быть 1 или массивом игнорируемых свойств действия
	checkActionValidity(action, ignored){

		if(ignored && !ignored.indexOf){
			ignored = [ignored];
		}

		outer:	// https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Statements/label
		for(let i = 0; i < this.validActions.length; i++){
			let validAction = this.validActions[i];
			for(let k in validAction){
				if(!validAction.hasOwnProperty(k))
					continue;
				if((!ignored || !~ignored.indexOf(k)) && validAction[k] != action[k]){
					continue outer;
				}
			}
			return validAction;
		};
		return null;
	}

	//Обрабатывает полученное от игрока действие, возвращает исходящее действие
	executeAction(player, incomingAction){

		let action = this.checkActionValidity(incomingAction, 'linkedField');

		//Проверка действия
		if( !action ){
			this.log.warn(
				'Invalid action', player.id,
				incomingAction && incomingAction.type, incomingAction, this.validActions
			);
			return null;
		}

		//Выполняем действие
		let reaction = this.reactions[action.type];
		if(!reaction){
			this.log.warn('Unknown action', action.type);
			return null;
		}
		action = reaction.call(this, player, action);
		action.pid = player.id;

		//Обнуляем возможные действия
		this.validActions = [];		

		return action;
	}

	//Выполняет первое дейтсие из this.validActions
	//Приоритезирует SKIP и TAKE
	executeFirstAction(){
		let playersWorking = this.players.working;
		let actionIndex = 0;
		for(let ai = 0; ai < this.validActions.length; ai++){
			let action = this.validActions[ai];
			if(action.type == 'SKIP' || action.type == 'TAKE'){
				actionIndex = ai;
				break;
			}
		}

		//У нас поддерживается только одно действие от одного игрока за раз
		let player = playersWorking[0];	

		//Устанавливаем, что игрок не выбрал действие
		player.afk = true;

		let outgoingAction = this.executeAction(player, this.validActions[actionIndex]);

		//Убираем игрока из списка действующих
		this.players.working = [];

		this.waitForResponse(this.timeouts.actionComplete, this.players);
		//Отправляем оповещение о том, что время хода вышло
		player.handleLateness();
		this.players.completeActionNotify(outgoingAction);
	}

	//Сохраняет полученное действие игрока
	storeAction(player, incomingAction){

		//Проверка действия
		let action = this.checkActionValidity(incomingAction);

		if( !action ){
			this.log.warn('Invalid action', player.id, incomingAction.type, incomingAction, this.validActions);
			return;
		}

		action.pid = player.id;

		this.storedActions[player.id] = Object.assign({}, action);
	}

	//Считает сохраненные голоса и возвращает результаты
	checkStoredActions(){

		//Считаем голоса
		let numAccepted = 0;

		//TODO: заменить на this.players.length в финальной версии
		let minAcceptedNeeded = Math.ceil(this.players.length / 2); 
		
		let allConnected = true;

		for(let pi = 0; pi < this.players.length; pi++){
			let player = this.players[pi];
			let pid = player.id;
			let action = this.storedActions[pid];

			if(!player.connected){
				allConnected = false;
				continue;
			}

			if(action && action.type == 'ACCEPT')
				numAccepted++;
		}

		this.log.info(numAccepted, 'out of', this.players.length, 'voted for rematch');
		if(!allConnected)
			this.log.info('Some players disconnected');

		let results = [];
		for(let pid in this.storedActions){
			if(!this.storedActions.hasOwnProperty(pid))
				continue;
			results.push(Object.assign({}, this.storedActions[pid]));
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

	//Записывает действие над картой в лог
	logAction(card, actionType, from, to){
		let playersById = this.players.byId;
		this.log.debug(
			'%s %s%s %s => %s',
			actionType,
			['♥', '♦', '♣', '♠'][card.suit], ['J', 'Q', 'K', 'A'][card.value - 11] || (card.value == 10 ? card.value : card.value + ' '),
			playersById[from] ? playersById[from].name : from,
			playersById[to] ? playersById[to].name : to
		);
	}
}

module.exports = Game;