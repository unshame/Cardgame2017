/*
	Серверные боты
*/

'use strict';

const
	generateId = require('../generateId'),
	Player = require('./Player');


function getDescisionTime(){
	let fakeTime = 1,
		minTime = 500;
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


	recieveGameInfo(info){
		if(!info.noResponse){
			this.sendDelayedResponse();
		}
	}

	recieveDeals(deals){
		this.sendDelayedResponse();
	}

	recieveMinTrumpCards(cards, winner){
		this.sendDelayedResponse();
	}

	recieveValidActions(actions){
		setTimeout(() => {
			this.sendRandomAction(actions);
		}, getDescisionTime());
	}

	recieveCompleteAction(action){
		if(!action.noResponse){
			this.sendDelayedResponse();
		}
	}

	recieveNotification(note, actions){
		if(actions){
			this.sendDelayedResponse(actions[0]);
		}			
	}

	sendDelayedResponse(action){
		setTimeout(() => {
			this.sendResponse(action);
		}, getDescisionTime());
	}

}

module.exports = Bot;