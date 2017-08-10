/**
* Методы для общения с сервером
* @namespace serverMethods
*/

var serverMethods = {

	sendAction: function(field, card){
		var actions = actionHandler.possibleActions;

		if(!actions)
			return;

		for(var ai = 0; ai < actions.length; ai++){
			var action = actions[ai];
			if(action.cid == card.id && field.id == action.field){
				ui.rope.stop();
				ui.actionButtons.getByName('action').disable();
				actions = null;
				connection.proxy.recieveCompleteAction(action);
				return true;
			}
		}
		return false;
	},

	sendRealAction: function(type){

		var actions = actionHandler.possibleActions;

		if(!actions || !actions.length)
			return;

		var actionTypes = actions.map(function(a){return a.type;});
		if(~actionTypes.indexOf(type)){
			ui.rope.stop();
			ui.actionButtons.getByName('action').disable();
			var action = {type: type};
			actions = null;
			connection.proxy.recieveCompleteAction(action);
		}
	},

	sendResponse: function(){
		gameSeq.finish();
		actionHandler.possibleActions = null;
		connection.proxy.recieveResponse();
		connection.resetTimer();
	},
	
	reconnect: function(){
		connection.proxy.requestGameInfo();
	},

	disconnect: function(){
		connection.proxy.disconnectClient();
	}
};
