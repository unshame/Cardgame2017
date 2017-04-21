/*
 * Модуль отвечает за общение между клиентом и сервером
 * Инициализирует игру по готовности клиента
 * В будущем будет переделан как ConnectionManager 
*/

var server,
	isInDebugMode = false,
	actions = null,
	timeout = null,
	timer = null;

var EurecaClientSetup = function(callback, context) {
	//создаем eureca.io клиент

	var client = new Eureca.Client();
	
	client.ready(function (proxy) {		
		server = proxy;
		callback.call(context);
	});
	
	
	//Методы, принадлежащие export, становятся доступны на стороне сервера
	
	client.exports.setId = function(pid){
		game.pid = pid;
		window.playerManager = new PlayerManager(pid);
	};	
	client.exports.meetOpponents = function(opponents){
		if(isInDebugMode)
			console.log(opponents);
	};
	client.exports.recievePossibleActions = function(newActions, time, time_sent){		
		var actionTypes = newActions.map(function(a){return a.type;});
		var action;
		if(~actionTypes.indexOf('SKIP'))
			game.skipButton.show();
		if(~actionTypes.indexOf('TAKE'))
			game.takeButton.show();

		var current_time = new Date();
		time = time - current_time.getTime();
		if(time)
			game.rope.start(time - 1000);

		actionHandler.highlightPossibleActions(newActions);
		if(isInDebugMode)
			console.log(newActions);
	};
	client.exports.recieveCompleteAction = function(action){
		game.rope.stop();
		if(game.celebration){
			game.celebration.stop();
			game.celebration = null;
		}
		game.skipButton.hide();
		game.takeButton.hide();
		if(timeout){
			clearTimeout(timer);
			timer = null;
		}
		var delay = actionHandler.executeAction(action);
		setTimeout(
			function(){
				sendResponse();	
			},
			!delay && 1 || (delay/game.speed + 500)
		);
		if(isInDebugMode)
			console.log(action);
	};
	client.exports.recieveNotification = function(note, actions){
		console.log(note);
		if(note && note.results && note.results.winners && ~note.results.winners.indexOf(game.pid))
			game.celebration = new ThrowCards();

		if(isInDebugMode)
			console.log(note, actions);
	};
	client.exports.handleLateness = function(){
		if(isInDebugMode)
			console.log('Too late');
	};
	return client;
};

function sendAction(field, card){
	var actions = actionHandler.possibleActions;

	if(!actions)
		return;
	
	for(var ai = 0; ai < actions.length; ai++){
		var action = actions[ai];
		if(action.cid == card.id && field.id == action.field){
			game.rope.stop();
			actions = null;
			server.recieveCompleteAction(action);
			return true;
		}
	}
	return false;
}

function sendRealAction(type){
	game.skipButton.hide();
	game.takeButton.hide();

	var actions = actionHandler.possibleActions;

	if(!actions || !actions.length)
		return;
	var actionTypes = actions.map(function(a){return a.type;});
	var action;
	if(~actionTypes.indexOf(type))
		action = {type: type};
	actions = null;
	server.recieveCompleteAction(action);
}

function sendResponse(){
	game.rope.stop();
	actionHandler.possibleActions = null;
	server.recieveResponse();
}