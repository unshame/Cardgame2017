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
	utils = require('../utils'),
	Bot = require('../Players/Bot'),
	GameCards = require('./GameCards'),
	GamePlayers = require('./GamePlayers'),
	GameStates = require('./GameStates'),
	GameTurnStages = require('./GameTurnStages'),
	GameReactions = require('./GameReactions'),
	GameDirectives = require('./GameDirectives');

class Game{
	constructor(players, canTransfer, debugOn){
		if(!players || !players.length){
			utils.log('ERROR: Can\'t start a game without players');
		}

		utils.stats.isInDebugMode = debugOn || false;

		//Генерируем айди игры
		this.id = 'game_' + utils.generateId();

		this.states = new GameStates(this);
		this.turnStages = new GameTurnStages(this);
		this.reactions = new GameReactions();
		this.directives = new GameDirectives();

		//Сохраняем ссылки на игроков локально
		if(players.length < 2){
			players.push(new Bot(['addedBot']));
			utils.log('WARNING: Only one player at the start of the game, adding a bot');
		}
		this.players = new GamePlayers(this, players.slice());

		//Сообщаем игрокам о соперниках
		this.players.opponentsNotify();

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
			deal: 5,
			discard: 5,
			take: 5,
			actionComplete: 3,
			actionAttack: 20,
			actionDefend: 20,
			afk: 5
		};
		this.actionDeadline = null;
		this.timer = null;

		//Запускаем игру
		this.reset();
		this.start();
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
		this.cards.reset();

		//Счетчик пропущенных ходов
		this.skipCounter = 0;

		//Возможные действия игроков
		this.validActions = [];
		this.storedActions = [];

		//Свойства хода
		this.turnNumber = 1;
		this.turnStages.next = 'DEFAULT';
	}

	//Подготовка к игре
	start(){

		utils.log('Game started', this.id, this.index);

		this.states.current = 'SHOULD_START';

		//Перемешиваем игроков
		this.players.shuffle();

		//Создаем карты, поля и колоду
		this.cards.make();

		//Начинаем игру
		this.continue();
	}

	//Заканчивает игру, оповещает игроков и позволяет им голосовать за рематч
	end(){

		utils.log('Game ended', this.id, '\n\n');
		utils.stats.line += 2;
		
		let note = {
			message: 'GAME_ENDED',
			scores: this.players.scores,
			results: utils.copyObject(this.result)				 
		};
		let actionAccept = {
			type: 'ACCEPT'
		};
		let actionDecline = {
			type: 'DECLINE'
		};

		this.reset();
		
		this.validActions.push(actionAccept);
		this.validActions.push(actionDecline);

		this.waitForResponse(this.timeouts.gameEnd, this.players);
		this.players.notify(note, this.validActions.slice());
	}

	//Перезапускает игру 
	rematch(voteResults){
		utils.log('Rematch');

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

		utils.log('No rematch');

		//TODO: оповестить лобби
	}


	//Методы хода

	//Сбрасываем счетчики и стадию игры
	resetTurn(){

		utils.log('Turn Ended', (Date.now() - this.turnStartTime)/1000);
		
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
		utils.log(
			'\nTurn',
			this.turnNumber,
			this.players.attacker.name,
			this.players.defender.name,
			this.players.ally ? this.players.ally.name : null,
			'\nCards in deck:', this.deck.length
		);
		utils.stats.line += 2;

		for(let pi = 0; pi < this.players.length; pi++){
			let p = this.players[pi];
			let pid = p.id;
			utils.log(p.name, this.hands[pid].length);
		}

		this.turnStartTime = Date.now();

		//Увеличиваем счетчик ходов, меняем стадию игры на первую атаку и продолжаем ход
		this.turnNumber++;	

		this.setNextTurnStage('INITIAL_ATTACK');	
		this.continue();
	}


	//Методы выбора статуса игры и стадии хода

	//Устанавливает следующую фазу хода и запоминает текущую
	//INITIAL_ATTACK -> DEFENSE -> REPEATING_ATTACK -> DEFENSE -> REPEATING_ATTACK -> DEFENSE -> ... ->
	//SUPPORT -> DEFENSE -> ATTACK -> DEFENSE -> ... -> FOLLOWUP -> DEFENSE -> END -> END_DEAL -> ENDED
	setNextTurnStage(stage){
		this.turnStages.current = this.turnStages.next;
		this.turnStages.next = stage;
	}

	//Выбирает следующую стадию игры
	continue(){

		/*this.players.notify({
			states.current: this.states.current,
			turnStages.next: this.turnStages.next
		})*/

		let state = this.states[this.states.current];
		if(!state){
			utils.log('ERROR: invalid game state', this.states.current);
			return;
		}
		state.call(this);
	}

	//Выбирает следующую стадию хода
	doTurn(){

		let turnStage = this.turnStages[this.turnStages.next];
		if(!turnStage){
			utils.log('ERROR: Invalid turn stage', this.turnStages.next);
			return;
		}
		turnStage.call(this);
	}

	//Позволяет игроку выполнить действие
	let(dirName, player){

		let directive = this.directives[dirName];
		if(!directive){
			utils.log('ERROR: Invalid directive', dirName);
			return;
		}
		directive.call(this, player);
	}
	

	//Методы передачи и обработки действий, установки таймера действий

	//Ждет ответа от игроков
	waitForResponse(time, players){

		if(this.timer){
			clearTimeout(this.timer);
			this.timer = null;
		}

		//Если остались только боты, убираем игроков из списка ожидания ответа, чтобы ускорить игру
		if(!this.simulating){
			let humanActivePlayer = this.players.getWithFirst('type', 'player', this.players.active);
			if(!humanActivePlayer){
				let humanPlayers = this.players.getWith('type', 'player');
				this.players.notify({message: 'SIMULATING'}, null, humanPlayers);
				this.simulating = true;
			}
		}
		if(this.simulating)
			players = this.players.getWith('type', 'bot', false, players);

		this.players.working = players;
		if(players.length){
			let duration = time * 1000;
			if(players.length == 1 && players[0].afk)
				duration = this.timeouts.afk * 1000;
			this.actionDeadline = Date.now() + duration;
			this.timer = setTimeout(this.timeOut.bind(this), duration);
		}
		else{
			utils.log('ERROR: Set to wait for response but nobody to wait for');
			return;
		}
	}

	//Выполняется по окончанию таймера ответа игроков 
	timeOut(){
		let playersWorking = this.players.working;
		let names = '';
		for(let pi = 0; pi < playersWorking.length; pi++){
			let name = playersWorking[pi].name;
			names += name + ' ';
		}
		utils.log('Players timed out: ', names);

		//Если есть действия, выполняем первое попавшееся действие
		if(this.validActions.length && this.states.current == 'STARTED'){
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

			player.afk = true;

			let outgoingAction = this.processAction(player, this.validActions[actionIndex]);

			//Убираем игрока из списка действующих
			this.players.working = [];

			this.waitForResponse(this.timeouts.actionComplete, this.players);
			//Отправляем оповещение о том, что время хода вышло
			player.handleLateness();
			this.players.completeActionNotify(outgoingAction);
		}

		//Иначе, обнуляем действующих игроков, возможные действия и продолжаем ход
		else{
			this.players.working = [];
			this.validActions = [];
			this.continue();
		}	
	}

	//Получает ответ от игрока
	recieveResponse(player, action){

		//Проверяем валидность ответа
		let playersWorking = this.players.working;
		let pi = playersWorking.indexOf(player);
		if(!~pi){
			utils.log('ERROR:', player.name, 'Late or uncalled response');
			return;
		}
		if(this.validActions.length && !action){
			utils.log('WARNING: Wating for action but no action recieved');
			player.recieveValidActions(this.validActions.slice(), (this.actionDeadline - Date.now())/1000);
			return;
		}

		//utils.log('Response from', player.id, action ? action : '');

		//Выполняем или сохраняем действие
		if(action){

			if(player.afk)
				player.afk = false;
			
			let outgoingAction;

			//Во время игры один игрок действует за раз
			if(this.states.current == 'STARTED'){

				outgoingAction = this.processAction(player, action);

				//Если действие легально
				if(outgoingAction){

					//Убираем игрока из списка действующих (он там один)
					this.players.working = [];
					
					//Сообщаем игрокам о действии
					this.waitForResponse(this.timeouts.actionComplete, this.players);
					this.players.completeActionNotify(outgoingAction);
					
				}

				//Сообщаем игроку, что действие нелегально
				else{
					this.players.notify(
						{
							message: 'INVALID_ACTION',
							action: action
						},
						null,
						[player]
					);
				}
				return;			
			}

			//Если игра закончена, действовать могут все
			else
				this.storeAction(player, action);
		}

		//Убираем игрока из списка действующих
		playersWorking.splice(pi, 1);	
		this.players.working = playersWorking;

		//Если больше нет действующих игроков, перестаем ждать ответа и продолжаем ход
		if(!playersWorking.length){
			clearTimeout(this.timer);

/*			//Останавливаем игру, если игрок отключился
			if(this.players.getWithFirst('connected',false)){
				return;
			}*/

			this.continue();
		}
	}

	//Обрабатывает полученное от игрока действие, возвращает исходящее действие
	processAction(player, incomingAction){

		let action;
		for(let ai = 0; ai < this.validActions.length; ai++){
			let validAction = this.validActions[ai];
			if(
				incomingAction.type == validAction.type &&
				(!validAction.cid || incomingAction.cid == validAction.cid) &&
				(!validAction.field || incomingAction.field == validAction.field)
			){
				action = validAction;
				break;
			}
		}
		let ai = this.validActions.indexOf(action);

		//Проверка действия
		if( !~ai ){
			utils.log(
				'ERROR: Invalid action',
				player.id,
				incomingAction && incomingAction.type,
				incomingAction,
				this.validActions
			);
			return null;
		}

		//Выполняем действие
		let reaction = this.reactions[action.type];
		if(!reaction){
			utils.log('ERROR: Unknown action', action.type);
			return;
		}
		action = reaction.call(this, player, action);
		action.pid = player.id;

		//Обнуляем возможные действия
		this.validActions = [];		

		return action;
	}

	//Сохраняет полученное действие игрока
	storeAction(player, action){

		let ai = this.validActions.indexOf(action);

		//Проверка действия
		if( !~ai ){
			utils.log('ERROR: Invalid action', player.id, action.type, action);
			return;
		}

		this.storedActions[player.id] = utils.copyObject(action);
	}

	//Считает сохраненные голоса и возвращает результаты
	checkStoredActions(){

		//Считаем голоса
		let numAccepted = 0;

		//TODO: заменить на this.players.length в финальной версии
		let minAcceptedNeeded = Math.ceil(this.players.length / 2); 
		
		for(let pi = 0; pi < this.players.length; pi++){

			let pid = this.players[pi].id;
			let action = this.storedActions[pid];

			if(action && action.type == 'ACCEPT')
				numAccepted++;
		}

		utils.log(numAccepted, 'out of', this.players.length, 'voted for rematch');

		let note = {
			message: 'VOTE_RESULTS',
			results: utils.copyObject(this.storedActions)
		};

		if(numAccepted >= minAcceptedNeeded)
			note.successful = true;
		else
			note.successful = false;

		return note;
	}

	isStarted(){
		return this.states.current != 'NOT_STARTED';
	}

	//Записывает действие над картой в лог
	logAction(card, actionType, from, to){
		let playersById = this.players.byId;
		utils.log(
			card.suit, card.value, ':', 
			actionType,
			playersById[from] ? playersById[from].name : from,
			'=>',
			playersById[to] ? playersById[to].name : to
		);
	}
}

module.exports = Game;