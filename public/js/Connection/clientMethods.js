/**
 * Методы, вызываемые сервером
 * @namespace clientMethods
 */

window.clientMethods = {

	setId: function(connId, pid){
		connection.resetTimer();
		game.pid = pid;
		var oldId = localStorage.getItem('durak_id');
		if(oldId){
			connection.proxy.reconnectClient(oldId);
		}
		else{
			playerManager.pid = pid;
		}
		localStorage.setItem('durak_id', connId);
	},

	updateId: function(pid){
		if(pid){
			console.log('Reconnected to', pid);
			game.pid = pid;
		}
		playerManager.pid = game.pid;
		connection.proxy.requestGameInfo();
	},

	meetOpponents: function(opponents){
		connection.resetTimer();
		if(connection.isInDebugMode)
			console.log(opponents);
	},

	recievePossibleActions: function(newActions, time, timeSent){	
		connection.resetTimer();

		actionHandler.handlePossibleActions(newActions, time, timeSent);
		if(connection.isInDebugMode)
			console.log(newActions);
	},

	recieveCompleteAction: function(action){
		ui.actionButtons.getByName('queueUp').hide();
		connection.resetTimer();
		ui.rope.stop();
		cardManager.throwCardsStop();
		ui.actionButtons.getByName('action').disable();
		var delay = actionHandler.executeAction(action);
		connection.responseTimer = setTimeout(connection.server.sendResponse, !delay && 1 || (delay/game.speed + 300));
		if(connection.isInDebugMode)
			console.log(action);
	},

	recieveNotification: function(note, actions){
		connection.resetTimer();
		actionHandler.handleNotification(note, actions);
		if(connection.isInDebugMode)
			console.log(note, actions);
	},

	handleLateness: function(){
		if(connection.isInDebugMode)
			console.log('Too late');
	}
};
