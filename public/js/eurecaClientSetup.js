/*
 * Модуль отвечает за общение между клиентом и сервером
 * Инициализирует игру по готовности клиента
 * В будущем будет переделан как ConnectionManager 
*/

var server;
var isInDebugMode = false;
var actions = null;

var EurecaClientSetup = function() {
	//создаем eureca.io клиент

	var client = new Eureca.Client();
	
	client.ready(function (proxy) {		
		server = proxy;
		create();
	});
	
	
	//Методы, принадлежащие export, становятся доступны на стороне сервера
	
	client.exports.setId = function(pid) 
	{
		appManager.pid = pid;
	}	
	client.exports.meetOpponents = function(opponents){
		if(isInDebugMode)
			console.log(opponents);
	}
	client.exports.recievePossibleActions = function(newActions){		
		actions = newActions;
		spotManager.highlightPossibleActions(newActions);
		if(isInDebugMode)
			console.log(newActions)
	}
	client.exports.recieveAction = function(action){
		var delay = spotManager.executeAction(action);
		
		if(isInDebugMode)
			console.log(action)
	}
	client.exports.recieveNotification = function(note, actions){
		if(isInDebugMode)
			console.log(note, actions)
	}
	client.exports.handleLateness = function(){
		if(isInDebugMode)
			console.log('Too late');
	}
	return client;
}

function sendAction(spot, card){
	if(!actions)
		return;
	for(var ai = 0; ai < actions.length; ai++){
		var action = actions[ai];
		if(action.cid == card.id && spot.id == action.spot){
			server.recieveAction(action);
			return;
		}
	}
}