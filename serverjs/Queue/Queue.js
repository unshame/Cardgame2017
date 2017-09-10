'use strict';

const
	Log = require('../logger'),
	generateId = reqfromroot('generateId');


class Queue{

	/**
	* Очередь.
	* @class
	* @param {QueueManager} manager менеджер очередей
	* @param {string}       type    тип очереди
	* @param {object}       config  конфигурация очереди
	* @param {object}       rules   правила игры
	*/
	constructor(manager, type, config, rules){

		/**
		* id очереди
		* @type {String}
		*/
		this.id = 'queue_' + generateId();

		/**
		* Логгер очереди.
		* @type {winston.Logger}
		*/
		this.log = Log(module, this.id, config.debug);

		/**
		* Активна ли очередь 
		* (неактивные очереди были удалены из менеджера, но у игроков может остаться на них ссылка).
		* @type {Boolean}
		*/
		this.active = true;

		/**
		* Запущенная очередью игра.
		* @type {Game}
		*/
		this.game = null;

		/**
		* Менеджер очереди.
		* @type {QueueManager}
		*/
		this.manager = manager;

		/**
		* Тип очереди.
		* @type {string}
		*/
		this.type = type;

		/**
		* Имя очереди.
		* @type {string}
		*/
		this.name = config.name || 'Unnamed Queue';

		if(
			typeof config.numPlayers != 'number' || isNaN(config.numPlayers) || 
			config.numPlayers < 1
		){
			config.numPlayers = config.game.minPlayers;
		}
		config.numPlayers = Math.min(config.numPlayers, config.game.maxPlayers);

		if(
			typeof config.numBots != 'number' || isNaN(config.numBots) ||
			config.numPlayers + config.numBots > config.game.maxPlayers ||
			config.numBots < 0
		){
			config.numBots = 0;
		}

		/**
		* Конфигурация очереди.
		* @type {object}
		*/
		this.config = config;

		/**
		* Конфигурация игры, запускаемой этой очередью.
		* @type {object}
		*/
		this.gameConfig = {
			debug: config.debug
		};

		/**
		* Правила игры очереди.
		* @type {object}
		*/
		this.gameRules = this.config.game.sanitiseRules(rules);

		/**
		* Игроки в этой очереди.
		* @type {Array}
		*/
		this.players = [];

		this.log.notice('Queue initialized');
	}

	/**
	* Информация об очереди.
	* @return {object}
	*/
	get info(){
		return {
			id: this.id,
			type: this.type,
			gameMode: this.config.game.modeName,
			numPlayers: this.players.length,
			numPlayersRequired: this.config.numPlayers,
			numBots: this.config.numBots,
			gameRules: this.gameRules,
			name: this.name
		};
	}

	/**
	* Добавляет игрока в очередь.
	* Оповещает игроков о новом игроке в очереди.
	* Запускает очередь, если в ней достаточное кол-во игроков.
	* @param {Player} player
	*/
	addPlayer(player){
		if(this.game){
			this.log.notice('Can\'t add players when game is in progress');
			player.recieveMenuNotification({type: 'QUEUE_FULL'});
			return;
		}

		if(this.inactive){
			this.log.notice('Can\'t add players to an inactive queue');
			player.recieveMenuNotification({type: 'QUEUE_INACTIVE'});
			return;
		}

		this.log.notice('Player connected', player.id);

		this.players.push(player);
		player.queue = this;

		player.recieveQueueAction({type: 'QUEUE_ENTERED', qid: this.id});

		if(this.players.length >= this.config.numPlayers){
			this.startGame();
		}
		else{
			this.notifyPlayers();
		}
	}

	/**
	* Создает и запускает новую игру.
	* Оповещает игроков о том, что очередь заполнилась.
	*/
	startGame(){
		if(this.game){
			this.log.error(new Error('Can\'t start a game, another one is already in progress'));
			return;
		}

		this.log.notice('Starting game');

		this.players.forEach((p) => p.recieveQueueAction({type: 'QUEUE_READY'}));

		let players = this.players.slice();

		let numBots = this.config.numPlayers - players.length + this.config.numBots;
		if(numBots > 0 && this.config.bot){
			let randomNamesCopy = this.manager.randomNames.slice();

			for (let n = 0; n < numBots; n++) {
				let bot = new this.config.bot(randomNamesCopy);
				players.push(bot);
			}
		}

		this.game = new this.config.game(this, players, this.gameConfig, this.gameRules);
		this.manager.games[this.game.id] = this.game;
		this.manager.removeQueueFromList(this);
		this.game.init();
	}

	/**
	* Изменяет настройки очереди, чтобы заполнить пустые места ботами,
	* создает и начинает игру.
	*/
	startGameWithBots(){
		this.log.notice('Switching to botmatch');
		let numPlayers = this.config.numPlayers;
		this.config.numBots += numPlayers - this.players.length;
		this.config.numPlayers = this.players.length;
		this.type = 'botmatch';
		this.startGame();
	}

	/**
	* Удаляет игру и неактивных игроков из очереди по окончании игры.
	* Вызывается из игры.  
	* Запускает новую игру, если в очереди достаточно игроков.  
	* Удаляет очередь, если в ней не осталось игроков.  
	* Оповещает игроков о состоянии очереди в остальных случаях.  
	* @param  {array} [voteResults] результаты голосования за рематч
	*/
	endGame(voteResults){
		if(!this.game){
			this.log.error(new Error('No game to end'));
			return;
		}
		this.log.notice('Game ended');
		let results = {};
		if(voteResults){
			voteResults.forEach(r => results[r.pid] = r.type);
		}
		for(let i = this.players.length - 1; i >= 0; i--){
			let p = this.players[i];

			this.log.debug(p.id, 'voted', results[p.id] || 'no vote');

			if(!p.connected || !results[p.id] || results[p.id] != 'ACCEPT'){
				this.removePlayer(p, false);
			}
		}

		delete this.manager[this.game.id];
		this.game = null;

		if(!this.players.length){
			this.shutdown();
		}
		else if(this.players.length >= this.config.numPlayers){
			this.startGame();
		}
		else{
			this.manager.addQueueToList(this);
			this.players.forEach((p) => p.recieveQueueAction({type: 'QUEUE_ENTERED', qid: this.id}));
			this.notifyPlayers();
		}
	}

	/**
	* Прерывает игру, удаляет всех игроков и удаляет очередь из менеджера.
	*/
	shutdown(){
		if(!this.active){
			return;
		}
		this.log.notice('Shutting down');
		if(this.players.length){
			for(let i = this.players.length - 1; i >= 0; i--){
				this.removePlayer(this.players[i], false, true);
			}
		}
		if(this.game){
			this.game.shutdown();
		}
		this.active = false;
		this.manager.removeQueue(this);
	}

	/**
	* Сообщает игрокам о состоянии очереди.
	*/
	notifyPlayers(){
		if(this.game){
			return;
		}
		this.players.forEach((p) => {
			p.recieveQueueAction({
				type: 'QUEUE_STATUS',
				playersQueued: this.players.length,
				playersNeeded: this.config.numPlayers,
				noResponse: true
			});
		});
		this.log.notice('Waiting for players:', this.config.numPlayers - this.players.length);
	}

	/**
	* Удаляет игрока из очереди.
	* Оповещает игроков об удаленном игроке.
	* Удаляет очередь, если в ней не осталось игроков.
	* @param {Player}  player
	* @param {Boolean} notify              нужно ли оповещать игроков об удалении игрока из очереди
	* @param {Boolean} alreadyShuttingDown отменяет остановку очереди, которая может произойти, если в ней не осталось игроков
	*/
	removePlayer(player, notify = true, alreadyShuttingDown = false){
		if(player.game){
			this.log.warn('Cannot remove player in a game from queue', player.id, player.game.id);
			return;
		}
		if(!this.players.includes(player)){
			this.log.error(new Error(`Player isn't in this queue ${player.id}`));
			return;
		}

		let i = this.players.indexOf(player);
		this.players.splice(i, 1);
		player.queue = null;
		if(notify){
			player.recieveQueueAction({type: 'QUEUE_LEFT', instant: true});
			this.notifyPlayers();
		}
		this.log.notice('Player %s left queue', player.id, this.id);

		if(!this.players.length && !alreadyShuttingDown){
			this.shutdown();
		}
	}

	/**
	* Если игра запущена, убирает игрока из игры и очереди.
	* @param  {Player} player
	*/
	concedePlayer(player){
		if(this.game && this.game.isRunning){
			this.game.players.concede(player);
			this.removePlayer(player, false);
		} 
		else{
			this.log.notice('Player %s isn\'t in a game or game has ended, cannot concede', player.id);
		}
	}
} 

/**
* {@link Queue}
* @module
*/
module.exports = Queue;