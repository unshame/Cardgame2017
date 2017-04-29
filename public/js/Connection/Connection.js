/*
 * Модуль отвечает за общение между клиентом и сервером
 * Инициализирует игру по готовности клиента
 * В будущем будет переделан как ConnectionManager 
*/

var server,
	isInDebugMode = false,
	responseTimer = null;

window.setupClient = function(callback, context) {
	//создаем eureca.io клиент

	var client = new Eureca.Client();
	
	client.ready(function (proxy) {		
		server = proxy;
		callback.call(context);
	});
	
	
	//Методы, принадлежащие export, становятся доступны на стороне сервера
	
	client.exports.setId = function(connId, pid){
		resetTimer();
		game.pid = pid;
		var oldId = localStorage.getItem('durak_id');
		if(oldId){
			server.reconnectClient(oldId);
		}
		else{
			window.playerManager = new PlayerManager(pid);
		}
		localStorage.setItem('durak_id', connId);
	};	

	client.exports.updateId = function(pid){
		if(pid){
			console.log('Reconnected to', pid);
			game.pid = pid;
		}
		window.playerManager = new PlayerManager(game.pid);
		server.requestGameInfo();
	};

	client.exports.meetOpponents = function(opponents){
		resetTimer();
		if(isInDebugMode)
			console.log(opponents);
	};

	client.exports.recievePossibleActions = function(newActions, time, timeSent){	
		resetTimer();

		actionHandler.handlePossibleActions(newActions, time, timeSent);
		if(isInDebugMode)
			console.log(newActions);
	};

	client.exports.recieveCompleteAction = function(action){
		game.queueButton.hide();
		resetTimer();
		game.rope.stop();
		cardManager.throwCardsStop();
		game.actionButton.disable();
		var delay = actionHandler.executeAction(action);
		responseTimer = setTimeout(sendResponse, !delay && 1 || (delay/game.speed + 300));
		if(isInDebugMode)
			console.log(action);
	};

	client.exports.recieveNotification = function(note, actions){
		resetTimer();
		actionHandler.handleNotification(note, actions);
		if(isInDebugMode)
			console.log(note, actions);
	};

	client.exports.handleLateness = function(){
		if(isInDebugMode)
			console.log('Too late');
	};
	return client;
};

/*jshint unused:false*/

function resetTimer(){
	if(responseTimer){
		clearTimeout(responseTimer);
		responseTimer = null;
	}
}

function sendAction(field, card){
	var actions = actionHandler.possibleActions;

	if(!actions)
		return;

	for(var ai = 0; ai < actions.length; ai++){
		var action = actions[ai];
		if(action.cid == card.id && field.id == action.field){
			game.rope.stop();
			game.actionButton.disable();
			actions = null;
			server.recieveCompleteAction(action);
			return true;
		}
	}
	return false;
}

function sendRealAction(type){

	var actions = actionHandler.possibleActions;

	if(!actions || !actions.length)
		return;

	var actionTypes = actions.map(function(a){return a.type;});
	if(~actionTypes.indexOf(type)){
		game.rope.stop();
		game.actionButton.disable();
		var action = {type: type};
		actions = null;
		server.recieveCompleteAction(action);
	}
}

function sendResponse(){
	actionHandler.executeTimedAction();
	actionHandler.possibleActions = null;
	server.recieveResponse();
	if(responseTimer)
		responseTimer = null;
}