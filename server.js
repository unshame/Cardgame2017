
var express = require('express')
  , app = express(app)
  , Server = require('http').createServer(app);
//var path = require('path');

var LobbyManager = require('./serverjs/lobbyManager').LobbyManager,
	Lobby = require('./serverjs/lobby').Lobby,
	Game = require('./serverjs/gamelogic').Game,
	Bot = require('./serverjs/bots').Bot,
	Player = require('./serverjs/players').Player;

//Добавляем ботов
var players = [];
var games = [];
for (var n = 0; n < 5; n++) {
	var bot = new Bot();
	players.push(bot);
}

// Открываем клиентам доступ к файлам 
app.use(express.static('public'));

//Тут будет информация о клиентах
var clients = {};

//Загружаем серверную библиотеку
var Eureca = require('eureca.io');

//Создаем сервер и добавляем разрешенные клиентские функции
var server = new Eureca.Server({allow:[
	'setId',
	'meetOpponents',
	'recievePossibleActions',
	'recieveAction',
	'handleLateness'
]
});

//Подключаем eureca к нашему http серверу
server.attach(Server);

//Клиент подключился
server.onConnect(function (conn) {
    console.log('New Client id=%s ', conn.id, conn.remoteAddress);

	//getClient позволяет нам получить доступ к функциям на стороне клиента
    var remote = server.getClient(conn.id);

	//Запоминаем информацию о клиенте
	clients[conn.id] = {id:conn.id, remote:remote};

	//Запускаем игру с ботами и игроком
	if(!games.length){

		//Подключаем клиента к экземпляру игрока
		var p = new Player(remote, conn.id);

		players.push(p);
		games.push(new Game(players));
	}
	else{
		var game = games[0];
		if(game.disconnectedPlayers.length){
			var p = game.playersById[game.disconnectedPlayers[0]];
			p.remote = remote;
			p.connid = conn.id;
			p.connected = true;
			remote.setId(conn.id);
			game.disconnectedPlayers.shift();
		}
	}
});

//Клиент отключился
server.onDisconnect(function (conn) {
    console.log('Client disconnected ', conn.id);

	var removeId = clients[conn.id].id;

	for(var pi in players){
		var p = players[pi];
		if(p.connid == removeId){
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

Server.listen(8000, '0.0.0.0');