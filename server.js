
var express = require('express')
  , app = express(app)
  , server = require('http').createServer(app);
var path = require('path');
var Game = require('./serverjs/gamelogic').Game;
var Bot = require('./serverjs/bots').Bot;
var Player = require('./serverjs/players').Player;

//Добавляем трех ботов
var players = []
var games = [];
for (var n = 0; n < 5; n++) {
	var bot = new Bot();
	players.push(bot);
}

// Открываем доступ к 
app.use(express.static('public'))

//we'll keep clients data here
var clients = {};

//Загружаем серверную библиотеку
var Eureca = require('eureca.io');

//Создаем сервер и добавляем разрешенные клиентские функции
var Server = new Eureca.Server({allow:[
	'setId',
	'meetOpponents',
	'recievePossibleActions',
	'recieveAction',
	'handleLateness'
]
});

//Подключаем eureca к нашему http серверу
Server.attach(server);

//Клиент подключился
Server.onConnect(function (conn) {
    console.log('New Client id=%s ', conn.id, conn.remoteAddress);

	//getClient позволяет нам получить доступ к функциям на стороне клиента
    var remote = Server.getClient(conn.id);

	//Запоминаем информацию о клиенте
	clients[conn.id] = {id:conn.id, remote:remote};

	//Запускаем игру с ботами и игроком
	players.push(new Player(remote, conn.id))
	if(!games.length){
		games.push(new Game(players));
	}
});

//Клиент отключился
Server.onDisconnect(function (conn) {
    console.log('Client disconnected ', conn.id);

	var removeId = clients[conn.id].id;

	delete clients[removeId];
});

//Tell clients about each other
Server.exports.handshake = function(id)
{
	var enemy=clients[id]
	for (var c in clients)
		if (c!=id) {
			clients[c].remote.spawnOpponent({
				id:id
			});
			var cl = clients[c];
			enemy.remote.spawnOpponent({
				id:c
			});
		}
}


//be exposed to client side
Server.exports.handleKeys = function (keys,id) {
    var conn = this.connection;
    var updatedClient = clients[conn.id];

    for (var c in clients)
    {
        var remote = clients[c].remote;
        if(c != id)
        	remote.updateState(updatedClient.id, keys);
        //keep last known state so we can send it to new connected clients
        clients[c].laststate = keys;
    }
}

server.listen(8000, '0.0.0.0');