var reactQueue = {

	QUEUE_ENTERED: function(){
		ui.menus.main.fadeOut();
		ui.logo.fadeOut();
	},

	QUEUE_LEFT: function(){
		ui.feed.newMessage('Left queue', 2000);
		game.state.change('menu', false);
	},

	QUEUE_STATUS: function(action){
		var playersWaiting = action.playersNeeded - action.playersQueued;
		ui.eventFeed.newMessage(
			'Waiting for ' + 
			playersWaiting + 
			' more ' +
			(playersWaiting == 1 ? 'player' : 'players') + 
			'...'
		);
	},

	QUEUE_FULL: function(){
		ui.eventFeed.clear();
		game.state.change('play', false);
	}
};
