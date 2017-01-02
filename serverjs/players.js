var utils = require('../serverjs/utils')

var Player = function(remote, connid){
	this.id = 'player_' + utils.generateID();
	this.type = 'player';

	this.remote = remote;
	this.connid = connid;

	this.name = this.id;

	this.game = null;
}

Player.prototype.meetOpponents = function(opponents){
	if(this.remote)
			this.remote.meetOpponents(opponents);
}

Player.prototype.recieveDeck = function(deck){
	if(this.remote)
		this.remote.recieveDeck(deck);
}

Player.prototype.recieveCards = function(deals){
	if(this.remote)
		this.remote.recieveCards(deals);
}

Player.prototype.recieveMinTrumpCards = function(cards, winner){
	if(this.remote)
		this.remote.recieveMinTrumpCards(cards, winner);
}

Player.prototype.recieveValidActions = function(actions){
	if(this.remote)
		this.remote.recieveValidActions(actions);
}

Player.prototype.recieveAction = function(pid, action){
	if(this.remote)
		this.remote.recieveAction(pid, action);
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