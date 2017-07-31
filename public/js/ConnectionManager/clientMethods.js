/**
* Методы, вызываемые сервером
* @namespace clientMethods
*/

window.clientMethods = {

	setId: function(connId, pid){
		connection.resetTimer();
		gameSeq.finish();
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
			game.changeState('play', connection.proxy.requestGameInfo, connection);
		}
		else{
			connection.proxy.requestGameInfo();
			game.changeState('menu');
		}
		
	},

	recievePossibleActions: function(newActions, time, timeSent){	
		connection.resetTimer();

		actionHandler.handlePossibleActions(newActions, time, timeSent);
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
	},

	handleLateness: function(){
		if(connection.inDebugMode)
			console.log('Too late');
	}
};
