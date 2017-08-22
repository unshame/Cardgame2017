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
	generateId = reqfromroot('generateId'),
	Log = reqfromroot('logger');

class Game{
	constructor(queue, players, Classes, config){

		// Генерируем айди игры
		let id = generateId();
		this.id = 'game_' + id;

		this.log = Log(module, id, config.debug);

		this.queue = queue;

		this.BotClass = Classes.bot;

		// Добавляем бота, если игрок один
		while(players.length < config.minPlayers){
			players.push(new this.BotClass(['addedBot']));
			this.log.warn('Only %s players at the start of the game, adding a bot', players.length);
		}

		this.states = new Classes.states(this);
		this.turnStages = new Classes.turnStages(this);
		this.actions = new Classes.actions(this);
		this.reactions = new Classes.reactions();
		this.directives = new Classes.directives();

		// Сохраняем ссылки на игроков локально
		this.players = new Classes.players(this, players.slice());

		// Карты
		this.cards = new Classes.cards(this);

		// Добавляем указатели на поля карт
		this.deck = this.cards.deck;
		this.discardPile = this.cards.discardPile;
		this.table = this.cards.table;
		this.hands = this.cards.hands;

		// Номер игры
		this.index = -1;
		this.turnNumber = 0;

		this.timer = null;

		this.turnStartTime = null;

		this.result = null;

		this.simulating = false;

		this.fakeDescisionTimer = this.defaultFakeDescisionTimer = 500;

		this.isTest = config.test;
	}

	// Запущена ли игра
	// Игра не запущена, когда идет голосование о рестарте
	// Это не тоже самое, что game.states.current == 'STARTED'
	get isRunning(){
		return this.states.current != 'NOT_STARTED';
	}


	// Методы игры
	
	// Запуск первой игры
	init(){
		this.reset();
		this.start();
	}	

	// Ресет игры
	reset(){

		// Свойства игры
		this.index++;
		this.states.current = 'NOT_STARTED';
		this.result = this.getDefaultResults();

		this.resetSimulating();

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
			type: 'GAME_STARTED',
			index: this.index	 
		};
		this.players.notify(note);

		// Начинаем игру
		// jshint curly:false
		while(this.continue());
	}

	// Заканчивает игру, оповещает игроков и позволяет им голосовать за рематч
	end(){

		this.log.info('Game ended', this.id, '\n\n');

		if(!this.isTest && !this.players.getWithOwn('type', 'player').length){
			this.log.notice('Abandoning game, no human players left');
			return;
		}		

		this.players.gameStateNotify(this.players, {cards: true}, true, 'REVEAL', true);

		let action = this.getResults();

		this.reset();
		
		this.actions.valid = action.actions.slice();

		this.waitForResponse(this.actions.timeouts.gameEnd, this.players);
		this.players.notify(action);
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


	// РЕЗУЛЬТАТЫ
	getResults(){
		let results = {};
		for(let key in this.result){
			if(!this.result.hasOwnProperty(key)){
				continue;
			}
			let val = this.result[key];
			if(val.slice){
				results[key] = this.result[key].slice();
			}
			else if(typeof val == 'object'){
				results[key] = Object.assign({}, val);
			}
			else{
				results[key] = this.result[key];
			}
		}

		let action = {
			type: 'GAME_ENDED',
			scores: this.players.scores,
			results: results,
			actions: [{type: 'ACCEPT'}, {type: 'DECLINE'}] 
		};
		return action;
	}

	getDefaultResults(){
		return {
			winners: null,
			loser: null
		};
	}


	// СИМУЛЯЦИЯ (когда в игре остались только боты)

	// Если остались только боты, убираем игроков из списка ожидания ответа, чтобы ускорить игру
	trySimulating(){
		let humanActivePlayers = this.players.getWithOwn('type', 'player', this.players.active);
		if(!humanActivePlayers.length){
			this.log.notice('Simulating');
			let humanPlayers = this.players.getWithOwn('type', 'player');
			this.players.notify({type: 'SIMULATING'}, humanPlayers);
			this.simulating = true;
			this.fakeDescisionTimer = 0;
		}
	}

	// Убирает статус симуляции, оповещает игроков
	resetSimulating(){
		if(this.simulating && !this.isTest){
			let humanPlayers = this.players.getWithOwn('type', 'player');
			this.players.notify({type: 'STOP_SIMULATING'}, humanPlayers);
		}

		this.simulating = this.isTest;
		if(this.simulating){
			this.fakeDescisionTimer = 0;
		}
		else{
			this.fakeDescisionTimer = this.defaultFakeDescisionTimer;
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
		this.players.notify({type: 'TURN_ENDED'});
	}

	// Начинает ход
	startTurn(){

		this.players.logTurnStart();

		this.turnStartTime = Date.now();

		// Увеличиваем счетчик ходов, меняем стадию игры на первую атаку и продолжаем ход
		this.turnNumber++;	

		this.players.notify({
			type: 'TURN_STARTED',
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
			// jshint curly:false
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

	hoverOverCard(player, cid){
		if(this.players.includes(player) && player.statuses.working && this.actions.valid.length && this.cards.byId[cid].field == player.id){
			if(player.statuses.hover){
				this.hoverOutCard(player, cid);
			}
			player.statuses.hover = cid;
			let players = [];
			this.players.forEach((p) => {
				if(p != player){
					players.push(p);
				}
			});
			this.players.notify({type: 'HOVER_OVER_CARD', cid: cid, noResponse: true, channel: 'extra'}, players);
		}
	}

	hoverOutCard(player, cid){
		if(this.players.includes(player) && player.statuses.hover){
			
			let players = [];
			this.players.forEach((p) => {
				if(p != player){
					players.push(p);
				}
			});
			this.players.notify({type: 'HOVER_OUT_CARD', cid: player.statuses.hover, noResponse: true, channel: 'extra'}, players);
			player.statuses.hover = null;
		}
	}
}

module.exports = Game;