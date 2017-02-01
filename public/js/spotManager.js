/*
 * Модуль, управляющий полями (Spot)
 */

var SpotManager = function(){
	this.spots = {};
	this.positions = {
		DECK: {
			x: 100,
			y: app.screenHeight - 250
		},
		DISCARD_PILE: {
			x:app.screenWidth - 250,
			y:app.screenHeight - 250
		},
		playerHand: {
			x:390,
			y:app.screenHeight - 250
		},
		firstField: {
			x:100,
			y:400
		},
		firstOpponent: {
			x:100,
			y:100
		} 
	}
	this.dimensions = {
		DECK:{
			//width: ,
			//height: 
		},
		DISCARD_PILE: {
			//width: ,
			//height: 
		},
		playerHand: {
			width:app.screenWidth - 700,
			//height: 
		},
		firstOpponent: {
			//width:
			//height: 
		} 
	}
	this.cardsToRemove = {};
}

SpotManager.prototype.createSpotNetwork = function(players){

	this.pid = app.pid;
	var numOfCards = players.length > 4 ? 52 : 36;
	var x, y, id;

	var pi = players.map(function(p){ return p.id }).indexOf(this.pid);
	if(!~pi){
		console.error('Player', this.pid, 'not found in players\n', players);
		return
	}

	//Deck
	this.spots['DECK'] = new Spot({
		x: this.positions['DECK'].x,
		y: this.positions['DECK'].y,
		minActiveSpace: numOfCards / 2,
		align: 'right',
		padding: 0,
		margin: 22,
		focusable:false,
		forcedSpace: 0.5,
		texture: 'spot',
		sorting: false,
		type: 'DECK',
		id: 'DECK',
		alignment: 'vertical',
		direction: 'backward',
		delayTime: 50
	});
	this.cardsToRemove['DECK'] = [];

	//Discard pile
	this.spots['DISCARD_PILE'] = new Spot({
		x: this.positions['DISCARD_PILE'].x,
		y: this.positions['DISCARD_PILE'].y,
		minActiveSpace: numOfCards / 2,
		padding:0,
		focusable:false,
		forcedSpace: 0.5,
		texture: 'spot',
		sorting: false,
		type: 'DISCARD_PILE',
		id: 'DISCARD_PILE'
	});
	this.cardsToRemove['DISCARD_PILE'] = [];

	//Field
	var margin = (app.screenWidth - 130) / 7 - 220;
	for(var i = 0; i <= 6; i++){
		x = this.positions.firstField.x + 220*i + margin*i;
		y = this.positions.firstField.y;
		id = 'FIELD' + i;
		this.spots[id] = new Spot({
			x: x,
			y: y,
			minActiveSpace: skinManager.skin.trumpOffset,
			texture: 'spot',
			focusable:false,
			sorting:false,
			type: 'FIELD',
			id: 'FIELD' + i
		});
		this.positions[id] = {x: x, y: y};
		this.dimensions[id] = {};
		this.cardsToRemove[id] = [];
	}

	//Player hand
	this.spots[this.pid] = new Spot({
		x:this.positions.playerHand.x,
		y:this.positions.playerHand.y,
		width:this.dimensions.playerHand.width,
		texture: 'spot',
		type: 'HAND',
		id: this.pid
	});
	this.positions[this.pid] = {
		x: this.positions.playerHand.x,
		y: this.positions.playerHand.y
	};
	this.dimensions[this.pid] = {
		width:this.dimensions.playerHand.width
	};
	this.cardsToRemove[this.pid] = [];

	//Opponents
	var width = (app.screenWidth - 130) / (players.length - 1) - 50;
	var i = pi + 1;
	var oi = 0;
	if(i >= players.length)
		i = 0;
	while(i != pi){
		var p = players[i];
		x = this.positions.firstOpponent.x + (width + 50)*oi;
		y = this.positions.firstOpponent.y;
		this.spots[p.id] = new Spot({
			x: x,
			y: y,
			width: width,
			texture: 'spot',
			sorting:false,
			focusable:false,
			type: 'HAND',
			id: p.id
		});
		this.positions[p.id] = {
			x: x,
			y: y
		};
		this.dimensions[p.id] = {
			width: width
		};
		this.cardsToRemove[p.id] = [];
		oi++;
		i++;
		if(i >= players.length)
			i = 0;
	}
}

SpotManager.prototype.addSpot = function(options){
	if(!options)
		options = {};

	this.spots[options.id] = new Spot(options);
}

SpotManager.prototype.executeAction = function(action){
	if(action.type == 'TRUMP_CARDS')
		return;
	var spot = this.spots[this.pid];
	for(var ci in spot.cards){
		spot.cards[ci].setPlayability(false);
	}
	if(action.cid){
		this.queueCards([action]);
		this.removeMarkedCards();
		this.placeQueuedCards();
	}
	else if(action.cards){	
		var pid = null;
		if(action.type == 'TAKE')
			pid = action.pid;		
		if(action.type == 'CARDS'){
			this.resetSpots();

			controller.reset();

			for(var cid in gameManager.cards){
				if(gameManager.cards.hasOwnProperty(cid)){
					gameManager.cards[cid].base.removeAll(true);
				}
			}
			gameManager.cards = {};
			gameManager.cardsGroup.removeAll(true);
		}
		this.queueCards(action.cards, pid);
		this.removeMarkedCards();
		this.placeQueuedCards();
		if(action.numDiscarded){
			var discardCards = [];
			for (var i = 0; i < action.numDiscarded; i++) {
				var id = 'discarded_'+i;
				var options = {
					id: id
				}
				gameManager.cards[id] = new Card(options);
				discardCards.push(gameManager.cards[id])
			}
			this.spots['DISCARD_PILE'].addCards(discardCards);
		}
	}
	else if(action.type == 'DISCARD'){
		var discardCards = [];
		for(var i in action.ids){
			var cid = action.ids[i];
			var card = gameManager.cards[cid]
			
			if(card){
				card.presetValue(null, 0);
				card.setSpot('DISCARD_PILE');
				card.spot && card.spot.removeCard(card);
				card.setPlayability(false);
				discardCards.push(card)
			}
		}
		this.spots['DISCARD_PILE'].addCards(discardCards);
	}
	else if(action.type == 'TAKE' || action.type == 'SKIP'){
		//do nothing
	}
	else{
		console.warn('Unknown action type:', action.type, action)
	}
}

SpotManager.prototype.highlightPossibleActions = function(actions){
	var spot = this.spots[this.pid];
	for(var ci in spot.cards){
		spot.cards[ci].setPlayability(false);
	}
	for(var ai in actions){
		var action = actions[ai];
		if(action.cid && gameManager.cards[action.cid]){
			gameManager.cards[action.cid].setPlayability(true);
		}
	}
}

SpotManager.prototype.queueCards = function(newCards, pid){

	var delay = 0;
	for(var ci in newCards){
		var c = newCards[ci];
		var card = gameManager.cards[c.cid];
		if(card){
			if(pid){
				if(!pid.match('player_'))
					gameManager.cards[c.cid].presetValue(null,0);
			}
			else{
				card.presetValue(c.suit, c.value);		
			}
			card.setSpot(c.spot || c.pid || pid);
		}
		else{
			var options = {
				id: c.cid,
				suit: c.suit,
				value: c.value,
				spotId: c.spot || c.pid || pid
			}
			gameManager.cards[c.cid] = new Card(options);
			card = gameManager.cards[c.cid];
		}
		card.spot && this.cardsToRemove[card.spot.id].push(card);
		var spotId = card.spotId;
		if(spotId == 'BOTTOM')
			spotId = 'DECK';
		delay = this.spots[spotId].queueCards([card], delay)
	}

}

SpotManager.prototype.forEachSpot = function(callback){
	for(var si in this.spots){
		if(!this.spots.hasOwnProperty(si))
			return;
		var spot = this.spots[si];
		callback.call(this, spot, si)
	}
}

SpotManager.prototype.removeMarkedCards = function(){
	this.forEachSpot(function(spot, si){
		var cards = this.cardsToRemove[si];
		if(cards.length){
			spot.removeCards(cards);
			this.cardsToRemove[si] = [];
		}
	})
}

SpotManager.prototype.placeQueuedCards = function(){
	this.forEachSpot(function(spot, si){
		spot.placeQueuedCards();
	})
}

SpotManager.prototype.applySkin = function(){
	this.forEachSpot(function(spot, si){
		spot.resize(null, skinManager.skin.height, true);
	})
}

SpotManager.prototype.resetSpots = function(){
	this.forEachSpot(function(spot, si){
		spot.reset();
	})
}

SpotManager.prototype.updateDebug = function(){
	this.forEachSpot(function(spot, si){
		spot.updateDebug();
	})
}

SpotManager.prototype.toggleDebugMode = function(){
	this.forEachSpot(function(spot, si){
		spot.toggleDebugMode();
	})
}