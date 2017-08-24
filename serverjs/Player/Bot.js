/*
	Серверные боты
*/

'use strict';

const
	generateId = require('../generateId'),
	Player = require('./Player');


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

	getDescisionTime(){
		let fakeTime = 1,
			minTime = this.game.fakeDescisionTimer || 0;
		return Math.random()*fakeTime + minTime;
	}

	recieveGameInfo(info){
		if(!info.noResponse){
			this.sendDelayedResponse();
		}
	}

	recieveDeals(deals){
		this.sendDelayedResponse();
	}

	recieveValidActions(actions){
		setTimeout(() => {
			this.sendRandomAction(actions);
		}, this.getDescisionTime());
	}

	recieveCompleteAction(action){
		if(!action.noResponse){
			this.sendDelayedResponse();
		}
	}

	recieveNotification(action){
		if(action.actions){
			this.sendDelayedResponse(action.actions[1]);
		}			
	}

	sendDelayedResponse(action){
		setTimeout(() => {
			this.sendResponse(action);
		}, this.getDescisionTime());
	}

}

module.exports = Bot;