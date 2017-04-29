module.exports = function(server){
	return {
		recieveCompleteAction: function(action){
			if(!action)
				return;
			let player = server.players[this.connection.id];
			player && player.sendResponse(action);
		},
		recieveResponse: function(){
			let player = server.players[this.connection.id];
			player && player.sendResponse();
		},
		reconnectClient: function(connId){
			var newConnId = this.connection.id;
			let player = server.players[connId];
			if(player && !player.connected && player.game.isStarted()){
				server.players[newConnId] = player;
				server.players[connId] = null;
				player.updateRemote(newConnId, server.clients[newConnId].remote);
			}
			else{
				let player = server.players[newConnId];
				player.remote.updateId();
			}
		},
		queueUp: function(){
			let player = server.players[this.connection.id];
			if(player){
				if(player.game){
					console.log('Player %s already in game %s', player.id, player.game.id);
					return;
				}
				if(server.newPlayers.includes(player)){
					console.log('Player %s already in queue', player.id);
					return;
				}
				server.addPlayerToQueue(player);
			}
		},
		requestGameInfo: function(){
			let player = server.players[this.connection.id];
			if(player)
				player.reconnect();
		}
	}
}
