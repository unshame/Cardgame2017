'use strict';

const 
	generateId = reqfromroot('generateId'),
	Log = reqfromroot('logger');

class Game{
	/**
	* Базовый класс игры.  
	* Предоставляет игровой цикл.
	* Предоставляет методы для ожидания и получения действий от игроков.
	* Создает игровые компоненты и управляет ими.
	* @param {Queue}         queue   очередь, к которой принадлежит игра
	* @param {Player[]}      players массив игроков.
	* @param {object<class>} Classes классы, из которых создаются игровые компоненты
	* @param {object}        config  настройки игры
	*/
	constructor(queue, players, Classes, config){

		// Генерируем айди игры
		let id = generateId();

		/**
		* id игры
		* @type {String}
		*/
		this.id = 'game_' + id;

		/**
		* Логгер игры.
		* @type {winston.Logger}
		*/
		this.log = Log(module, id, config.debug);

		/**
		* Очередь, создавшая игру.
		* @type {Queue}
		*/
		this.queue = queue;

		/**
		* Класс ботов для добавления, если не хватает игроков,
		* и для замены вышедших игроков.
		* @type {Player}
		*/
		this.BotClass = Classes.bot;

		// Добавляем бота, если игрок один
		while(players.length < config.minPlayers){
			players.push(new this.BotClass(['addedBot']));
			this.log.warn('Only %s players at the start of the game, adding a bot', players.length);
		}

		/**
		* Игровые состояния.
		* @type {GameStates}
		*/
		this.states = new Classes.states(this);

		/**
		* Стадии ходов игры.
		* @type {GameTurnStages}
		*/
		this.turnStages = new Classes.turnStages(this);

		/**
		* Обработчик ответа от игроков.
		* @type {GameActions}
		*/
		this.actions = new Classes.actions(this, players);

		/**
		* Методы, выполняемые в ответ на действия от игроков.
		* @type {GameReactions}
		*/
		this.reactions = new Classes.reactions();

		/**
		* Методы, позволяющие игрокам выполнять действия.
		* @type {GameDirectives}
		*/
		this.directives = new Classes.directives();

		/**
		* Менеджер игроков и ботов, учавствующих в игре.
		* @type {GamePlayers}
		*/
		this.players = new Classes.players(this, players.slice());

		/**
		* Менеджер игровых карт.
		* @type {GameCards}
		*/
		this.cards = new Classes.cards(this);

		// Добавляем указатели на поля карт
		/**
		* Колода карт из {@link Game#cards}.
		* @type {array}
		*/
		this.deck = this.cards.deck;
		/**
		* Стопка сброса из {@link Game#cards}.
		* @type {array}
		*/
		this.discardPile = this.cards.discardPile;
		/**
		* Стол из {@link Game#cards}.
		* @type {array}
		*/
		this.table = this.cards.table;
		/**
		* Руки игроков из {@link Game#cards}.
		* @type {array}
		*/
		this.hands = this.cards.hands;

		/**
		* Индекс игры.
		* @type {Number}
		*/
		this.index = -1;
		/**
		* Индекс хода.
		* @type {Number}
		*/
		this.turnNumber = 0;

		/**
		* Таймер ожидания ответа от игроков.
		* @type {Timer}
		*/
		this.timer = null;

		/**
		* Время начала текущего хода.
		* @type {number}
		*/
		this.turnStartTime = null;

		/**
		* Результаты игры.
		* @type {object}
		*/
		this.result = null;

		/**
		* Находится ли игра в ускоренном режиме.
		* @type {Boolean}
		*/
		this.simulating = false;

		/**
		* Время ответа ботов.
		* Уменьшается, если стоит флаг `simulating`.
		* @type {number}
		*/
		this.fakeDescisionTimer = 500;
		this.defaultFakeDescisionTimer = this.fakeDescisionTimer;

		/**
		* Является ли игра тестом.
		* @type {Boolean}
		*/
		this.isTest = config.test;

		/**
		* Активна ли игра.
		* Неактивные игры удаляются из менеджера игры, но ссылки на них могут оставаться у ботов.
		* @type {Boolean}
		*/
		this.active = false;
	}

	/**
	* Запущена ли игра.
	* Игра не запущена, когда идет голосование о рестарте.
	* Это не тоже самое, что game.states.current == 'STARTED'
	* @return {Boolean}
	*/
	get isRunning(){
		return this.states.current != 'NOT_STARTED';
	}


	// Методы игры
	
	/** Инициализация и запуск первой игры. */
	init(){
		this.active = true;
		this.reset();
		this.start();
	}	

	/** Ресет игры */
	reset(){

		// Свойства игры
		this.index++;
		this.states.current = 'NOT_STARTED';
		this.result = this.getDefaultResults();

		this.resetSimulating();

		this.players.reset();
		this.players.resetGame();
		this.cards.reset();
		this.actions.reset();
		this.skipCounter = 0;

		// Свойства хода
		this.turnNumber = 1;
		this.turnStages.next = 'DEFAULT';
	}

	/** Подготовка и начало игры */
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

	/** Заканчивает игру, оповещает игроков и позволяет им голосовать за рематч */
	end(){

		this.log.info('Game ended', this.id, '\n\n');	

		this.players.gameStateNotify(this.players, {cards: true}, true, 'REVEAL', true);

		let action = this.getResults();

		this.reset();
		
		this.actions.setValid(action.actions);

		this.waitForResponse(this.actions.timeouts.gameEnd, this.players);
		this.players.notify(action);
	}

	/**
	* Преждевременное завершение игры.
	* Не производит правильное отключение игроков, используется только, если все игроки боты.
	*/
	shutdown(){
		if(this.players.humans.length){
			this.log.error(new Error(`Can't shutdown game with human players in it`));
			return;
		}
		this.active = false;
		this.log.notice('Shutting down');
		clearTimeout(this.timer);
		this.players.reset(true);
	}

	/**
	* Перезапускает игру. Оповещает игроков о результатах голосования.
	* @param  {object} voteResults результаты голосования за рематч.
	*/
	rematch(voteResults){
		this.log.info('Rematch');

		// Оповещаем игроков о результате голосования
		
		this.players.notify(voteResults);

		this.actions.reset();

		this.start();
	}

	/**
	* Возвращает игру в лобби. Оповещает игроков о результатах голосования.
	* @param  {object} voteResults результаты голосования за рематч.
	*/
	backToQueue(voteResults){
		this.active = false;

		// Оповещаем игроков о результате голосования
		if(voteResults){
			this.players.notify(voteResults);
		}

		this.players.reset(true);

		this.log.info('No rematch');
		this.queue.endGame(voteResults ? voteResults.results : null);
	}


	// РЕЗУЛЬТАТЫ
	/**
	* Возвращает результаты игры для передачи игрокам.
	* @return {object}
	*/
	getResults(){
		let results = {};
		for(let key in this.result){
			if(!this.result.hasOwnProperty(key)){
				continue;
			}
			let val = this.result[key];
			if(val && val.slice){
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

	/**
	* Возвращает объект, в который будут записываться результаты игры.
	* @return {objec}
	*/
	getDefaultResults(){
		return {
			winners: null,
			loser: null
		};
	}


	// СИМУЛЯЦИЯ (когда в игре остались только боты)

	/** Если остались только боты, убираем игроков из списка ожидания ответа, чтобы ускорить игру. */
	trySimulating(){
		let humanActivePlayers = this.players.getWithOwn('type', 'player', this.players.active);
		if(!humanActivePlayers.length){
			this.log.notice('Simulating');
			this.players.notify({type: 'SIMULATING'}, this.players.humans);
			this.simulating = true;
			this.fakeDescisionTimer = 0;
		}
	}

	/** Убирает статус симуляции, оповещает игроков. */
	resetSimulating(){
		if(this.simulating && !this.isTest){
			this.players.notify({type: 'STOP_SIMULATING'}, this.players.humans);
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

	/** Сбрасываем счетчики и стадию игры */
	resetTurn(){

		this.log.info('Turn Ended', (Date.now() - this.turnStartTime)/1000);
		
		this.table.usedFields = 0;
		this.skipCounter = 0;
		this.turnStages.reset();

		this.actions.reset();

		this.players.resetTurn();
		this.players.notify({type: 'TURN_ENDED'});
	}

	/** Начинает ход */
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

	/**
	* Выполняет следующую стадию игры.
	* @return {boolean} Возвращает нужно ли продолжать игру, или ждать игроков.
	*/
	continue(){

		/*this.players.notify({
			states.current: this.states.current,
			turnStages.next: this.turnStages.next
		})*/

		if(!this.active){
			this.log.error(new Error('Game inactive'));
			return;
		}

		let state = this.states[this.states.current];
		if(!state){
			this.log.error(new Error(`invalid game state ${this.states.current}`));
			return false;
		}
		return state.call(this.states);
	}

	/**
	* Выполняет следующую стадию хода
	* @return {boolean} Возвращает нужно ли продолжать игру, или ждать игроков.
	*/
	doTurn(){

		let turnStage = this.turnStages[this.turnStages.next];
		if(!turnStage){
			this.log.error(new Error(`Invalid turn stage ${this.turnStages.next}`));
			return false;
		}
		return turnStage.call(this.turnStages);
	}

	/**
	* Позволяет игроку выполнить действие
	* @param {string}    dirName название выполняемого действия
	* @param {...Player} players игроки, которым разрешено действовать
	*
	* @return {boolean} Возвращает нужно ли продолжать игру, или ждать игроков.
	*/
	let(dirName, ...players){

		let directive = this.directives[dirName];
		if(!directive){
			this.log.error(new Error(`Invalid directive ${dirName}`));
			return false;
		}
		return directive.call(this, ...players);
	}
	

	// Методы установки таймера действий

	/**
	* Ждет ответа от игроков.
	* @param {number}   time    время ожидания в секундах
	* @param {Player[]} players игроки, которых нужно ждать
	*/
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
			return this.actions.deadline;
		}
		else{
			this.log.error(new Error('Set to wait for response but nobody to wait for'));
			return 0;
		}
	}

	/**
	* Выполняется по окончании таймера ответа игроков
	* Выполняет случайное действие или продолжает игру
	*/
	timeOut(){
		this.timer = null;
		this.players.logTimeout();

		// Если есть действия, выполняем первое попавшееся действие
		if(this.actions.hasValid() && this.states.current == 'STARTED'){
			this.actions.executeFirst();
		}
		// Иначе, обнуляем действующих игроков, возможные действия и продолжаем ход
		else{
			this.players.working = [];
			this.actions.clearValid();
			// jshint curly:false
			while(this.continue());
		}	
	}


	// Методы обработки действий

	/**
	* Получает ответ от игрока асинхронно.
	* @param  {Player} player
	* @param  {object} action выполненное игроком действие
	*/
	recieveResponse(player, action){
		setTimeout(() => {
			this.recieveResponseSync.call(this, player, action);
		}, 0);
	}

	/**
	* Получает ответ от игрока синхронно.  
	* Используется для тестов, асинхронность должна быть добавлена при вызове функции для корректной работы.
	* @param  {Player} player
	* @param  {object} action выполненное игроком действие
	*/
	recieveResponseSync(player, action){
		if(!this.active){
			this.log.warn('Game inactive, can\'t recieve response', player.id, player.type, action);
			return;
		}
		this.actions.recieve(player, action);
	}


	// Игрок проносит курсор над картой

	/**
	* Сообщает игрокам, что игрок держит курсор над определенной картой.
	* @param  {Player} player
	* @param  {string} cid    id карты
	*/
	hoverOverCard(player, cid){
		if(this.isRunning && this.players.includes(player) && player.statuses.working && this.actions.valid[player.id].length && this.cards.byId[cid].field == player.id){
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
			this.log.silly('Hovering over', cid, player.id);
		}
	}

	/**
	* Сообщает игрокам, что игрок убрал курсор с карты.
	* @param {Player} player
	* @param {string} [cid]  id карты
	*/
	hoverOutCard(player, cid){
		if(this.isRunning && this.players.includes(player) && player.statuses.hover){
			
			let players = [];
			this.players.forEach((p) => {
				if(p != player){
					players.push(p);
				}
			});
			this.players.notify({type: 'HOVER_OUT_CARD', cid: player.statuses.hover, noResponse: true, channel: 'extra'}, players);
			player.statuses.hover = null;
			this.log.silly('Hovering out');
		}
	}
}

/**
* Максимальное кол-во игроков в игре.
* @type {Number}
*/
Game.maxPlayers = 6;

/**
* Минимальное кол-во игроков в игре.
* @type {Number}
*/
Game.minPlayers = 2;

/**
* Название режима игры.
* @type {string}
* @default 'game'
*/
Game.modeName = 'game';

/**
* {@link Game}
* @module
*/
module.exports = Game;
