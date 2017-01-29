/*
 * Модуль отвечает за общение между клиентом и сервером
 * Инициализирует игру по готовности клиента
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
		if(isInDebugMode)
			console.log(actions)
	}
	client.exports.recieveAction = function(action){	
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

				for(var cid in cards){
					if(cards.hasOwnProperty(cid)){
						cards[cid].base.removeAll(true);
					}
				}
				cards = {};
				cardsGroup.removeAll(true);
			}
			placeCards(action.cards, pid);
			if(action.numDiscarded){
				var discardCards = [];
				for (var i = 0; i < action.numDiscarded; i++) {
					var id = 'discarded_'+i;
					var options = {
						id: id
					}
					cards[id] = new Card(options);
					discardCards.push(cards[id])
				}
				discard.addCards(discardCards);
			}
		}
		else if(action.type == 'DISCARD'){
			var discardCards = [];
			for(var i in action.ids){
				var cid = action.ids[i];
				var card = cards[cid]
				
				if(card){
					card.setValue(null, 0);
					card.setSpot('DISCARD_PILE');
					card.spot && card.spot.removeCard(card);
					discardCards.push(card)
				}
				discard.addCards(discardCards);
			}
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
	for(var ci in newCards){
		var c = newCards[ci];
		var card = cards[c.cid];
		if(card){
			if(pid){
				if(!pid.match('player_'))
					cards[c.cid].setValue(null,0);
			}
			else{
				card.setValue(c.suit, c.value);		
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
			cards[c.cid] = new Card(options);
			card = cards[c.cid];
		}
		if((card.spotId == 'DECK' || card.spotId == 'BOTTOM') && card.spot != deck){							
			card.spot && card.spot.removeCard(card);
			deckCards.push(card);
		}
		else if(card.spotId.match('FIELD') && card.spot != field){
			card.spot && card.spot.removeCard(card);
			fieldCards.push(card);
		}
		else if(card.spotId.match('bot') && card.spot != botSpot){
			card.spot && card.spot.removeCard(card);
			botCards.push(card);
		}
		else if(card.spot != spot){
			card.spot && card.spot.removeCard(card);
			spotCards.push(card);
		}
	}
	deck.addCards(deckCards);
	field.addCards(fieldCards);
	botSpot.addCards(botCards);
	spot.addCards(spotCards);
}