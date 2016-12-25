
var express = require('express')
  , app = express(app)
  , server = require('http').createServer(app);

// serve static files from the current directory
app.use(express.static(__dirname));
// app.use(express.static("./js/phaser.js"));
// app.use(express.static("./js/tanks.js"));

//we'll keep clients data here
var clients = {};

//get Server class
var Eureca = require('eureca.io');

//create an instance of Server
var Server = new Eureca.Server({allow:[
	'setId',
	'spawnOpponent',
	'removePlayer',
	'updateState'
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
