var reactQueue = {
	LEFT_QUEUE: function(){
		ui.feed.newMessage('Left queue', 2000);
		game.state.change('menu');
	},

	QUEUE_STATUS: function(action){
		if(fieldManager.networkCreated){
			game.state.change('play');
		}
		ui.eventFeed.newMessage('Players in queue: ' + action.playersQueued + '/' + action.playersNeeded);
	},

	QUEUE_FULL: function(){
		ui.eventFeed.clear();
	}
};
