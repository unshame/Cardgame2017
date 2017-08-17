'use strict';

const 
	Log = require('../logger'),
	Queue = requirejs('Queue/Queue');
	//Tests = requirejs('Tests/GameTest');

class QueueManager{
	
	constructor(server, quickConfig){
		this.server = server;

		this.log = Log(module, null, quickConfig.debug);

		this.quickQueueConfig = quickConfig;

		this.games = {};
		this.queues = {};

		this.quickQueues = [];

		// Случайные имена ботов
		this.randomNames = ['Lynda','Eldridge','Shanita','Mickie','Eileen','Hiedi','Shavonne','Leola','Arlena','Marilynn','Shawnna','Alanna','Armando','Julieann','Alyson','Rutha','Wilber','Marty','Tyrone','Mammie','Shalon','Faith','Mi','Denese','Flora','Josphine','Christa','Sharonda','Sofia','Collene','Marlyn','Herma','Mac','Marybelle','Casimira','Nicholle','Ervin','Evia','Noriko','Yung','Devona','Kenny','Aliza','Stacey','Toni','Brigette','Lorri','Bernetta','Sonja','Margaretta', 'Johnny Cocksucker III'];
	}

	/**
	 * Добавляет игрока в очередь и запускает игру, если очередь заполнена
	 * @param {Player} player игрок
	 */
	addPlayerToQuickQueue(player){

		if(!this.playerIsFree(player)){
			return;
		}

		let queue;
		for(let i = 0; i < this.quickQueues.length; i++){
			if(!this.quickQueues[i].game){
				queue = this.quickQueues[i];
				break;
			}
		}
		if(!queue){
			queue = this.addQueue('quick', this.quickQueueConfig);
		}
		queue.addPlayer(player);
	}

	addQueue(type, config){
		let queue = new Queue(this, type, config);
		this.queues[queue.id] = queue;
		if(type == 'quick'){
			this.quickQueues.push(queue);
		}
		return queue;
	}

	removeQueue(queue){
		if(!this.queues[queue.id]){
			return;
		}
		delete this.queues[queue.id];
		let i = this.quickQueues.indexOf(queue);
		if(~i) {
			this.quickQueues.splice(i, 1);
		}
	}

	disconnectPlayer(player){
		let game = player.game;
		let queue = player.queue;
		// Если игрок не находится в игре, удаляем его
		if(!game){
			if(queue){
				queue.removePlayer(player);
			}
			return true;
		}
		// иначе устанавливаем отключенный статус
		else{
			player.connected = false;
			return false;
		}
	}

	concedePlayer(player){
		let queue = player.queue;
		if(queue){
			queue.concedePlayer(player);
		}
		else{
			this.log.error('Player has no queue', player.id);
		}
	}

	removePlayerFromQueue(player){
		let queue = player.queue;
		if(queue){
			queue.removePlayer(player);
		}
	}

	playerIsFree(player){
		if(player.game){
			this.log.notice('Player %s already in game %s', player.id, player.game.id);
			this.reconnectPlayer(player);
			return false;
		}
		if(player.queue){
			this.log.notice('Player %s already in queue', player.id, player.queue.id);
			this.reconnectPlayer(player);
			return false;
		}
		return true;
	}

	reconnectPlayer(player){
		player.connected = true;
		if(player.game){
			player.game.players.reconnect(player);
		}
	}


} 

module.exports = QueueManager;