/*
 * Модуль отвечает за общение между клиентом и сервером
 * Инициализирует игру по готовности клиента
 * В будущем будет переделан как ConnectionManager 
*/

var server;
var isInDebugMode = false;

var EurecaClientSetup = function() {
	//создаем eureca.io клиент

	var client = new Eureca.Client();
	
	client.ready(function (proxy) {		
		server = proxy;
		create();
	});
	
	
	//Методы, принадлежащие export, становятся доступны на стороне сервера
	
	client.exports.setId = function(id) 
	{
		appManager.pid = id;
	}	
	client.exports.meetOpponents = function(opponents){
		spotManager.createSpotNetwork(opponents);

		if(isInDebugMode)
			console.log(opponents);
	}
	client.exports.recievePossibleActions = function(actions){		
		spotManager.highlightPossibleActions(actions);
		if(isInDebugMode)
			console.log(actions)
	}
	client.exports.recieveAction = function(action){
		spotManager.executeAction(action);
		
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