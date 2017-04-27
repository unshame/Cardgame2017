/*
 * Запускает сервер
 */

//Node modules
const express = require('express'),
	http = require('http'),
	Eureca = require('eureca.io');

//Игровые модули
const Game = require('./serverjs/Game/GameLogic'),
	Bot = require('./serverjs/Players/Bot'),
	Player = require('./serverjs/Players/Player'),
	Tests = require('./serverjs/Tests/GameTest');

//Приложение и http сервер
let app = express(),
	httpServer = http.createServer(app);

//Открываем клиентам доступ к файлам 
app.use(express.static(__dirname + '/public'));

//Устанавливаем порт
app.set('port', (process.env.PORT || 5000));

//Создаем eureca сервер и добавляем разрешенные клиентские функции
let server = new Eureca.Server({allow:[
	'setId',
	'meetOpponents',
	'recievePossibleActions',
	'recieveCompleteAction',
	'recieveNotification',
	'handleLateness'
]
});

//Прикрепляем http сервер к eureca серверу
server.attach(httpServer);

let clients = {};
let games = [];
let players = [];
let randomNames = ['Lynda','Eldridge','Shanita','Mickie','Eileen','Hiedi','Shavonne','Leola','Arlena','Marilynn','Shawnna','Alanna','Armando','Julieann','Alyson','Rutha','Wilber','Marty','Tyrone','Mammie','Shalon','Faith','Mi','Denese','Flora','Josphine','Christa','Sharonda','Sofia','Collene','Marlyn','Herma','Mac','Marybelle','Casimira','Nicholle','Ervin','Evia','Noriko','Yung','Devona','Kenny','Aliza','Stacey','Toni','Brigette','Lorri','Bernetta','Sonja','Margaretta', 'Johnny Cocksucker III'];
let newPlayers = [];
let botsAdded = 0;

let argv = require('minimist')(process.argv.slice(2));
let numBots = argv.b === undefined ? Number(argv.bots) : Number(argv.b);
let numPlayers = argv.p === undefined ? Number(argv.players) : Number(argv.p);
let rndBots = Boolean(argv.r || argv.rnd || argv.random);
let transfer = Boolean(process.env.TRANSFER || argv.transfer);
let testing = Boolean(argv.t || argv.test || argv.testing);
let debug = Boolean(argv.d || argv.debug);

if(isNaN(numBots))
	numBots = 3;
if(isNaN(numPlayers) || !numPlayers)
	numPlayers = 1;

console.log('numBots=' + numBots, 'numPlayers=' + numPlayers, 'rndBots=' + rndBots, 'transfer=' + transfer, 'testing=' + testing, 'debug=' + debug);

if(rndBots && numBots)
	numBots = Math.floor(Math.random()*numBots) + 1;

if(!testing){
	console.log('Bots added:', numBots);
	console.log('Waiting for players:', numPlayers);
}

//Клиент подключился
server.onConnect(function (conn) {

	if(testing)
		return;

	//getClient позволяет нам получить доступ к функциям на стороне клиента
	let remote = server.getClient(conn.id);

	//Запоминаем информацию о клиенте
	clients[conn.id] = {id:conn.id, remote:remote};

	if(!newPlayers.length && numBots){
		let randomNamesCopy = randomNames.slice();
		for (let n = 0; n < numBots; n++) {
			let bot = new Bot(randomNamesCopy);
			newPlayers.push(bot);
		}
	}

	//Подключаем клиента к экземпляру игрока	
	let p = new Player(remote, conn.id);

	console.log('New client %s (%s)\n', p.id, conn.id, conn.remoteAddress);

	//Запускаем игру с ботами и игроком
	newPlayers.push(p);
	players.push(p);

	if(newPlayers.length >= numPlayers + numBots){	
		games.push(new Game(newPlayers, transfer, debug));
		newPlayers = [];
		botsAdded = 0;
	}
	else{
		console.log('Waiting for players:', numPlayers - newPlayers.length + numBots);
	}
});

//Клиент отключился
server.onDisconnect(function (conn) {

	if(testing)
		return;

	console.log('Client disconnected ', conn.id);

	let removeId = clients[conn.id].id;

	for(let pi = players.length - 1; pi >= 0; pi--){
		let p = players[pi];
		if(p.connId == removeId){
			let pi = newPlayers.indexOf(p);
			if(~pi){
				newPlayers.splice(pi, 1);
			}

			if(!p.game){
				let pi = players.indexOf(p);
				if(~pi)
					players.splice(pi, 1);
			}
			else{
				p.connected = false;
			}
		}
	}

	delete clients[removeId];
});

server.exports.recieveCompleteAction = function(action){
	if(!action)
		return;
	let connId = this.connection.id;
	let pi = players.map((p) => {return p.connId;}).indexOf(connId);
	let player = players[pi];
	player && player.sendResponse(action);
};
server.exports.recieveResponse = function(){
	let connId = this.connection.id;
	let pi = players.map((p) => {return p.connId;}).indexOf(connId);
	let player = players[pi];
	player && player.sendResponse();
};

//Подключаем сервер к порту
httpServer.listen(app.get('port'), () => {
	console.log('Node app is running on port', app.get('port'));
	if(testing)
		Tests.runTest(numBots, null, debug);
});

