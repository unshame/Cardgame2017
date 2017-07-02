/*
	Серверные боты
*/

'use strict';

const
	generateId = require('../generateId'),
	Player = require('./Player');


function getDescisionTime(){
	let fakeTime = 1,
		minTime = 1;
	return Math.random()*fakeTime + minTime;
}

class Bot extends Player{
	constructor(randomNames){
		super();
		this.id = 'bot_' + generateId();
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
	}


	recieveGameInfo(cards, players, trumpSuit, type, noResponse){
		if(!noResponse)
			setTimeout(() => {this.sendResponse();},getDescisionTime());
	}

	recieveDeals(deals){
		setTimeout(() => {this.sendResponse();},getDescisionTime());
	}

	recieveMinTrumpCards(cards, winner){
		setTimeout(() => {this.sendResponse();},getDescisionTime());
	}

	recieveValidActions(actions){
		setTimeout(() => {this.sendRandomAction(actions);},getDescisionTime());
	}

	recieveCompleteAction(action){
		if(!action.noResponse){
			setTimeout(() => {this.sendResponse();},getDescisionTime());
		}
	}

	recieveNotification(note, actions){
		if(actions)
			setTimeout(() => {this.sendResponse(actions[0]);},getDescisionTime());
	}

}

module.exports = Bot;