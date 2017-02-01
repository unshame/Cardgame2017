var utils = require('./utils')

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

Player.prototype.recieveCards = function(cards, trumpSuit, numDiscarded){
	var action = {
		type: 'CARDS',
		cards: []
	}
	if(trumpSuit || trumpSuit === 0)
		action.trumpSuit = trumpSuit;

	if(numDiscarded || numDiscarded === 0)
		action.numDiscarded = numDiscarded;	

	for(var ci = 0; ci < cards.length; ci++){
		action.cards.push(cards[ci])
	}
	if(this.remote)
		this.remote.recieveAction(action);
}

Player.prototype.recieveDeals = function(deals){
	var action = {
		type: 'DRAW',
		cards: []
	}
	for(var ci = 0; ci < deals.length; ci++){
		action.cards.push(deals[ci])
	}
	if(this.remote)
		this.remote.recieveAction(action);
}

Player.prototype.recieveMinTrumpCards = function(cards, winner){
	var action = {
		type: 'TRUMP_CARDS',
		cards: cards,
		pid: winner
	}
	if(this.remote)
		this.remote.recieveAction(action);
}

Player.prototype.recieveValidActions = function(actions){
	if(this.remote)
		this.remote.recievePossibleActions(actions);
/*	var randomIndex
	if(actions.length > 1 && (actions[actions.length - 1].type == 'TAKE' || actions[actions.length - 1].type == 'SKIP'))
		randomIndex = Math.floor(Math.random()*(actions.length-1))
	else
		randomIndex = Math.floor(Math.random()*actions.length);
	var action = actions[randomIndex];
	setTimeout(() => {this.sendResponse(action)},4000)	*/
}

Player.prototype.recieveAction = function(action){
	if(this.remote)
		this.remote.recieveAction(action);
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

exports.Player = Player;