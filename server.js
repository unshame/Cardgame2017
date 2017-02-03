/*
 * Запускает сервер
 */

//Node moduls
var express = require('express'),
	http = require('http'),
	Eureca = require('eureca.io');

//Игровые модули
var LobbyManager = require('./serverjs/lobbyManager').LobbyManager,
	Lobby = require('./serverjs/lobby').Lobby,
	Game = require('./serverjs/gamelogic').Game,
	Bot = require('./serverjs/bots').Bot,
	Player = require('./serverjs/players').Player;


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
	'recieveAction',
	'recieveNotification',
	'handleLateness'
]
});

//Прикрепляем http сервер к eureca серверу
server.attach(httpServer);

var clients = {};
var games = [];
var players = [];
var randomNames = ['Lynda','Eldridge','Shanita','Mickie','Eileen','Hiedi','Shavonne','Leola','Arlena','Marilynn','Shawnna','Alanna','Armando','Julieann','Alyson','Rutha','Wilber','Marty','Tyrone','Mammie','Shalon','Faith','Mi','Denese','Flora','Josphine','Christa','Sharonda','Sofia','Collene','Marlyn','Herma','Mac','Marybelle','Casimira','Nicholle','Ervin','Evia','Noriko','Yung','Devona','Kenny','Aliza','Stacey','Toni','Brigette','Lorri','Bernetta','Sonja','Margaretta'];

//Клиент подключился
server.onConnect(function (conn) {
	console.log('New Client id=%s ', conn.id, conn.remoteAddress);

	//getClient позволяет нам получить доступ к функциям на стороне клиента
	var remote = server.getClient(conn.id);

	//Запоминаем информацию о клиенте
	clients[conn.id] = {id:conn.id, remote:remote};

	//Подключаем клиента к экземпляру игрока
	var newPlayers = [];
	var p = new Player(remote, conn.id);

	//Запускаем игру с ботами и игроком
	newPlayers.push(p);
	players.push(p);
	var randomNamesCopy = randomNames.slice();
	for (var n = 0; n < Math.floor(Math.random()*4) + 2; n++) {
		var bot = new Bot(randomNamesCopy);
		newPlayers.push(bot);
	}
	games.push(new Game(newPlayers));
});

//Клиент отключился
server.onDisconnect(function (conn) {
	console.log('Client disconnected ', conn.id);

	var removeId = clients[conn.id].id;

	for(var pi = 0; pi < players.length; pi++){
		var p = players[pi];
		if(p.connId == removeId){
			if(!p.game){
				delete p;
			}
			else{
				p.connected = false;
			}
		}
	}

	delete clients[removeId];
});

server.exports.recieveAction = function(action){
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
});
