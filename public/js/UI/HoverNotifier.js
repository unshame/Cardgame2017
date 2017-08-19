var HoverNotifier = function(){
	this.card = null;
	this.delay = null;
}

HoverNotifier.prototype = {
	consider: function(card){
		this.resetDelay();
		this.delay = setTimeout(this.choose.bind(this, card), 500);

	},

	reject: function(card){
		if(this.card){
			connection.proxy.hoverOutCard(this.card.id);
			this.card = null;
		}
		this.resetDelay();
	},

	choose: function(card){
		this.resetDelay();
		if(card != this.card){
			this.card = card;
			connection.proxy.hoverOverCard(card.id);
			if(game.inDebugMode){
				console.log('Hover notifier: chose card', card.id, card);
			}
		}
	},

	resetDelay: function(){
		if(this.delay){
			clearTimeout(this.delay);
			this.delay = null;
		}
	}
}