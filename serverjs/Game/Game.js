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
	DurakPlayers = requirejs('Game/Durak/DurakPlayers'),
	GameActions = requirejs('Game/GameActions'),
	GameStates = requirejs('Game/GameStates'),
	GameTurnStages = requirejs('Game/GameTurnStages'),
	GameReactions = requirejs('Game/GameReactions'),
	GameDirectives = requirejs('Game/GameDirectives'),
	Log = requirejs('logger');

class Game{
	constructor(queue, players, canTransfer, debugMode, isTest){

		// Генерируем айди игры
		let id = generateId();
		this.id = 'game_' + id;

		this.log = Log(module, id, debugMode);

		this.queue = queue;

		// Добавляем бота, если игрок один
		while(players.length < 2){
			players.push(new Bot(['addedBot']));
			this.log.warn('Only %s players at the start of the game, adding a bot', players.length);
		}

		this.states = new GameStates(this);
		this.turnStages = new GameTurnStages(this);
		this.actions = new GameActions(this);
		this.reactions = new GameReactions();
		this.directives = new GameDirectives();

		// Сохраняем ссылки на игроков локально
		this.players = new DurakPlayers(this, players.slice());

		// Карты
		this.cards = new GameCards(this);

		// Можно ли переводить карты
		this.canTransfer = canTransfer;

		// Номер игры
		this.index = -1;
		this.turnNumber = 0;

		this.timer = null;

		this.turnStartTime = null;

		this.result = null;

		this.simulating = false;

		this.fakeDescisionTimer = this.defaultFakeDescisionTimer = 500;

		this.isTest = isTest;

		// Запускаем игру
		this.reset();
		this.start();
	}

	// Запущена ли игра
	// Игра не запущена, когда идет голосование о рестарте
	// Это не тоже самое, что game.states.current == 'STARTED'
	get isRunning(){
		return this.states.current != 'NOT_STARTED';
	}


	// Методы игры

	// Ресет игры
	reset(){

		// Свойства игры
		this.index++;
		this.states.current = 'NOT_STARTED';
		this.result = {
			winners: [],
			loser: null
		};

		this.simulating = this.isTest;
		if(this.simulating){
			this.fakeDescisionTimer = 0;
		}
		else{
			this.fakeDescisionTimer = this.defaultFakeDescisionTimer;
		}

		this.players.resetGame();
		this.cards.reset(true);
		this.actions.reset();
		this.skipCounter = 0;

		// Свойства хода
		this.turnNumber = 1;
		this.turnStages.next = 'DEFAULT';
	}

	// Подготовка и начало игры
	start(){
		this.log.notice('Game started', this.index);

		this.states.current = 'SHOULD_START';

		// Перемешиваем игроков
		this.players.shuffle();

		// Создаем карты, поля и колоду
		this.cards.make();

		let note = {
			message: 'GAME_STARTED',
			index: this.index	 
		};
		this.players.notify(note);

		// Начинаем игру
		while(this.continue());
	}

	// Заканчивает игру, оповещает игроков и позволяет им голосовать за рематч
	end(){

		this.log.info('Game ended', this.id, '\n\n');

		if(!this.isTest && !this.players.getWithOwn('type', 'player').length){
			this.log.notice('Abandoning game, no human players left');
			return;
		}
		
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
		
		this.actions.valid.push(actionAccept);
		this.actions.valid.push(actionDecline);

		this.waitForResponse(this.actions.timeouts.gameEnd, this.players);
		this.players.notify(note, this.actions.valid.slice());
	}

	// Перезапускает игру 
	rematch(voteResults){
		this.log.info('Rematch');

		// Оповещаем игроков о результате голосования
		
		this.players.notify(voteResults);

		this.actions.reset();

		this.start();
	}

	// Возвращает игру в лобби
	backToLobby(voteResults){
		// Оповещаем игроков о результате голосования
		this.players.notify(voteResults);

		this.players.forEach(p => p.game = null);

		this.log.info('No rematch');
		this.queue.endGame(voteResults.results);
	}

	// Если остались только боты, убираем игроков из списка ожидания ответа, чтобы ускорить игру
	trySimulating(){
		let humanActivePlayers = this.players.getWithOwn('type', 'player', this.players.active);
		if(!humanActivePlayers.length){
			this.log.notice('Simulating');
			let humanPlayers = this.players.getWithOwn('type', 'player');
			this.players.notify({message: 'SIMULATING'}, null, humanPlayers);
			this.simulating = true;
			this.fakeDescisionTimer = 0;
		}
	}


	// Методы хода

	// Сбрасываем счетчики и стадию игры
	resetTurn(){

		this.log.info('Turn Ended', (Date.now() - this.turnStartTime)/1000);
		
		this.table.usedFields = 0;
		this.skipCounter = 0;
		this.turnStages.reset();

		this.actions.reset();

		this.players.resetTurn();
		this.players.notify({message: 'TURN_ENDED'});
	}

	// Начинает ход
	startTurn(){

		this.players.logTurnStart();

		this.turnStartTime = Date.now();

		// Увеличиваем счетчик ходов, меняем стадию игры на первую атаку и продолжаем ход
		this.turnNumber++;	

		this.players.notify({
			message: 'TURN_STARTED',
			index: this.turnNumber
		});
		this.turnStages.setNext('INITIAL_ATTACK');	
	}


	// Методы выбора статуса игры и стадии хода

	// Выполняет следующую стадию игры
	// Возвращает нужно ли продолжать игру, или ждать игроков
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
		return state.call(this.states);
	}

	// Выполняет следующую стадию хода
	// Возвращает нужно ли продолжать игру, или ждать игроков
	doTurn(){

		let turnStage = this.turnStages[this.turnStages.next];
		if(!turnStage){
			this.log.error('Invalid turn stage', this.turnStages.next);
			return false;
		}
		return turnStage.call(this.turnStages);
	}

	// Позволяет игроку выполнить действие
	// Возвращает нужно ли продолжать игру, или ждать игроков
	let(dirName, ...players){

		let directive = this.directives[dirName];
		if(!directive){
			this.log.error('Invalid directive', dirName);
			return false;
		}
		return directive.call(this, ...players);
	}
	

	// Методы установки таймера действий

	// Ждет ответа от игроков
	waitForResponse(time, players){

		if(this.timer){
			clearTimeout(this.timer);
			this.timer = null;
		}

		this.actions.completeNotify();

		if(!this.simulating){
			this.trySimulating();
		}

		if(this.simulating){
			players = this.players.getWithOwn('type', 'bot', players);
		}

		this.players.working = players;
		if(players.length){
			let duration = time * 1000;

			// Если игрок afk, время действия уменьшается
			if(players.length == 1 && players[0].afk){
				duration = this.actions.timeouts.afk * 1000;
			}

			this.actions.deadline = Date.now() + duration;
			this.timer = setTimeout(this.timeOut.bind(this), duration);
		}
		else{
			this.log.error('Set to wait for response but nobody to wait for');
			return;
		}
	}

	// Выполняется по окончанию таймера ответа игроков 
	// Выполняет случайное действие или продолжает игру
	timeOut(){
		this.timer = null;
		this.players.logTimeout();

		// Если есть действия, выполняем первое попавшееся действие
		if(this.actions.valid.length && this.states.current == 'STARTED'){
			this.actions.executeFirst();
		}
		// Иначе, обнуляем действующих игроков, возможные действия и продолжаем ход
		else{
			this.players.working = [];
			this.actions.valid.length = 0;
			while(this.continue());
		}	
	}


	// Методы обработки действий

	// Получает ответ от игрока асинхронно
	recieveResponse(player, action){
		setTimeout(() => {
			this.actions.recieve(player, action);
		}, 0);
	}

	// Получает ответ от игрока синхронно
	recieveResponseSync(player, action){
		this.actions.recieve(player, action);
	}
}

module.exports = Game;