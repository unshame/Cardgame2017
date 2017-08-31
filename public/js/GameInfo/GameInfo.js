/**
* Менеджер игроков и информации об игре.
* @class
*/

var GameInfo = function(){
	this.reset();
};

GameInfo.prototype.savePlayers = function(players, gameId){
	this.gameId = gameId;
	this.players = players;
	var playersById = this.playersById = {};
	this.pid = game.pid;
	this.pi = players.map(function(p){ 
		playersById[p.id] = p;
		return p.id;
	}).indexOf(this.pid);
	if(!~this.pi){
		console.error('Game info: Player', this.pid, 'not found in players\n', players);
		return;
	}
};

GameInfo.prototype.reset = function(){
	this.gameId = null;
	this.pi = null;
	this.pid = null;
	this.defender = null;
	this.attacker = null;
	this.players = [];
	this.playersById = {};
	if(this.message){
		ui.eventFeed.removeMessage(this.message);
	}
	this.message = null;
	/**
	* Текущая стадия хода.
	* @type {string}
	*/
	this.turnStage = null;
};

GameInfo.prototype.resetTurnInfo = function(){
	if(this.message){
		ui.eventFeed.removeMessage(this.message);
		this.message = null;
	}
	this.turnStage = null;
	this.players.forEach(function(p){
		p.role = null;
		p.roleIndex = null;
	});
};

GameInfo.prototype.getPlayer = function(pid){
	if(this.playersById[pid]){
		return this.playersById[pid];
	}
	else{
		console.error('Game info: Player', pid, 'not found in players\n', this.players);
		return null;
	}
};

GameInfo.prototype.updateRoles = function(roles, turnStage){
	var oldMessage = this.message;

	var player = this.playersById[this.pid];

	this.turnStage = turnStage;

	this.attacker = null;
	this.players.forEach(function(p){
		var role = roles && roles[p.id] && roles[p.id].role;
		var roleIndex = role && roles[p.id].roleIndex;
		if(!role){
			p.role = null;
			p.roleIndex = null;
			if(p.role == 'defender'){
				this.defender = null;
			}
		}
		else if(role != p.role){
			if(role == 'defender'){
				this.defender = p;
			}
			else if(role == 'attacker' && roleIndex == 1){
				this.attacker = p;
			}
			p.role = roles[p.id].role;
			p.roleIndex = roleIndex;
		}
	}, this);

	var messageText = '',
		messageStyle = null;
	if(this.turnStage == 'INITIAL_ATTACK' && this.attacker != player){
		var defenderName = this.defender.id == game.pid ? 'you' : this.defender.name;
		messageText = this.attacker.name + ' is attacking ' + defenderName;
		messageStyle = 'system';
	}
	else if(player.role){
		switch(player.role){
			case 'attacker':
			messageText = 'You\'re attacking ' + this.defender.name;
			break;

			case 'defender':
			messageText = 'You\'re defending';
			break;

			default:
			console.error('Game info: unknown player role', player.role);
		}
		messageStyle = 'neutral';
	}
	else if(this.defender){
		messageText = this.defender.name + ' is defending';
		messageStyle = 'system';
	}
	if(!oldMessage || oldMessage.text != messageText){
		if(messageText){
			this.message = ui.eventFeed.newMessage(messageText, messageStyle);
		}
		else{
			this.message = null;
		}
	}
	if(oldMessage && (oldMessage.text != messageText || !this.message)){
		actionHandler.sequencer.queueUp(300).then(ui.eventFeed.removeMessage.bind(ui.eventFeed, oldMessage));
	}
};
