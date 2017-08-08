'use strict';

// Node модули
const 
	express = require('express'),
	http = require('http'),
	path = require('path'),
	Eureca = require('eureca.io'),
	minimist = require('minimist'),
	Log = require('../logger');

// Игровые модули
const 
	Game = requirejs('Game/Game'),
	Bot = requirejs('Players/Bot'),
	Player = requirejs('Players/Player'),
	Tests = requirejs('Tests/GameTest'),
	getRemoteFunctions = requirejs('Server/remoteFunctions');

class Server extends Eureca.Server{

	/**
 	 * Сервер на основе eureca.io
	 * @param  {object} config    конфигурация Eureca.io сервера
	 * @param  {array} paramLine  параметры командной строки
	 */
	constructor(config, paramLine){
		super(config);

		this.params = this.parseParams(paramLine);

		this.log = this.createLogger();

		if(!this.params.testing){
			this.log.notice('Waiting for players:', this.params.numPlayers);
		}

		// express
		let rootPath = '/../../';
		this.app = express();
		this.app.use(express.static(path.join(__dirname, rootPath, '/public')));

		this.clients = {};		// подключенные клиенты
		this.games = [];		// Работающие игры
		this.players = {};		// Все игроки
		this.newPlayers = [];	// Игроки в очереди

		// Биндим функции на ивенты
		this.on('connect', this.handleConnect);
		this.on('disconnect', this.handleDisconnect);
		this.on('error', this.handleError);
		this.on('message', this.handleMessage);

		// Функции, доступные со стороны клиента
		this.exports = getRemoteFunctions(this);

		// Случайные имена ботов
		this.randomNames = ['Lynda','Eldridge','Shanita','Mickie','Eileen','Hiedi','Shavonne','Leola','Arlena','Marilynn','Shawnna','Alanna','Armando','Julieann','Alyson','Rutha','Wilber','Marty','Tyrone','Mammie','Shalon','Faith','Mi','Denese','Flora','Josphine','Christa','Sharonda','Sofia','Collene','Marlyn','Herma','Mac','Marybelle','Casimira','Nicholle','Ervin','Evia','Noriko','Yung','Devona','Kenny','Aliza','Stacey','Toni','Brigette','Lorri','Bernetta','Sonja','Margaretta', 'Johnny Cocksucker III'];
		
		// Подключаем сервер к порту
		this.httpServer = http.createServer(this.app);
		this.attach(this.httpServer);
	}

	/**
	 * Обрабатывает параметры при помощи minimist.
	 * @param  {array} paramLine параметры командной строки
	 * @return {object}          Обработанные параметры.
	 */
	parseParams(paramLine){
		let argv = minimist(paramLine);
		let params = {
			numBots: argv.b === undefined ? Number(argv.bots) : Number(argv.b),
			numPlayers: argv.p === undefined ? Number(argv.players) : Number(argv.p),
			rndBots: Boolean(argv.r || argv.rnd || argv.random),
			transfer: Boolean(process.env.TRANSFER || argv.transfer),
			testing: argv.t || argv.test || argv.testing,
			debug: argv.d || argv.debug || 'notice',
			port: process.env.PORT || Number(argv.port)
		};

		if(params.debug && typeof params.debug != 'string'){
			params.debug = 'debug';
		}

		if(isNaN(params.port) || !params.port)
			params.port = 5000;
		if(isNaN(params.numBots))
			params.numBots = 3;
		if(isNaN(params.numPlayers) || !params.numPlayers)
			params.numPlayers = 1;

		return params;
	}

	/**
	 * Создает winston логгер.
	 * @return {winston.Logger} Логгер.
	 */
	createLogger(){
		let log = Log(module, null, this.params.debug);

		log.notice(
			'port=' + this.params.port,
			'numBots=' + this.params.numBots,
			'numPlayers=' + this.params.numPlayers,
			'rndBots=' + this.params.rndBots,
			'transfer=' + this.params.transfer,
			'testing=' + this.params.testing,
			'debug=' + this.params.debug
		);

		return log;
	}

	/**
	 * Обработка подключения нового клиента.
	 * @param  {object} conn информация о соединении
	 */
	handleConnect(conn){
		if(this.params.testing)
			return;

		// getClient позволяет нам получить доступ к функциям на стороне клиента
		let remote = this.getClient(conn.id);

		// Запоминаем информацию о клиенте
		this.clients[conn.id] = {id:conn.id, remote:remote};

		// Подключаем клиента к экземпляру игрока	
		let p = new Player(remote, conn.id);

		this.log.notice('New client %s (%s)', p.id, conn.id, conn.remoteAddress);

		// Запускаем игру с ботами и игроком
		this.players[conn.id] = p;
	}

	/**
	 * Обработка отключения клиента.
	 * @param  {object} conn информация о соединении
	 */
	handleDisconnect(conn){
		if(this.params.testing)
			return;

		this.log.notice('Client disconnected ', conn.id);

		let removeId = conn.id;

		let p = this.players[removeId];
		if(p){
			// Удаляем игрока из очереди
			let pi = this.newPlayers.indexOf(p);
			if(~pi){
				this.newPlayers.splice(pi, 1);
			}

			// Если игрок не находится в игре, удаляем его
			if(!p.game){
				delete this.players[removeId];
			}
			// иначе устанавливаем отключенный статус
			else{
				p.connected = false;
			}
		}

		delete this.clients[removeId];
	}

	/** Оработка ошибок. */
	handleError(conn){

	}

	/** 
	 * Выполняется при любом ответе от клиента.
	 * @param  {object} conn информация о соединении
	 */
	handleMessage(conn){

	}

	/** Запускает сервер */
	start(){
		this.httpServer.listen(this.params.port, () => {
			this.log.notice('Node app is running on port', this.params.port);
			if(this.params.testing){
				Tests.runTest(this.params.numBots, this.params.testing, this.params.debug);
			}
		});
	}

	/**
	 * Добавляет игрока в очередь и запускает игру, если очередь заполнена
	 * @param {Player} player игрок
	 */
	addPlayerToQueue(player){
		this.newPlayers.push(player);

		// Запускаем игру при достаточном кол-ве игроков
		if(this.newPlayers.length >= this.params.numPlayers){	

			// Добавляем ботов, если нужно
			if(this.params.numBots){
				let numBots = this.params.numBots;

				// Случайное кол-во ботов
				if(this.params.rndBots)
					numBots = Math.floor(Math.random()*numBots) + 1;

				let randomNamesCopy = this.randomNames.slice();
				for (let n = 0; n < numBots; n++) {
					let bot = new Bot(randomNamesCopy);
					this.newPlayers.push(bot);
				}
				this.log.notice('Bots added:', numBots);
			}

			// Создаем игру, очищаем очередь
			this.games.push(new Game(this.newPlayers, this.params.transfer, this.params.debug));
			this.newPlayers = [];
		}
		// иначе продолжаем ждать игроков
		else{
			this.log.notice('Waiting for players:', this.params.numPlayers - this.newPlayers.length);
		}
	}


}

/**
 * {@link Server}
 * @module 
 */
module.exports = Server;