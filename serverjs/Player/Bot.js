/*
	Серверные боты
*/

'use strict';

const
	generateId = require('../generateId'),
	Log = require('../logger'),
	Player = require('./Player');


class Bot extends Player{
	constructor(randomNames){
		super(null, null, null, false);
		this.id = 'bot_' + generateId();
		this.log = Log(module, this.id);
		this.type = 'bot';
		this.connected = true;
		this.actionTimeout = null;

		let nameIndex = Math.floor(Math.random()*randomNames.length);
		if(randomNames.length){
			this.name = randomNames[nameIndex];
			randomNames.splice(nameIndex,1);
		}
		else{
			this.name = this.id;
		}
	}

	getDescisionTime(addedTime){
		if(!this.game){
			return 0;
		}
		if(addedTime === undefined){
			addedTime = 0;
		}
		let minTime = this.game.fakeDescisionTimer || 0;
		if(minTime === 0){
			addedTime = 0;
		}
		return Math.random()*addedTime + minTime;
	}

	recieveGameInfo(info){
		if(!info.noResponse){
			this.sendDelayedResponse();
		}
	}

	recieveDeals(deals){
		this.sendDelayedResponse();
	}

	recieveValidActions(actions, deadline, roles, turnStage){
		clearTimeout(this.actionTimeout);
		if(actions.length){
			this.actionTimeout = setTimeout(() => {
				this.sendRandomAction(actions);
			}, this.getDescisionTime(1500));
		}
	}

	recieveCompleteAction(action){
		if(!action.noResponse){
			this.sendDelayedResponse();
		}
	}

	recieveNotification(action){
		if(action.noResponse){
			return;
		}
		clearTimeout(this.actionTimeout);
		if(action.actions){
			let ai = (this.game && this.game.isTest || this.game.queue && this.game.queue.type == 'botmatch') ? 0 : 1;
			this.sendDelayedResponse(action.actions[ai]);
		}			
	}

	sendDelayedResponse(action){
		clearTimeout(this.actionTimeout);
		this.actionTimeout = setTimeout(() => {
			this.sendResponse(action);
		}, this.getDescisionTime());
	}

}

module.exports = Bot;