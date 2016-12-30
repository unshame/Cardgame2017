
var express = require('express')
  , app = express(app)
  , server = require('http').createServer(app);
var Game = require('./serverjs/gamelogic').Game;
var Bot = require('./serverjs/bots').Bot;
var Player = require('./serverjs/players').Player;
var localize = require('./commonjs/loc')

// serve static files from the current directory
app.use(express.static(__dirname));
// app.use(express.static('./js/phaser.js'));
// app.use(express.static('./js/tanks.js'));

//we'll keep clients data here
var clients = {};

//get Server class
var Eureca = require('eureca.io');

//create an instance of Server
var Server = new Eureca.Server({allow:[
	'setId',
	'spawnOpponent',
	'removePlayer',
	'updateState',
	'recieveCards',
	'recieveAction'
]
});

//attach eureca.io to our http server
Server.attach(server);

//eureca.io provides events to detect clients connect/disconnect

//detect client connection
Server.onConnect(function (conn) {
    console.log('New Client id=%s ', conn.id, conn.remoteAddress);

	//the getClient method provide a proxy allowing us to call remote client functions
    var remote = Server.getClient(conn.id);

	//register the client
	clients[conn.id] = {id:conn.id, remote:remote};

	//here we call setId (defined in the client side)
	remote.setId(conn.id)

	players.push(new Player(remote))
	games.push(new Game(players));
});

//detect client disconnection
Server.onDisconnect(function (conn) {
    console.log('Client disconnected ', conn.id);

	var removeId = clients[conn.id].id;

	delete clients[removeId];
	for (var c in clients)
	{
		var remote = clients[c].remote;

		//here we call kill() method defined in the client side
		remote.removePlayer(removeId);
	}
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

var players = []
var games = [];
for (var i = 0; i < 1; i++) {
	for (var n = 0; n < 3; n++) {
		var bot = new Bot();
		players.push(bot);
	}

	
}


/*console.log('\nGame started', testGame.id);
for(var handI in testGame.hands){
	var hand = testGame.hands[handI];
	console.log('\nHand ' + handI);
	for(var ci in hand){
		var cid = hand[ci];
		var card = testGame.cards[cid];
		var value = localize.cardValueToChar(card.value);
		var suit = card.suit;
		console.log(ci, card.id, value, suit);
	}
}

console.log('\nDeck');
for(var cardIndex in testGame.deck){
	var card = testGame.deck[cardIndex];
	var value = localize.cardValueToChar(card.value);
	var suit = card.suit;
	console.log(cardIndex, card.id, value, suit, card.position);
}

console.log('\nAll cards');
for(var cid in testGame.cards){
	if(testGame.cards.hasOwnProperty(cid)){
		var card = testGame.cards[cid];
		var value = localize.cardValueToChar(card.value);
		var suit = card.suit;
		console.log(cid, value, suit, card.position);
	}
}

console.log('\nTrump suit:', testGame.trumpSuit);*/