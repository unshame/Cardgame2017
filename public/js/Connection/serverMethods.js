/*
 * Методы для общения с сервером
 */

window.serverMethods = {

	sendAction: function(field, card){
		var actions = actionHandler.possibleActions;

		if(!actions)
			return;

		for(var ai = 0; ai < actions.length; ai++){
			var action = actions[ai];
			if(action.cid == card.id && field.id == action.field){
				game.rope.stop();
				game.actionButton.disable();
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
			game.rope.stop();
			game.actionButton.disable();
			var action = {type: type};
			actions = null;
			connection.proxy.recieveCompleteAction(action);
		}
	},

	sendResponse: function(){
		actionHandler.executeTimedAction();
		actionHandler.possibleActions = null;
		connection.proxy.recieveResponse();
		connection.resetTimer();
	}
};
