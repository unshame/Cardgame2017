'use strict';

const utils = require('./utils')

var Player = function(remote, connId, name){
	this.id = 'player_' + utils.generateId();
	this.type = 'player';

	this.remote = remote;
	this.connId = connId;

	if(this.remote){
		this.remote.setId(this.id);
		this.connected = true;
	}

	this.name = name || this.id;

	this.game = null;
}

Player.prototype.meetOpponents = function(opponents){
	if(this.remote)
		this.remote.meetOpponents(opponents);
}

Player.prototype.recieveGameInfo = function(cards, players, trumpSuit, numDiscarded){
	let action = {
		type: 'GAME_INFO',
		cards: cards || [],
		players: players || []
	}
	if(trumpSuit || trumpSuit === 0)
		action.trumpSuit = trumpSuit;

	if(numDiscarded || numDiscarded === 0)
		action.numDiscarded = numDiscarded;	
	if(this.remote)
		this.remote.recieveCompleteAction(action);
}

Player.prototype.recieveDeals = function(deals){
	let action = {
		type: 'DRAW',
		cards: []
	}
	for(let ci = 0; ci < deals.length; ci++){
		action.cards.push(deals[ci])
	}
	if(this.remote)
		this.remote.recieveCompleteAction(action);
}

Player.prototype.recieveMinTrumpCards = function(cards, winner){
	let action = {
		type: 'TRUMP_CARDS',
		cards: cards,
		pid: winner
	}
	if(this.remote)
		this.remote.recieveCompleteAction(action);
}

Player.prototype.recieveValidActions = function(actions, time){
	if(this.remote)
		this.remote.recievePossibleActions(actions, time);
	/*let randomIndex
	if(actions.length == 1 && (actions[0].type == 'TAKE' || actions[0].type == 'SKIP')){
		let action = actions[0];
		setTimeout(() => {this.sendResponse(action)},1000)	
	}*/
/*		let randomIndex
		if(actions.length > 1 && (actions[actions.length - 1].type == 'TAKE' || actions[actions.length - 1].type == 'SKIP'))
			randomIndex = Math.floor(Math.random()*(actions.length-1))
		else
			randomIndex = Math.floor(Math.random()*actions.length);
		let action = actions[randomIndex];
		setTimeout(() => {this.sendResponse(action)},1)	*/
}

Player.prototype.recieveCompleteAction = function(action){
	if(this.remote)
		this.remote.recieveCompleteAction(action);
}

Player.prototype.recieveNotification = function(note, actions){
	if(this.remote)
		this.remote.recieveNotification(note, actions);
}

Player.prototype.handleLateness = function(){
	if(this.remote)
		this.remote.handleLateness();
}

Player.prototype.sendResponse = function(action){
	if(!this.game){
		utils.log(this.id, 'No game has been assigned');
		return
	}
	this.game.recieveResponse(this, action ? action : null);
}

module.exports = Player;