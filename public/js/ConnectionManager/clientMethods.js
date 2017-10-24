/**
* Методы, вызываемые сервером
* @namespace clientMethods
*/

/* exported clientMethods */
var clientMethods = {

	setId: function(connId, pid, name){
		actionHandler.sequencer.finish(true);
		game.pid = pid;
		var oldId = gameOptions.get('connection_id');
		if(oldId){
			connection.proxy.reconnectClient(oldId);
		}
		else{
			connection.server.restoreClientName();
			connection.server.tryJoiningLinkedQueue();
		}
		gameOptions.set('connection_id', connId);
		gameOptions.save();
		connection.id = connId;
		if(name){
			ui.menus.name.setPlaceHolder(name);
		}
	},

	updateId: function(pid, name){
		if(pid){
			console.log('Reconnected to', pid);
			game.pid = pid;
			game.state.change('play');
			connection.proxy.requestGameInfo();
			if(name){
				ui.menus.name.updateName(name);
			}
			else{
				connection.server.restoreClientName();
			}
			return;
		}
		if(game.state.currentSync != 'menu'){
			game.state.change('menu');
		}		
		connection.server.restoreClientName();
		connection.server.tryJoiningLinkedQueue();
	},

	recieveAction: function(action){
		if(connection.inDebugMode){
			console.log(action);
		}
		actionHandler.executeAction(action);
	}
};
