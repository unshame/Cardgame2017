/*
 * Сервер на основе eureca.io
 */

'use strict';

let rootPath = '/../../';

//Node модули
const 
	express = require('express'),
	http = require('http'),
	path = require('path'),
	Eureca = require('eureca.io'),
	minimist = require('minimist');

//Игровые модули
const 
	Game = require(path.join(__dirname, rootPath, 'serverjs/Game/GameLogic')),
	Bot = require(path.join(__dirname, rootPath, 'serverjs/Players/Bot')),
	Player = require(path.join(__dirname, rootPath, 'serverjs/Players/Player')),
	Tests = require(path.join(__dirname, rootPath, 'serverjs/Tests/GameTest')),
	getRemoteFunctions = require(path.join(__dirname, rootPath, 'serverjs/Server/remoteFunctions'));

class Server extends Eureca.Server{
	constructor(config, paramLine){
		super(config);

		//Консольные параметры
		let argv = minimist(paramLine);
		this.numBots = argv.b === undefined ? Number(argv.bots) : Number(argv.b);
		this.numPlayers = argv.p === undefined ? Number(argv.players) : Number(argv.p);
		this.rndBots = Boolean(argv.r || argv.rnd || argv.random);
		this.transfer = Boolean(process.env.TRANSFER || argv.transfer);
		this.testing = Boolean(argv.t || argv.test || argv.testing);
		this.debug = Boolean(argv.d || argv.debug);
		this.port = Number(argv.port);

		if(isNaN(this.port) || !this.port)
			this.port = 5000;
		if(isNaN(this.numBots))
			this.numBots = 3;
		if(isNaN(this.numPlayers) || !this.numPlayers)
			this.numPlayers = 1;

		console.log('port=' + this.port, 'numBots=' + this.numBots, 'numPlayers=' + this.numPlayers, 'rndBots=' + this.rndBots, 'transfer=' + this.transfer, 'testing=' + this.testing, 'debug=' + this.debug);

		if(this.rndBots && this.numBots)
			this.numBots = Math.floor(Math.random()*this.numBots) + 1;

		if(!this.testing){
			console.log('Bots added:', this.numBots);
			console.log('Waiting for players:', this.numPlayers);
		}

		//express
		this.app = express();
		this.app.use(express.static(path.join(__dirname, rootPath, '/public')));

		this.clients = {};
		this.games = [];
		this.players = {};
		this.newPlayers = [];

		this.on('connect', this.handleConnect);
		this.on('disconnect', this.handleDisconnect);
		this.on('error', this.handleError);
		this.on('message', this.handleMessage);

		this.randomNames = ['Lynda','Eldridge','Shanita','Mickie','Eileen','Hiedi','Shavonne','Leola','Arlena','Marilynn','Shawnna','Alanna','Armando','Julieann','Alyson','Rutha','Wilber','Marty','Tyrone','Mammie','Shalon','Faith','Mi','Denese','Flora','Josphine','Christa','Sharonda','Sofia','Collene','Marlyn','Herma','Mac','Marybelle','Casimira','Nicholle','Ervin','Evia','Noriko','Yung','Devona','Kenny','Aliza','Stacey','Toni','Brigette','Lorri','Bernetta','Sonja','Margaretta', 'Johnny Cocksucker III'];
		this.exports = getRemoteFunctions(this);

		//Подключаем сервер к порту
		this.httpServer = http.createServer(this.app);
		this.attach(this.httpServer);
	}

	handleConnect(conn){
		if(this.testing)
			return;

		//getClient позволяет нам получить доступ к функциям на стороне клиента
		let remote = this.getClient(conn.id);

		//Запоминаем информацию о клиенте
		this.clients[conn.id] = {id:conn.id, remote:remote};

		if(!this.newPlayers.length && this.numBots){
			let randomNamesCopy = this.randomNames.slice();
			for (let n = 0; n < this.numBots; n++) {
				let bot = new Bot(randomNamesCopy);
				this.newPlayers.push(bot);
			}
		}

		//Подключаем клиента к экземпляру игрока	
		let p = new Player(remote, conn.id);

		console.log('New client %s (%s)\n', p.id, conn.id, conn.remoteAddress);

		//Запускаем игру с ботами и игроком
		this.newPlayers.push(p);
		this.players[conn.id] = p;

		if(this.newPlayers.length >= this.numPlayers + this.numBots){	
			this.games.push(new Game(this.newPlayers, this.transfer, this.debug));
			this.newPlayers = [];
		}
		else{
			console.log('Waiting for players:', this.numPlayers - this.newPlayers.length + this.numBots);
		}
	}

	handleDisconnect(conn){
		if(this.testing)
			return;

		console.log('Client disconnected ', conn.id);

		let removeId = conn.id;

		let p = this.players[removeId];
		if(p){
			let pi = this.newPlayers.indexOf(p);
			if(~pi){
				this.newPlayers.splice(pi, 1);
			}

			if(!p.game){
				delete this.players[removeId];
			}
			else{
				p.connected = false;
			}
		}

		delete this.clients[removeId];
	}

	handleError(conn){

	}

	handleMessage(conn){

	}

	start(){
		this.httpServer.listen(this.port, () => {
			console.log('Node app is running on port', this.port);
			if(this.testing)
				Tests.runTest(this.numBots, null, this.debug);
		});
	}


}

module.exports = Server;