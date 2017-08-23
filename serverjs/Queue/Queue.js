'use strict';

const
	Log = require('../logger'),
	generateId = reqfromroot('generateId');


class Queue{
	constructor(manager, type, config){

		this.id = 'queue_' + generateId();

		this.log = Log(module, this.id, config.debug);

		this.game = null;
		this.manager = manager;
		this.type = type;
		this.config = config;
		this.gameConfig = config.gameConfig;
		this.gameConfig.debug = config.debug;
		this.players = [];
	}

	addPlayer(player){
		if(this.game){
			this.log.error(new Error('Can\'t add players when game is in progress'));
			return;
		}

		this.players.push(player);
		player.queue = this;

		if(this.players.length >= this.config.numPlayers){
			this.startGame();
		}
		else{
			this.notifyPlayers();
		}
	}

	startGame(){

		this.players.forEach((p) => {
			p.recieveQueueAction({type: 'QUEUE_FULL'});
		});

		let players = this.players.slice();

		let numBots = this.config.numPlayers - players.length + this.config.numBots;
		if(numBots > 0 && this.config.bot){
			let randomNamesCopy = this.manager.randomNames.slice();

			for (let n = 0; n < numBots; n++) {
				let bot = new this.config.bot(randomNamesCopy);
				players.push(bot);
			}
		}

		this.game = new this.config.game(this, players, this.gameConfig);
		this.manager.games[this.game.id] = this.game;
		this.game.init();
	}

	endGame(voteResults){
		if(!this.game){
			return;
		}
		let results = {};
		voteResults.forEach(r => results[r.pid] = r.type);
		for(let i = this.players.length - 1; i >= 0; i--){
			let p = this.players[i];
			this.log.notice(p.id, results[p.id]);
			if(!results[p.id] || results[p.id] != 'ACCEPT'){
				this.removePlayer(p, false);
				p.recieveQueueAction({type: 'LEFT_QUEUE', instant: true});
			}
		}

		delete this.manager[this.game.id];
		this.game = null;

		if(!this.players.length){
			this.shutdown();
		}
		else{
			this.notifyPlayers();
		}
	}

	shutdown(){
		if(this.players.length){
			for(let i = this.players.length - 1; i >= 0; i--){
				this.removePlayer(this.players[i], false);
			}
		}
		this.manager.removeQueue(this);
	}

	notifyPlayers(){
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
			player.recieveQueueAction({type: 'LEFT_QUEUE', instant: true});
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
			this.log.notice('Player %s disconnected from game %s', player.id, game.id);
			this.removePlayer(player, false);
		} 
		else{
			this.log.warn('Player %s isn\'t in a game, cannot concede', player.id);
		}
	}
} 

module.exports = Queue;