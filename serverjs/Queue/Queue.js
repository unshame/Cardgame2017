'use strict';

const
	Log = require('../logger'),
	generateId = reqfromroot('generateId');


class Queue{
	constructor(manager, type, config){

		this.id = 'queue_' + generateId();

		this.log = Log(module, this.id, config.debug);

		this.active = true;
		this.game = null;
		this.manager = manager;
		this.type = type;

		if(typeof config.numPlayers != 'number' || isNaN(config.numPlayers)){
			config.numPlayers = config.game.minPlayers;
		}
		config.numPlayers = Math.min(config.numPlayers, config.game.maxPlayers);

		if(
			typeof config.numBots != 'number' || isNaN(config.numBots) ||
			config.numPlayers + config.numBots > config.game.maxPlayers
		){
			config.numBots = 0;
		}
		this.config = config;


		this.gameConfig = config.gameConfig;
		this.gameConfig.debug = config.debug;
		this.players = [];
	}

	get info(){
		return {
			id: this.id,
			type: this.type,
			gameMode: this.config.game.modeName,
			numPlayers: this.players.length,
			numPlayersRequired: this.config.numPlayers,
			numBots: this.config.numBots,
			gameConfig: this.gameConfig
		};
	}

	addPlayer(player){
		if(this.game){
			this.log.notice('Can\'t add players when game is in progress');
			player.recieveMenuNotification({type: 'QUEUE_FULL'});
			return;
		}

		if(this.inactive){
			this.log.notice('Can\'t add players to an inactive queue');
			player.recieveMenuNotification({type: 'QUEUE_INACTIVE'});
			return;
		}

		this.log.notice('Player connected', player.id);

		this.players.push(player);
		player.queue = this;

		player.recieveQueueAction({type: 'QUEUE_ENTERED', qid: this.id});

		if(this.players.length >= this.config.numPlayers){
			this.startGame();
		}
		else{
			this.notifyPlayers();
		}
	}

	startGame(){
		if(this.game){
			this.log.error(new Error('Can\'t start a game, another one is already in progress'));
			return;
		}

		this.players.forEach((p) => {
			p.recieveQueueAction({type: 'QUEUE_READY'});
		});

		let players = this.players.slice();

		let numBots = this.config.numPlayers - players.length + this.config.numBots;
		if(numBots > 0 && this.config.bot){
			let randomNamesCopy = this.manager.randomNames.slice();

			for (let n = 0; n < numBots; n++) {
				let bot = new this.config.bot(randomNamesCopy);
				bot.queue = this;
				players.push(bot);
			}
		}

		this.game = new this.config.game(this, players, this.gameConfig);
		this.manager.games[this.game.id] = this.game;
		this.manager.removeQueueFromList(this);
		this.game.init();
	}

	startGameWithBots(){
		var numPlayers = this.config.numPlayers;
		this.config.numBots += numPlayers - this.players.length;
		this.config.numPlayers = this.players.length;
		this.type = 'botmatch';
		this.startGame();
	}

	endGame(voteResults){
		if(!this.game){
			console.error(new Error('No game to end'));
			return;
		}
		this.log.notice('Game ended');
		let results = {};
		if(voteResults){
			voteResults.forEach(r => results[r.pid] = r.type);
		}
		for(let i = this.players.length - 1; i >= 0; i--){
			let p = this.players[i];

			this.log.debug(p.id, 'voted', results[p.id] || 'no vote');

			if(!p.connected || !results[p.id] || results[p.id] != 'ACCEPT'){
				this.removePlayer(p, false);
			}
		}

		delete this.manager[this.game.id];
		this.game = null;

		if(!this.players.length){
			this.shutdown();
		}
		else if(this.players.length >= this.config.numPlayers){
			this.startGame();
		}
		else{
			this.manager.addQueueToList(this);
			this.notifyPlayers();
		}
	}

	shutdown(){
		if(!this.active){
			return;
		}
		this.log.notice('Shutting down');
		if(this.game){
			this.game.shutdown();
		}
		if(this.players.length){
			for(let i = this.players.length - 1; i >= 0; i--){
				this.removePlayer(this.players[i], false);
			}
		}
		this.active = false;
		this.manager.removeQueue(this);
	}

	notifyPlayers(){
		if(this.game){
			return;
		}
		this.players.forEach((p) => {
			p.recieveQueueAction({
				type: 'QUEUE_STATUS',
				playersQueued: this.players.length,
				playersNeeded: this.config.numPlayers,
				noResponse: true
			});
		});
		this.log.notice('Waiting for players:', this.config.numPlayers - this.players.length);
	}

	removePlayer(player, notify = true){
		if(player.game){
			this.log.warn('Cannot remove player in a game from queue', player.id, player.game.id);
			return;
		}
		if(!this.players.includes(player)){
			this.log.error(new Error(`Player isn't in this queue ${player.id}`));
			return;
		}

		let i = this.players.indexOf(player);
		this.players.splice(i, 1);
		player.queue = null;
		if(notify){
			player.recieveQueueAction({type: 'QUEUE_LEFT', instant: true});
			this.notifyPlayers();
		}
		this.log.notice('Player %s left queue', player.id, this.id);

		if(!this.players.length){
			this.shutdown();
		}
	}

	concedePlayer(player){
		let game = player.game;
		if(game){
			player.queue = null;
			game.players.concede(player);
			this.removePlayer(player, false);
		} 
		else{
			this.log.notice('Player %s isn\'t in a game, cannot concede', player.id);
		}
	}
} 

module.exports = Queue;