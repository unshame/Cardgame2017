/*
 * Запускает сервер
 */

//Node modules
var express = require('express'),
	http = require('http'),
	Eureca = require('eureca.io');

//Игровые модули
var Game = require('./serverjs/Game/GameLogic'),
	Bot = require('./serverjs/Players/Bot'),
	Player = require('./serverjs/Players/Player');
	Tests = require('./serverjs/Tests/GameTest');

//Приложение и http сервер
var app = express(app),
	httpServer = http.createServer(app);

//Открываем клиентам доступ к файлам 
app.use(express.static(__dirname + '/public'));

//Устанавливаем порт
app.set('port', (process.env.PORT || 5000));

//Создаем eureca сервер и добавляем разрешенные клиентские функции
var server = new Eureca.Server({allow:[
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

var clients = {};
var games = [];
var players = [];
var randomNames = ['Lynda','Eldridge','Shanita','Mickie','Eileen','Hiedi','Shavonne','Leola','Arlena','Marilynn','Shawnna','Alanna','Armando','Julieann','Alyson','Rutha','Wilber','Marty','Tyrone','Mammie','Shalon','Faith','Mi','Denese','Flora','Josphine','Christa','Sharonda','Sofia','Collene','Marlyn','Herma','Mac','Marybelle','Casimira','Nicholle','Ervin','Evia','Noriko','Yung','Devona','Kenny','Aliza','Stacey','Toni','Brigette','Lorri','Bernetta','Sonja','Margaretta', 'Johnny Cocksucker III'];
var newPlayers = [];
var botsAdded = 0;

var numBots = Number(process.env.BOTS);
var numPlayers = Number(process.env.PLAYERS);
var rndBots = Number(process.env.RND);
var transfer = Number(process.env.TRANSFER);
var testing = Number(process.env.TEST);

if(isNaN(numBots))
	numBots = 3;
if(isNaN(numPlayers) || !numPlayers)
	numPlayers = 1;
if(isNaN(rndBots))
	rndBots = false;
if(isNaN(transfer))
	transfer = true;
if(isNaN(testing))
	testing = false;

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
	var remote = server.getClient(conn.id);

	//Запоминаем информацию о клиенте
	clients[conn.id] = {id:conn.id, remote:remote};

	if(!newPlayers.length && numBots){
		var randomNamesCopy = randomNames.slice();
		for (var n = 0; n < numBots; n++) {
			var bot = new Bot(randomNamesCopy);
			newPlayers.push(bot);
		}
	}

	//Подключаем клиента к экземпляру игрока	
	var p = new Player(remote, conn.id);

	console.log('New client %s (%s)\n', p.id, conn.id, conn.remoteAddress);

	//Запускаем игру с ботами и игроком
	newPlayers.push(p);
	players.push(p);

	if(newPlayers.length >= numPlayers + numBots){	
		games.push(new Game(newPlayers, transfer));
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

	var removeId = clients[conn.id].id;

	for(var pi = players.length - 1; pi >= 0; pi--){
		var p = players[pi];
		if(p.connId == removeId){
			var pi = newPlayers.indexOf(p);
			if(~pi){
				newPlayers.splice(pi, 1);
			}

			if(!p.game){
				var pi = players.indexOf(p);
				if(~pi)
					players.splice(pi, 1)
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
	var connId = this.connection.id;
	var pi = players.map((p) => {return p.connId;}).indexOf(connId);
	var player = players[pi];
	player && player.sendResponse(action);
}
server.exports.recieveResponse = function(){
	var connId = this.connection.id;
	var pi = players.map((p) => {return p.connId;}).indexOf(connId);
	var player = players[pi];
	player && player.sendResponse();
}

//Подключаем сервер к порту
httpServer.listen(app.get('port'), () => {
	console.log('Node app is running on port', app.get('port'));
	if(testing)
		Tests.runTest();
});

