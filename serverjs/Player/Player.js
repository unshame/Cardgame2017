'use strict';

const 
	generateId = require('../generateId'),
	Log = require('../logger');

class Player{

	constructor(remote, connId, name, createLog = true){

		let id = generateId();
		this.id = 'player_' + id;
		this.type = 'player';

		if(createLog){
			this.log = Log(module, this.id);
		}

		this.remote = remote;
		this.connId = connId;

		if(this.remote){
			this.remote.setId(this.connId, this.id);
			this.connected = true;
		}

		this.statuses = {};

		this.name = name || this.id;

		this.game = null;
		this.afk = false;

	}

	recieveGameInfo(info){
		if(!info.channel){
			info.channel = 'primary';
		}
		if(this.remote && this.connected){
			this.remote.recieveAction(info);
		}
		else if(!this.connected){
			this.sendResponse();
		}
	}

	recieveDeals(deals){
		let action = {
			type: 'DRAW',
			cards: deals,
			channel: 'primary'
		};
		if(this.remote && this.connected){
			this.remote.recieveAction(action);
		}
		else if(!this.connected){
			this.sendResponse();
		}
	}

	recieveValidActions(actions, deadline, roles, turnStage){
		if(this.remote && this.connected){
			let now = Date.now();
			let action = {
				actions: actions,
				time: deadline,
				timeSent: now,
				turnStage: turnStage,
				roles: roles,
				channel: 'possible_actions'
			};
			this.remote.recieveAction(action);
		}

		// Функции для дебага
		// this.sendRandomAction(actions);
		// this.sendTakeOrSkipAction(actions);
	}


	recieveCompleteAction(action){
		if(!action.channel){
			action.channel = 'primary';
		}
		if(this.remote && this.connected){
			this.remote.recieveAction(action);
		}
		else if(!this.connected && !action.noResponse){
			this.sendResponse();
		}
	}

	recieveQueueAction(action){
		if(!action.channel){
			action.channel = 'queue';
		}
		if(this.remote && this.connected){
			this.remote.recieveAction(action);
		}
	}

	recieveNotification(action){
		if(!action.channel){
			action.channel = 'secondary';
		}
		if(this.remote && this.connected){
			this.remote.recieveAction(action);
		}
	}

	recieveMenuNotification(action){
		if(!action.channel){
			action.channel = 'menu';
		}
		if(this.remote && this.connected){
			this.remote.recieveAction(action);
		}
	}

	// Синхронно посылает асинхронный ответ серверу
	sendResponse(action){
		if(!this.game){
			this.log.warn('No game has been assigned', action);
			return;
		}
		if(!this.game.active){
			return;
		}
		this.game.recieveResponse(this, action || null);
	}

	// Асинхронно посылает синхронный ответ серверу с коллбэком (для тестов)
	sendResponseWithCallback(action, callback){
		if(!this.game){
			this.log.warn('No game has been assigned', action);
			return;
		}
		setTimeout(() => {
			if(!this.game || !this.game.active){
				return;
			}
			this.game.recieveResponseSync(this, action || null);
			if(callback){
				callback();
			}
		},0);
	}

	sendRandomAction(actions){
		let randomIndex;
		if(actions.length > 1 && (actions[actions.length - 1].type == 'TAKE' || actions[actions.length - 1].type == 'PASS')){
			randomIndex = Math.floor(Math.random()*(actions.length-1));
		}
		else{
			randomIndex = Math.floor(Math.random()*actions.length);
		}
		let action = actions[randomIndex];
		this.sendResponse(action);
	}

	sendTakeOrSkipAction(actions){
		if(actions.length == 1 && (actions[0].type == 'TAKE' || actions[0].type == 'PASS')){
			let action = actions[0];
			this.sendResponse(action);
		}
	}

	updateRemote(newConnId, newRemote){
		if(newConnId){
			this.connId = newConnId;
			this.remote = newRemote;
		}
		if(this.remote){
			this.remote.updateId(newConnId ? this.id : null);
		}
	}
}

module.exports = Player;