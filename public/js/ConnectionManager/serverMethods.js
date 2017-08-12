/**
* Методы для общения с сервером
* @namespace serverMethods
*/

/* exported serverMethods */
var serverMethods = {

	sendAction: function(field, card){
		var actions = actionHandler.possibleActions;

		if(!actions)
			return;

		for(var ai = 0; ai < actions.length; ai++){
			var action = actions[ai];
			if(action.cid == card.id && field.id == action.field){
				actionHandler.removeActionsWith(card, field, action);
				ui.rope.stop();
				//actionHandler.reset();
				connection.proxy.recieveCompleteAction(action);
				return true;
			}
		}
		return false;
	},

	sendButtonAction: function(type){

		var actions = actionHandler.possibleActions;

		if(!actions || !actions.length)
			return;

		var actionTypes = actions.map(function(a){return a.type;});
		if(~actionTypes.indexOf(type)){
			var action = {type: type};
			actionHandler.reset();
			connection.proxy.recieveCompleteAction(action);
		}
	},

	sendResponse: function(){
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
