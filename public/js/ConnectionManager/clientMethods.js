/**
* Методы, вызываемые сервером
* @namespace clientMethods
*/

/* exported clientMethods */
var clientMethods = {

	setId: function(connId, pid){
		actionHandler.sequencer.finish(true);
		game.pid = pid;
		var oldId = options.get('connection_id');
		if(oldId){
			connection.proxy.reconnectClient(oldId);
		}
		options.set('connection_id', connId);
		options.save();
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

	recievePossibleActions: function(newActions, time, timeSent, turnStage){	
		this.serverWaiting = false;
		actionHandler.handlePossibleActions(newActions, time, timeSent, turnStage);
		if(connection.inDebugMode){
			console.log(newActions);
		}
	},

	recieveCompleteAction: function(action){
		if(!action.noResponse){
			connection.serverWaiting = true;
		}
		actionHandler.executeAction(action);
		if(connection.inDebugMode){
			console.log(action);
		}
	},

	recieveNotification: function(note, actions){
		if(!note.noResponse){
			connection.serverWaiting = false;
		}
		actionHandler.handleNotification(note, actions);
		if(connection.inDebugMode){
			console.log(note, actions);
		}
	}
};
