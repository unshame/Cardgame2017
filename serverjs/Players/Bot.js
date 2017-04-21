/*
	Серверные боты
*/

'use strict';

const
	utils = require('../utils'),
	Player = require('./Player');

var fakeDescisionTimer = 1;

class Bot extends Player{
	constructor(randomNames){
		super();
		this.id = 'bot_' + utils.generateId();
		this.type = 'bot';
		this.connected = true;

		let nameIndex = Math.floor(Math.random()*randomNames.length);
		this.name = randomNames[nameIndex];
		randomNames.splice(nameIndex,1);
	}


	recieveGameInfo(cards){
		setTimeout(() => {this.sendResponse();},Math.random()*fakeDescisionTimer);
	}

	recieveDeals(deals){
		setTimeout(() => {this.sendResponse();},Math.random()*fakeDescisionTimer);
	}

	recieveMinTrumpCards(cards, winner){
		setTimeout(() => {this.sendResponse();},Math.random()*fakeDescisionTimer);
	}

	recieveValidActions(actions){
		this.sendRandomAction(actions);
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