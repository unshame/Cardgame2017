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
	}
}