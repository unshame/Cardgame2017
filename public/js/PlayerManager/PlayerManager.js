/**
* Менеджер игроков
* @class
*/

var PlayerManager = function(){
	this.reset();
};

PlayerManager.prototype.savePlayers = function(players){
	this.players = players;
	this.pid = game.pid;
	this.pi = players.map(function(p){ return p.id; }).indexOf(this.pid);
	if(!~this.pi){
		console.error('Player manager: Player', this.pid, 'not found in players\n', players);
		return;
	}
};

PlayerManager.prototype.reset = function(){
	this.pi = null;
	this.pid = null;
	this.players = [];
};
