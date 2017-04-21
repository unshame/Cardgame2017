/* Менеджер игроков */

var PlayerManager = function(pid){
	this.pid = pid;
	this.pi = null;
};

PlayerManager.prototype.savePlayers = function(players){
	this.players = players;
	this.pi = players.map(function(p){ return p.id; }).indexOf(this.pid);
	if(!~this.pi){
		console.error('Player manager: Player', this.pid, 'not found in players\n', players);
		return;
	}
};