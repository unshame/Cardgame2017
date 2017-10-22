/**
* Методы для общения с сервером
* @namespace serverMethods
*/

/* exported serverMethods */
var serverMethods = {

	sendAction: function(field, card){
		var actions = actionHandler.possibleActions;

		if(!actions){
			return null;
		}

		for(var ai = 0; ai < actions.length; ai++){
			var action = actions[ai];
			if(action.cid == card.id && field.id == action.field){
				ui.rope.stop();
				//actionHandler.reset();
				connection.proxy.recieveCompleteAction(action);
				return action;
			}
		}
		return null;
	},

	sendButtonAction: function(type){

		var actions = actionHandler.possibleActions;

		if(!actions || !actions.length){
			return;
		}

		var actionTypes = actions.map(function(a){return a.type;});
		if(~actionTypes.indexOf(type)){
			var action = {type: type};
			actionHandler.reset();
			connection.proxy.recieveCompleteAction(action);
		}
	},

	sendResponse: function(){
		if(connection.serverWaiting){
			connection.serverWaiting = false;
			connection.proxy.recieveResponse();
		}
	},
	
	reconnect: function(){
		connection.proxy.requestGameInfo();
	},

	concede: function(){
		connection.proxy.concedeClient();
	},

	restoreClientName: function(){
		var oldName = gameOptions.get('profile_name');
		if(oldName){
			connection.proxy.changeClientName(oldName);
		}
		else{
			ui.cornerButtons.getByName('name').show();
			ui.modalManager.openModal('name');
		}
	}
};
