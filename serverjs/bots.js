/*
	Серверные боты
*/

var utils = require('./utils')
var randomNames = ['Lynda','Eldridge','Shanita','Mickie','Eileen','Hiedi','Shavonne','Leola','Arlena','Marilynn','Shawnna','Alanna','Armando','Julieann','Alyson','Rutha','Wilber','Marty','Tyrone','Mammie','Shalon','Faith','Mi','Denese','Flora','Josphine','Christa','Sharonda','Sofia','Collene','Marlyn','Herma','Mac','Marybelle','Casimira','Nicholle','Ervin','Evia','Noriko','Yung','Devona','Kenny','Aliza','Stacey','Toni','Brigette','Lorri','Bernetta','Sonja','Margaretta'];
var fakeDescisionTimer = 1;

var Bot = function(){
	this.id = 'bot_' + utils.generateId();
	this.type = 'bot';
	this.connected = true;

	this.opponents = [];

	var nameIndex = Math.floor(Math.random()*randomNames.length);
	this.name = randomNames[nameIndex];
	randomNames.splice(nameIndex,1);


	this.hands = {};
	this.hands[this.id] = []

	this.deck = [];
	this.cards = {};

	this.field = {};

	for (var i = 0; i <= 6; i++) {
		this.field['FIELD'+i] = {
			attack: null,
			defense: null
		}
	}

	this.game = null;
}

Bot.prototype.meetOpponents = function(opponents){
	for (var opponentN in opponents) {
		var opponent = opponents[opponentN];
		if(opponent.id == this.id) 
			continue;
		this.hands[opponent.id] = [];
	}
}

Bot.prototype.recieveCards = function(cards){
	for(var ci in cards){
		var card = cards[ci];
		this.cards[card.cid] = card;
		this.deck.push(card.cid);	
	}
	this.trumpSuit = this.deck[this.deck.length - 1].suit;
	setTimeout(() => {this.sendResponse()},Math.random()*fakeDescisionTimer)
}

Bot.prototype.recieveDeals = function(deals){
	for (var di in deals) {
		var deal = deals[di];
		//var cardIndexInDeck = this.deck.map( (card) => {return card.id} ).indexOf(deal.cid);
		//~cardIndexInDeck && this.deck.splice(cardIndexInDeck, 1);
		this.deck.shift();
		this.cards[deal.cid].value = deal.value || null;
		this.cards[deal.cid].suit = deal.suit || null;
		this.cards[deal.cid].position = deal.pid;
		this.hands[deal.pid].push(deal.cid);
	}
	//this.logState();
	setTimeout(() => {this.sendResponse()},Math.random()*fakeDescisionTimer)
}

Bot.prototype.recieveMinTrumpCards = function(cards, winner){
	setTimeout(() => {this.sendResponse()},Math.random()*fakeDescisionTimer)
}

Bot.prototype.recieveValidActions = function(actions){
	var randomIndex
	if(actions.length > 1 && (actions[actions.length - 1].type == 'TAKE' || actions[actions.length - 1].type == 'SKIP'))
		randomIndex = Math.floor(Math.random()*(actions.length-1))
	else
		randomIndex = Math.floor(Math.random()*actions.length);
	var action = actions[randomIndex];
	this.sendResponse(action);
}

Bot.prototype.recieveAction = function(action){
	switch(action.type){
		case 'ATTACK':
			var ci = this.hands[this.id].indexOf(action.cid);
			var card = this.cards[action.cid];

			card.position = action.position;

			this.hands[this.id].splice(ci, 1);
			this.field[action.position].attack = action.cid;
			
		case 'DEFENSE':
			break;
		case 'SKIP':
			break;
		case 'TAKE':
			break;
		case 'DISCARD':
			break;
		default:
			utils.log(this.id, 'Unknown action')
			break;
	}
	setTimeout(() => {this.sendResponse()},Math.random()*fakeDescisionTimer)
}

Bot.prototype.handleLateness = function(){

}

Bot.prototype.sendResponse = function(action){
	if(!this.game){
		utils.log(this.id, 'No game has been assigned');
		return
	}
	this.game.recieveResponse(this, action ? action : null);
}

exports.Bot = Bot;