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
		ui.eventFeed.newMessage('Players in queue: ' + action.playersQueued + '/' + action.playersNeeded);
	},

	QUEUE_FULL: function(){
		ui.eventFeed.clear();
		game.state.change('play', false);
	}
};
