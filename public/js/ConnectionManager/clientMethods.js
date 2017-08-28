/**
* Методы, вызываемые сервером
* @namespace clientMethods
*/

/* exported clientMethods */
var clientMethods = {

	setId: function(connId, pid){
		actionHandler.sequencer.finish(true);
		game.pid = pid;
		var oldId = gameOptions.get('connection_id');
		if(oldId){
			connection.proxy.reconnectClient(oldId);
		}
		gameOptions.set('connection_id', connId);
		gameOptions.save();
		connection.id = connId;
	},

	updateId: function(pid){
		if(pid){
			console.log('Reconnected to', pid);
			game.pid = pid;
			game.state.change('play');
			connection.proxy.requestGameInfo();
		}
		else if(game.state.currentSync != 'menu'){
			game.state.change('menu');
		}
		
	},

	recieveAction: function(action){
		if(connection.inDebugMode){
			console.log(action);
		}
		actionHandler.executeAction(action);
	}
};
