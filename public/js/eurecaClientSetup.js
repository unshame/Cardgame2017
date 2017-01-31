/*
 * Модуль отвечает за общение между клиентом и сервером
 * Инициализирует игру по готовности клиента
 * В будущем будет разделен на ConnectionManager и SpotManager
*/

var server;
var isInDebugMode = false;

var EurecaClientSetup = function() {
	//create an instance of eureca.io client

	var client = new Eureca.Client();
	
	client.ready(function (proxy) {		
		server = proxy;
		create();
	});
	
	
	//methods defined under "exports" namespace become available in the server side
	
	client.exports.setId = function(id) 
	{
		window.myId = id;
	}	
	client.exports.meetOpponents = function(opponents){
		//console.log(opponents);
		//for(var oi in opponents){
		//	new Card(opponents[oi].id);
		//}
		
	}
	client.exports.recievePossibleActions = function(actions){		
		for(var ci in spot.cards){
			spot.cards[ci].setPlayability(false);
		}
		for(var ai in actions){
			var action = actions[ai];
			if(action.cid && gameManager.cards[action.cid]){
				gameManager.cards[action.cid].setPlayability(true);
			}
		}
		if(isInDebugMode)
			console.log(actions)
	}
	client.exports.recieveAction = function(action){
		if(action.type == 'TRUMP_CARDS')
			return;
		for(var ci in spot.cards){
			spot.cards[ci].setPlayability(false);
		}	
		if(action.cid){
			placeCards([action])
		}
		else if(action.cards){	
			var pid;
			if(action.type == 'TAKE')
				pid = action.pid;		
			if(action.type == 'CARDS'){
				deck.reset();
				field.reset();
				botSpot.reset();
				spot.reset();
				discard.reset();

				controller.reset();

				for(var cid in gameManager.cards){
					if(gameManager.cards.hasOwnProperty(cid)){
						gameManager.cards[cid].base.removeAll(true);
					}
				}
				gameManager.cards = {};
				gameManager.cardsGroup.removeAll(true);
			}
			placeCards(action.cards, pid);
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
				discard.addCards(discardCards);
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
			discard.addCards(discardCards);
		}
		else if(action.type == 'TAKE' || action.type == 'SKIP'){
			//do nothing
		}
		else{
			console.warn('Unknown action type:', action.type, action)
		}
		if(isInDebugMode)
			console.log(action)
	}
	client.exports.recieveNotification = function(note, actions){
		if(isInDebugMode)
			console.log(note, actions)
	}
	client.exports.handleLateness = function(){
		if(isInDebugMode)
			console.log('Too late');
	}
	return client;
}

function placeCards(newCards, pid){

	var spotCards = [];
	var fieldCards = [];
	var botCards = [];
	var deckCards = [];

	spot.remove = [];
	field.remove = [];
	botSpot.remove = [];
	deck.remove = [];

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
		if((card.spotId == 'DECK' || card.spotId == 'BOTTOM') && card.spot != deck){							
			card.spot && card.spot.remove.push(card);
			delay = deck.queueCards([card], delay)
		}
		else if(card.spotId.match('FIELD') && card.spot != field){
			card.spot && card.spot.remove.push(card);
			delay = field.queueCards([card], delay)
		}
		else if(card.spotId.match('bot') && card.spot != botSpot){
			card.spot && card.spot.remove.push(card);
			delay = botSpot.queueCards([card], delay)
		}
		else if(card.spotId.match('player') && card.spot != spot){
			card.spot && card.spot.remove.push(card);
			delay = spot.queueCards([card], delay)
		}
	}

	deck.removeCards(deck.remove);
	field.removeCards(field.remove);
	botSpot.removeCards(botSpot.remove);
	spot.removeCards(spot.remove);

	deck.placeQueuedCards(delay);
	field.placeQueuedCards();
	botSpot.placeQueuedCards();
	spot.placeQueuedCards();
}