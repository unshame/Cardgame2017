/*
 * Модуль отвечает за общение между клиентом и сервером
 * Инициализирует игру по готовности клиента
 * В будущем будет переделан как ConnectionManager 
*/

var server,
	isInDebugMode = false,
	timeout = null,
	timer = null;

window.EurecaClientSetup = function(callback, context) {
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
	client.exports.recievePossibleActions = function(newActions, time, timeSent){		
		var actionTypes = newActions.map(function(a){return a.type;});
		if(~actionTypes.indexOf('SKIP')){
			actionHandler.realAction = 'SKIP';
			game.actionButton.text.setText('Skip');
			game.actionButton.enable();
		}
		else if(~actionTypes.indexOf('TAKE')){
			actionHandler.realAction = 'TAKE';
			game.actionButton.text.setText('Take');
			game.actionButton.enable();
		}

		var currentTime = new Date();
		time = time - currentTime.getTime();
		if(time)
			game.rope.start(time - 1000);

		actionHandler.highlightPossibleActions(newActions);
		if(isInDebugMode)
			console.log(newActions);
	};
	client.exports.recieveCompleteAction = function(action){
		game.rope.stop();
		cardManager.throwCardsStop();
		game.actionButton.disable();
		if(timeout){
			clearTimeout(timer);
			timer = null;
		}
		var delay = actionHandler.executeAction(action);
		setTimeout(sendResponse, !delay && 1 || (delay/game.speed + 300)
		);
		if(isInDebugMode)
			console.log(action);
	};
	client.exports.recieveNotification = function(note, actions){
		console.log(note);
		if(note && note.results && note.results.winners && ~note.results.winners.indexOf(game.pid))
			cardManager.throwCardsStart();

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
	game.actionButton.disable();

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