/* exported reactExtra */
var reactExtra = {
	HOVER_OVER_CARD: function(action, seq){
		var card = cardManager.cards[action.cid];
		if(card){
			card.setHighlight(true, ui.colors.red);
		}
	},

	HOVER_OUT_CARD: function(action, seq){
		var card = cardManager.cards[action.cid];
		if(card){
			card.setHighlight(false);
		}
	},

	EVENT: function(action, seq){
		var message = action.message;
		var player = action.pid && gameInfo.getPlayer(action.pid);
		if(player && action.pid == game.pid && !action.showForSelf){
			return;
		}
		else if(player){
			message = (action.pid == game.pid ? 'You' : player.name) + ' ' + message;
		}
		ui.eventFeed.newMessage(message, 2000);
	}
};