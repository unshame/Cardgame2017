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
		}
	}
}
