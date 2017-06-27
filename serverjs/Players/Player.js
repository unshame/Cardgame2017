'use strict';

const utils = require('../utils'),
	Log = require('../logger');

class Player{

	constructor(remote, connId, name){
		let id = utils.generateId();
		this.id = 'player_' + id;
		this.type = 'player';

		this.log = Log(module, id);

		this.remote = remote;
		this.connId = connId;

		if(this.remote){
			this.remote.setId(this.connId, this.id);
			this.connected = true;
		}

		this.name = name || this.id;

		this.game = null;
		this.afk = false;
	}

	meetOpponents(opponents){
		if(this.remote && this.connected)
			this.remote.meetOpponents(opponents);
		else if(!this.connected)
			this.sendInstantResponse();
	}

	recieveGameInfo(cards, players, trumpSuit, type, noResponse){
		let action = {
			type: type,
			cards: cards || [],
			players: players || [],
			turnIndex: this.game.turnNumber,
			gameIndex: this.game.index,
			noResponse: noResponse || false
		};
		if(this.game.cards.table.fullLength == this.game.cards.table.maxLength){
			action.unlockedField = 'TABLE' + (this.game.cards.table.fullLength - 1);
		}
		if(trumpSuit || trumpSuit === 0){
			action.trumpSuit = trumpSuit;
		}

		if(this.remote && this.connected)
			this.remote.recieveCompleteAction(action);
		else if(!this.connected)
			this.sendInstantResponse();
	}

	recieveDeals(deals){
		let action = {
			type: 'DRAW',
			cards: []
		};
		for(let ci = 0; ci < deals.length; ci++){
			action.cards.push(deals[ci]);
		}
		if(this.remote && this.connected)
			this.remote.recieveCompleteAction(action);
		else if(!this.connected)
			this.sendInstantResponse();
	}

	recieveMinTrumpCards(cards, winner){
		let action = {
			type: 'TRUMP_CARDS',
			cards: cards,
			pid: winner
		};
		if(this.remote && this.connected)
			this.remote.recieveCompleteAction(action);
		else if(!this.connected)
			this.sendInstantResponse();
	}

	recieveValidActions(actions, time){
		if(this.remote && this.connected){
			let now = Date.now();
			if(this.afk)
				time = this.game.timeouts.afk;
			this.remote.recievePossibleActions(actions, now + time*1000, now);
		}

		//Функции для дебага
		//this.sendRandomAction(actions);
		//this.sendTakeOrSkipAction(actions);
	}


	recieveCompleteAction(action){
		if(this.remote && this.connected)
			this.remote.recieveCompleteAction(action);
		else if(!this.connected)
			this.sendInstantResponse();
	}

	recieveNotification(note, actions){
		if(this.remote && this.connected)
			this.remote.recieveNotification(note, actions);
	}

	handleLateness(){
		if(this.remote && this.connected)
			this.remote.handleLateness();
	}

	sendResponse(action){
		if(!this.game){
			this.log.error(this.id, 'No game has been assigned');
			return;
		}
		this.game.recieveResponse(this, action ? action : null);
	}

	sendInstantResponse(){
		setTimeout(() => {this.sendResponse();},0);
	}

	sendRandomAction(actions){
		let randomIndex;
		if(actions.length > 1 && (actions[actions.length - 1].type == 'TAKE' || actions[actions.length - 1].type == 'SKIP'))
			randomIndex = Math.floor(Math.random()*(actions.length-1));
		else
			randomIndex = Math.floor(Math.random()*actions.length);
		let action = actions[randomIndex];
		setTimeout(() => {
			this.sendResponse(action);
		},1);
	}

	sendTakeOrSkipAction(actions){
		if(actions.length == 1 && (actions[0].type == 'TAKE' || actions[0].type == 'SKIP')){
			let action = actions[0];
			setTimeout(() => {
				this.sendResponse(action);
			},1000);
		}
	}

	updateRemote(newConnId, newRemote){
		if(newConnId){
			this.connId = newConnId;
			this.remote = newRemote;
		}
		if(this.remote)
			this.remote.updateId(newConnId ? this.id : null);
	}

	reconnect(){
		this.connected = true;
		this.afk = false;
		if(this.game)
			this.game.players.gameStateNotifyOnReconnect(this);
	}
}

module.exports = Player;