/* exported reactQueue */
var reactQueue = {

	QUEUE_ENTERED: function(action){
		ui.menus.queue.disableElement('vs_bots');
		ui.menus.queue.fadeIn();
		var link = location.href.replace(location.hash, '') + '#' + action.qid;
		document.getElementById('queue_id').value = link;
		history.replaceState(null, null, link);
	},

	QUEUE_LEFT: function(){
		ui.menus.queue.disableElement('vs_bots');
		ui.feed.newMessage('Left queue', 2000);
		ui.menus.queue.fadeOut();
		game.state.change('menu', false);
	},

	QUEUE_STATUS: function(action){
		var playersWaiting = action.playersNeeded - action.playersQueued;
		ui.eventFeed.newMessage(
			'Waiting for ' + 
			playersWaiting + 
			' more ' +
			(playersWaiting == 1 ? 'player' : 'players')
		);
		if(action.playersQueued == 1){
			ui.menus.queue.enableElement('vs_bots');
		}
		else{
			ui.menus.queue.disableElement('vs_bots');
		}
	},

	QUEUE_READY: function(){
		ui.eventFeed.clear();
		game.state.change('play', false);
	}
};
