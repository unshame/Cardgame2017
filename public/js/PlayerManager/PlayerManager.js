/**
* Менеджер игроков
* @class
*/

var PlayerManager = function(){
	this.reset();
};

PlayerManager.prototype.savePlayers = function(players, gameId){
	this.gameId = gameId;
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
	this.gameId = null;
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
};

PlayerManager.prototype.updateRoles = function(roles){
	this.players.forEach(function(p){
		var role = roles && roles[p.id] && roles[p.id].role;
		if(!role){
			p.role = null;
		}
		else if(role != p.role){
			if(p.id == this.pid){
				ui.eventFeed.newMessage('You\'re the ' + role, 'neutral', 2000);
			}
			p.role = roles[p.id].role;
		}
	}, this);
};
