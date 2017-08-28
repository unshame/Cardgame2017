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
	QueueManager = reqfromroot('Queue/QueueManager'),
	DurakGame = reqfromroot('Game/Durak/DurakGame'),
	Bot = reqfromroot('Player/Bot'),
	Player = reqfromroot('Player/Player'),
	Tests = reqfromroot('Tests/GameTest'),
	getRemoteFunctions = reqfromroot('Server/remoteFunctions');

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

		this.manager = new QueueManager(this, {
			game: DurakGame,
			gameConfig: {
				transfer: this.params.transfer
			},
			bot: Bot,
			numPlayers: this.params.numPlayers,
			numBots: this.params.numBots,			
			debug: this.params.debug
		});

		// express
		let rootPath = '/../../';
		this.app = express();
		this.app.use(express.static(path.join(__dirname, rootPath, '/public')));

		this.clients = {};		// подключенные клиенты
		this.players = {};		// Все игроки

		// Биндим функции на ивенты
		this.on('connect', this.handleConnect);
		this.on('disconnect', this.handleDisconnect);
		this.on('error', this.handleError);
		this.on('message', this.handleMessage);

		// Функции, доступные со стороны клиента
		this.exports = getRemoteFunctions(this);

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
			transfer: Boolean(process.env.TRANSFER || argv.transfer),
			testing: argv.t || argv.test || argv.testing || false,
			debug: argv.d || argv.debug || 'notice',
			port: process.env.PORT || Number(argv.port)
		};

		if(params.debug && typeof params.debug != 'string'){
			params.debug = 'debug';
		}

		if(isNaN(params.port) || !params.port){
			params.port = 5000;
		}
		if(isNaN(params.numBots)){
			params.numBots = 0;
		}
		if(isNaN(params.numPlayers) || !params.numPlayers){
			params.numPlayers = 4;
		}

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
		if(this.params.testing){
			return;
		}

		// getClient позволяет нам получить доступ к функциям на стороне клиента
		let remote = this.getClient(conn.id);

		// Запоминаем информацию о клиенте
		this.clients[conn.id] = {id: conn.id, remote: remote};

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
		if(this.params.testing){
			return;
		}

		this.log.notice('Client disconnected ', conn.id);

		let removeId = conn.id;

		let p = this.players[removeId];

		if(p){
			if(this.manager.disconnectPlayer(p)){
				delete this.players[removeId];
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
			this.log.notice('Running on port', this.params.port);
			if(this.params.testing){
				Tests.runTest(this.params.numBots, this.params.testing, this.params.debug);
			}
		});
	}

}

/**
 * {@link Server}
 * @module 
 */
module.exports = Server;