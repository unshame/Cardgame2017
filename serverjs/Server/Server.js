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
		this.params = {
			numBots: argv.b === undefined ? Number(argv.bots) : Number(argv.b),
			numPlayers: argv.p === undefined ? Number(argv.players) : Number(argv.p),
			rndBots: Boolean(argv.r || argv.rnd || argv.random),
			transfer: Boolean(process.env.TRANSFER || argv.transfer),
			testing: Boolean(argv.t || argv.test || argv.testing),
			debug: Boolean(argv.d || argv.debug),
			port: process.env.PORT || Number(argv.port)
		};

		if(isNaN(this.params.port) || !this.params.port)
			this.params.port = 5000;
		if(isNaN(this.params.numBots))
			this.params.numBots = 3;
		if(isNaN(this.params.numPlayers) || !this.params.numPlayers)
			this.params.numPlayers = 1;

		console.log(
			'port=' + this.params.port,
			'numBots=' + this.params.numBots,
			'numPlayers=' + this.params.numPlayers,
			'rndBots=' + this.params.rndBots,
			'transfer=' + this.params.transfer,
			'testing=' + this.params.testing,
			'debug=' + this.params.debug
		);

		if(!this.params.testing){
			console.log('Waiting for players:', this.params.numPlayers);
		}

		//express
		this.app = express();
		this.app.use(express.static(path.join(__dirname, rootPath, '/public')));

		this.clients = {};		//подключенные клиенты
		this.games = [];		//Работающие игры
		this.players = {};		//Все игроки
		this.newPlayers = [];	//Игроки в очереди

		//Биндим функции на ивенты
		this.on('connect', this.handleConnect);
		this.on('disconnect', this.handleDisconnect);
		this.on('error', this.handleError);
		this.on('message', this.handleMessage);

		//Функции, доступные со стороны клиента
		this.exports = getRemoteFunctions(this);

		//Случайные имена ботов
		this.randomNames = ['Lynda','Eldridge','Shanita','Mickie','Eileen','Hiedi','Shavonne','Leola','Arlena','Marilynn','Shawnna','Alanna','Armando','Julieann','Alyson','Rutha','Wilber','Marty','Tyrone','Mammie','Shalon','Faith','Mi','Denese','Flora','Josphine','Christa','Sharonda','Sofia','Collene','Marlyn','Herma','Mac','Marybelle','Casimira','Nicholle','Ervin','Evia','Noriko','Yung','Devona','Kenny','Aliza','Stacey','Toni','Brigette','Lorri','Bernetta','Sonja','Margaretta', 'Johnny Cocksucker III'];
		
		//Подключаем сервер к порту
		this.httpServer = http.createServer(this.app);
		this.attach(this.httpServer);
	}

	//Обработка подключения нового клиента
	handleConnect(conn){
		if(this.params.testing)
			return;

		//getClient позволяет нам получить доступ к функциям на стороне клиента
		let remote = this.getClient(conn.id);

		//Запоминаем информацию о клиенте
		this.clients[conn.id] = {id:conn.id, remote:remote};

		//Подключаем клиента к экземпляру игрока	
		let p = new Player(remote, conn.id);

		console.log('New client %s (%s)\n', p.id, conn.id, conn.remoteAddress);

		//Запускаем игру с ботами и игроком
		this.players[conn.id] = p;
	}

	//Обработка отключения клиента
	handleDisconnect(conn){
		if(this.params.testing)
			return;

		console.log('Client disconnected ', conn.id);

		let removeId = conn.id;

		let p = this.players[removeId];
		if(p){
			//Удаляем игрока из очереди
			let pi = this.newPlayers.indexOf(p);
			if(~pi){
				this.newPlayers.splice(pi, 1);
			}

			//Если игрок не находится в игре, удаляем его
			if(!p.game){
				delete this.players[removeId];
			}
			//иначе устанавливаем отключенный статус
			else{
				p.connected = false;
			}
		}

		delete this.clients[removeId];
	}

	//Обработка ошибок
	handleError(conn){

	}

	//Выполняется при любом ответе от клиента
	handleMessage(conn){

	}

	//Запускает сервер
	start(){
		this.httpServer.listen(this.params.port, () => {
			console.log('Node app is running on port', this.params.port);
			if(this.params.testing)
				Tests.runTest(this.params.numBots, null, this.params.debug);
		});
	}

	//Добавляет игрока в очередь и запускает игру, если очередь заполнена
	addPlayerToQueue(player){
		this.newPlayers.push(player);

		//Запускаем игру при достаточном кол-ве игроков
		if(this.newPlayers.length >= this.params.numPlayers){	

			//Добавляем ботов, если нужно
			if(this.params.numBots){
				let numBots = this.params.numBots;

				//Случайное кол-во ботов
				if(this.params.rndBots)
					numBots = Math.floor(Math.random()*numBots) + 1;

				let randomNamesCopy = this.randomNames.slice();
				for (let n = 0; n < numBots; n++) {
					let bot = new Bot(randomNamesCopy);
					this.newPlayers.push(bot);
				}
				console.log('Bots added:', numBots);
			}

			//Создаем игру, очищаем очередь
			this.games.push(new Game(this.newPlayers, this.params.transfer, this.params.debug));
			this.newPlayers = [];
		}
		//иначе продолжаем ждать игроков
		else{
			console.log('Waiting for players:', this.params.numPlayers - this.newPlayers.length);
		}
	}


}

module.exports = Server;