/**
* Менеджер игроков
* @class
*/

var PlayerManager = function(){
	this.reset();
};

PlayerManager.prototype.savePlayers = function(players){
	this.players = players;
	var playersById = this.playersById = {};
	this.pid = game.pid;
	this.pi = players.map(function(p){ 
		playersById[p.id] = p;
		return p.id;
	}).indexOf(this.pid);
	if(!~this.pi){
		console.error('Player manager: Player', this.pid, 'not found in players\n', players);
		return;
	}
};

PlayerManager.prototype.reset = function(){
	this.pi = null;
	this.pid = null;
	this.players = [];
	this.playersById = {};
};

PlayerManager.prototype.getPlayer = function(pid){
	if(this.playersById[pid]){
		return this.playersById[pid];
	}
	else{
		console.error('Player manager: Player', pid, 'not found in players\n', this.players);
		return null;
	}
}