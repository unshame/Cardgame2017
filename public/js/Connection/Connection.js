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
		var actionTypes = newActions.map(function(a){return a.type;});
		if(~actionTypes.indexOf('SKIP')){
			actionHandler.realAction = 'SKIP';
			game.actionButton.label.setText('Skip');
			game.actionButton.enable();
		}
		else if(~actionTypes.indexOf('TAKE')){
			actionHandler.realAction = 'TAKE';
			game.actionButton.label.setText('Take');
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
		if(note && note.message == 'GAME_ENDED' && note.results && note.results.winners && ~note.results.winners.indexOf(game.pid)){
			cardManager.throwCardsStart();
		}
		else if(note && (note.message == 'INVALID_ACTION' || note.message == 'LATE_OR_UNCALLED_ACTION') && note.action){
			var action = note.action;
			var card = cardManager.cards[action.cid];
			var cardInfo = {
				cid: card.id,
				suit: card.suit,
				value: card.value
			};
			var field = fieldManager.fields[playerManager.pid];
			fieldManager.moveCards(field, [cardInfo]);
			if(note.validActions){
				actionHandler.highlightPossibleActions(note.validActions);
			}
		}

		//if(isInDebugMode)
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
	actionHandler.executeTimedAction();
	actionHandler.possibleActions = null;
	server.recieveResponse();
	if(responseTimer)
		responseTimer = null;
}