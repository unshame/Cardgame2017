'use strict';

const utils = require('../utils')

class Player{

	constructor(remote, connId, name){
		this.id = 'player_' + utils.generateId();
		this.type = 'player';

		this.remote = remote;
		this.connId = connId;

		if(this.remote){
			this.remote.setId(this.id);
			this.connected = true;
		}

		this.name = name || this.id;

		this.game = null;
	}

	meetOpponents(opponents){
		if(this.remote)
			this.remote.meetOpponents(opponents);
	}

	recieveGameInfo(cards, players, trumpSuit, numDiscarded){
		let action = {
			type: 'GAME_INFO',
			cards: cards || [],
			players: players || []
		}
		if(trumpSuit || trumpSuit === 0)
			action.trumpSuit = trumpSuit;

		if(numDiscarded || numDiscarded === 0)
			action.numDiscarded = numDiscarded;	
		if(this.remote)
			this.remote.recieveCompleteAction(action);
	}

	recieveDeals(deals){
		let action = {
			type: 'DRAW',
			cards: []
		}
		for(let ci = 0; ci < deals.length; ci++){
			action.cards.push(deals[ci])
		}
		if(this.remote)
			this.remote.recieveCompleteAction(action);
	}

	recieveMinTrumpCards(cards, winner){
		let action = {
			type: 'TRUMP_CARDS',
			cards: cards,
			pid: winner
		}
		if(this.remote)
			this.remote.recieveCompleteAction(action);
	}

	recieveValidActions(actions, time){
		if(this.remote)
			this.remote.recievePossibleActions(actions, time);

		//Функции для дебага
		//this.sendRandomAction(actions);
		//this.sendTakeOrSkipAction(actions);
	}


	recieveCompleteAction(action){
		if(this.remote)
			this.remote.recieveCompleteAction(action);
	}

	recieveNotification(note, actions){
		if(this.remote)
			this.remote.recieveNotification(note, actions);
	}

	handleLateness(){
		if(this.remote)
			this.remote.handleLateness();
	}

	sendResponse(action){
		if(!this.game){
			utils.log(this.id, 'No game has been assigned');
			return
		}
		this.game.recieveResponse(this, action ? action : null);
	}

	sendRandomAction(actions){
		let randomIndex;
		if(actions.length > 1 && (actions[actions.length - 1].type == 'TAKE' || actions[actions.length - 1].type == 'SKIP'))
			randomIndex = Math.floor(Math.random()*(actions.length-1))
		else
			randomIndex = Math.floor(Math.random()*actions.length);
		let action = actions[randomIndex];
		setTimeout(() => {this.sendResponse(action)},1)	
	}

	sendTakeOrSkipAction(actions){
		let randomIndex
		if(actions.length == 1 && (actions[0].type == 'TAKE' || actions[0].type == 'SKIP')){
			let action = actions[0];
			setTimeout(() => {this.sendResponse(action)},1000)	
		}
	}
}

module.exports = Player;