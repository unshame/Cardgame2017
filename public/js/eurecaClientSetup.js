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
		if(action.type == 'CARDS'){
			controller.reset();
			for(var cid in cards){
				if(cards.hasOwnProperty(cid)){
					cards[cid].base.removeAll(true);
				}
			}
			cards = {};
			cardsGroup.removeAll(true);
		}		
		if(action.cid){
			if(cards[action.cid]){
				cards[action.cid].setValue(action.suit, action.value);
				spot.sortCards();
				spot.placeCards();
				deck.sortCards();
				deck.placeCards();
				//cardsGroup.align(Math.floor(screenWidth / cards[action.cid].sprite.width), -1, cards[action.cid].sprite.width, cards[action.cid].sprite.height);
			}
			else{
				var options = {
					id: action.cid,
					suit: action.suit,
					value: action.value
				}
				cards[action.cid] = new Card(options);
			}
		}
		else if(action.cards && action.type != 'TAKE'){
			for(var ci in action.cards){
				var c = action.cards[ci];
				var card = cards[c.cid]
				if(card){
					card.setValue(c.suit, c.value);
					card.setSpot(c.spot || c.pid);
					if((card.spot == 'DECK' || card.spot == 'BOTTOM') && card.spot != deck){							
						spot.removeCard(card);
						deck.addCard(card);
					}
					else if(card.spot != spot){
						deck.removeCard(card);
						spot.addCard(card);
					}
					else{
						spot.sortCards();
						spot.placeCards();
						deck.sortCards();
						deck.placeCards();
					}
					//cardsGroup.align(Math.floor(screenWidth / cards[c.cid].sprite.width), -1, cards[c.cid].sprite.width, cards[c.cid].sprite.height);
				}
				else{
					var options = {
						id: c.cid,
						suit: c.suit,
						value: c.value,
						spot: c.spot
					}
					cards[c.cid] = new Card(options);
				}
			}
			if(action.type == 'CARDS'){
				//cardsGroup.align(Math.floor(screenWidth / 170), -1, 170, 220, Phaser.CENTER);
				spot.reset();
				deck.reset();
				var spotCards = [];
				var deckCards = [];
				for(ci in cards){
					if(cards.hasOwnProperty(ci)){
						if(cards[ci].spot == 'DECK')							
							deckCards.push(cards[ci]);
						else
							spotCards.push(cards[ci]);
					}
				}
				spot.addCards(spotCards);
				deck.addCards(deckCards);

			}
			if(action.numDiscarded){
				for (var i = 0; i < action.numDiscarded; i++) {
					var id = 'discarded_'+i;
					var options = {
						id: id
					}
					cards[id] = new Card(options);
					discard.addCard(cards[id])
				}
			}
		}
		else if(action.type == 'DISCARD'){
			for(var i in action.ids){
				var cid = action.ids[i];
				var card = cards[cid]
				
				if(card){
					card.setValue(null, 0);
					card.setSpot = 'DISCARD_PILE';
					card.spot.removeCard(card);
					discard.addCard(card)
				//	card.kill();
				//	delete card;
				}

			}
		} 
		else if(action.type == 'TAKE' && action.cards){
			for(var ci in action.cards){
				var cid = action.cards[ci].cid;
				if(cards[cid]){
					cards[cid].setValue(null,0);
					spot.sortCards();
					spot.placeCards();
					deck.sortCards();
					deck.placeCards();
				}
			}
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