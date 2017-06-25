/*
	Серверные боты
*/

'use strict';

const
	utils = require('../utils'),
	Player = require('./Player');

var fakeDescisionTimer = 1;

class Bot extends Player{
	constructor(randomNames, brain){
		super();
		this.id = 'bot_' + utils.generateId();
		this.type = 'bot';
		this.connected = true;

		let nameIndex = Math.floor(Math.random()*randomNames.length);
		if(randomNames.length){
			this.name = randomNames[nameIndex];
			randomNames.splice(nameIndex,1);
		}
		else{
			this.name = this.id;
		}
		this.wins = 0;
		this.brain = brain;
	}


	recieveGameInfo(cards, players, trumpSuit, type, noResponse){
		if(!noResponse)
			setTimeout(() => {this.sendResponse();},Math.random()*fakeDescisionTimer);
	}

	recieveDeals(deals){
		setTimeout(() => {this.sendResponse();},Math.random()*fakeDescisionTimer);
	}

	recieveMinTrumpCards(cards, winner){
		setTimeout(() => {this.sendResponse();},Math.random()*fakeDescisionTimer);
	}

	recieveValidActions(actions){
		if(!this.brain){
			this.sendRandomAction(actions);
			return;
		}
		let game = this.game;
		let choice;
		let allIn = !!game.deck.length;
		for(let i = 0; i < actions.length; i++){
			let a = actions[i];
			if(a.type == 'ATTACK' && game.players.defender == this){
				choice = a;
				break;
			}
			if(!choice){
				choice = a;
				continue;
			}
			if(choice.suit == game.trumpSuit && a.suit != game.trumpSuit){
				choice = a;
				continue;
			}
			if(choice.suit != game.trumpSuit && a.suit == game.trumpSuit){
				continue;
			}
			if(choice.value < a.value){
				choice = a;
				continue;
			}
		}
		setTimeout(() => {this.sendResponse(choice)}, Math.random()*fakeDescisionTimer)
	}

	recieveCompleteAction(action){
		setTimeout(() => {this.sendResponse();},Math.random()*fakeDescisionTimer);
	}

	recieveNotification(note, actions){
		if(actions)
			setTimeout(() => {this.sendResponse(actions[0]);},Math.random()*fakeDescisionTimer);
	}

}

module.exports = Bot;