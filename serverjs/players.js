var utils = require('../serverjs/utils')

var Player = function(remote, connid){
	this.id = 'player_' + utils.generateID();
	this.type = 'player';

	this.remote = remote;
	this.connid = connid;

	if(this.remote)
		this.remote.setId(this.id);

	this.name = this.id;

	this.game = null;
}

Player.prototype.meetOpponents = function(opponents){
	if(this.remote)
		this.remote.meetOpponents(opponents);
}

Player.prototype.recieveDeck = function(deck){
	var action = {
		type: 'DECK_INFO',
		cards: []
	}
	for(var ci in deck){
		action.cards.push(deck[ci])
	}
	if(this.remote)
		this.remote.recieveAction(action);
}

Player.prototype.recieveCards = function(deals){
	var action = {
		type: 'DRAW',
		cards: []
	}
	for(var ci in deals){
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
}

Player.prototype.recieveAction = function(action){
	if(this.remote)
		this.remote.recieveAction(action);
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