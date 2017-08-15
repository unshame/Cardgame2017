/**
* Методы, вызываемые сервером
* @namespace clientMethods
*/

/* exported clientMethods */
var clientMethods = {

	setId: function(connId, pid){
		connection.resetTimer();
		game.seq.finish();
		game.pid = pid;
		var oldId = localStorage.getItem('durak_id');
		if(oldId){
			connection.proxy.reconnectClient(oldId);
		}
		localStorage.setItem('durak_id', connId);
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
		connection.resetTimer();

		actionHandler.handlePossibleActions(newActions, time, timeSent, turnStage);
		if(connection.inDebugMode)
			console.log(newActions);
	},

	recieveCompleteAction: function(action){

		var delay = actionHandler.executeAction(action);
		if(!action.noResponse){
			connection.resetTimer();
			connection.responseTimer = setTimeout(connection.server.sendResponse, !delay && 1 || (delay/game.speed + 300));
		}
		if(connection.inDebugMode)
			console.log(action);
	},

	recieveNotification: function(note, actions){
		connection.resetTimer();
		actionHandler.handleNotification(note, actions);
		if(connection.inDebugMode)
			console.log(note, actions);
	}
};
