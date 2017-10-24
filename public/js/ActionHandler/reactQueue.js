/* exported reactQueue */
var reactQueue = {

	QUEUE_ENTERED: function(action){
		ui.menus.queue.enableElement('vs_bots');
		ui.menus.queue.fadeIn();
		var link = location.href.replace(location.hash, '') + '#' + action.qid;
		document.getElementById('queue_id').value = link;
		history.replaceState(null, null, link);
	},

	QUEUE_LEFT: function(){
		ui.feed.newMessage('Left lobby', 2000);
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
		if(action.names){
			action.names.forEach(function(name){
				var status = action.left ? ' left ' : ' entered ';
				ui.feed.newMessage(name + status + 'lobby', 3000);
			});
		}
	},

	QUEUE_READY: function(){
		ui.eventFeed.clear();
		game.state.change('play', false);
	},

	QUEUE_READY_VOTE: function(action){
		ui.feed.newMessage(action.name + ' voted to play vs bots', 3000);
	}
};
