/*
 * Запускает сервер
 */
 
process.env.PWD = process.cwd()

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
console.log(__dirname);
app.use(express.static(process.env.PWD+'/public'));

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
	for (var n = 0; n < Math.floor(Math.random()*3) + 1; n++) {
		var bot = new Bot();
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
	var connId = this.connection.id;
	var pi = players.map((p) => {return p.connId;}).indexOf(connId);
	var player = players[pi];
	var game = player.game;
	var localAction;
	console.log(game.validActions)
	for(var ai = 0; ai < game.validActions.length; ai++){
		var validAction = game.validActions[ai];
		if(validAction.cid == action.cid && validAction.spot == action.spot){
			localAction = validAction;
			break;
		}
	}
	localAction && player.sendResponse(localAction);
}

//Подключаем сервер к порту
httpServer.listen(app.get('port'), () => {
	console.log('Node app is running on port', app.get('port'));
});
