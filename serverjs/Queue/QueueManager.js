'use strict';

const 
	Log = require('../logger'),
	Queue = reqfromroot('Queue/Queue');
	//Tests = reqfromroot('Tests/GameTest');

class QueueManager{
	
	constructor(server, quickConfig){
		this.server = server;

		this.log = Log(module, null, quickConfig.debug);

		this.quickQueueConfig = quickConfig;

		this.games = {};
		this.queues = {};
		this.queueList = [];

		this.quickQueues = [];

		// Случайные имена ботов
		this.randomNames = ['Lynda','Eldridge','Shanita','Mickie','Eileen','Hiedi','Shavonne','Leola','Arlena','Marilynn','Shawnna','Alanna','Armando','Julieann','Alyson','Rutha','Wilber','Marty','Tyrone','Mammie','Shalon','Faith','Mi','Denese','Flora','Josphine','Christa','Sharonda','Sofia','Collene','Marlyn','Herma','Mac','Marybelle','Casimira','Nicholle','Ervin','Evia','Noriko','Yung','Devona','Kenny','Aliza','Stacey','Toni','Brigette','Lorri','Bernetta','Sonja','Margaretta', 'Johnny Cocksucker III'];
	}

	getQueueList(page){
		let list = [];
		if(typeof page != 'number' || isNaN(page)){
			page = 0;
		}
		let pageLength = 10;
		let skip = page * pageLength;
		if(skip >= this.queueList.length){
			skip = Math.max(skip - pageLength, 0);
		}
		let moreBefore = (skip > 0);
		let moreAfter = false;
		for(let i = 0, len = this.queueList.length; i < len; i++){
			if(skip > 0){
				skip--;
				continue;
			}
			if(pageLength <= 0){
				if(this.queueList[i + 1]){
					moreAfter = true;
				}
				break;
			}
			let queue = this.queueList[i];
			list.push(queue.info);
			pageLength--;
		}

		return {list, moreBefore, moreAfter};
	}

	/**
	* СОздает очередь с заданными настройками и добавляет в нее игрока.
	* @param {Player} player       игрок
	* @param {string} gameMode     режим игры
	* @param {object} config       настройки очереди
	* @param {object} [gameConfig] настройки игры
	*/
	addCustomQueue(player, isPrivate, gameMode, config, gameConfig){
		if(player.queue || player.game){
			return;
		}
		if(!config || typeof config != 'object'){
			player.recieveMenuNotification({type: 'QUEUE_INVALID'});
			return;
		}
		if(!this.server.gameModes.hasOwnProperty(gameMode)){
			player.recieveMenuNotification({type: 'QUEUE_INVALID'});
			return;
		}
		let gameClass = this.server.gameModes[gameMode];
		config.game = gameClass[0];
		config.bot = gameClass[1];
		config.debug = this.server.params.debug;
		if(!gameConfig || typeof gameConfig != 'object'){
			gameConfig = {};
		}
		config.gameConfig = gameConfig;

		let queue = this.addQueue(isPrivate ? 'private' : 'custom', config);
		queue.addPlayer(player);
	}

	addPlayerToCustomQueue(player, qid){
		if(this.queues.hasOwnProperty(qid)){
			this.queues[qid].addPlayer(player);
		}
		else{
			player.recieveMenuNotification({type: 'QUEUE_INACTIVE'});
		}
	}

	/**
	 * Создает очередь со стандартными настройками и добавляет в нее игрока.
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
		config = Object.assign({}, config);
		config.gameConfig = Object.assign({}, config.gameConfig);
		let queue = new Queue(this, type, config);
		this.queues[queue.id] = queue;
		this.addQueueToList(queue);

		if(type == 'quick'){
			this.quickQueues.push(queue);
		}
		return queue;
	}

	addQueueToList(queue){
		let i = this.queueList.indexOf(queue);
		if(!~i && queue.type != 'private' && queue.type != 'botmatch'){
			this.queueList.unshift(queue);
		}
	}

	removeQueue(queue){
		if(!this.queues[queue.id]){
			return;
		}
		this.removeQueueFromList(queue);
		delete this.queues[queue.id];
		let i = this.quickQueues.indexOf(queue);
		if(~i) {
			this.quickQueues.splice(i, 1);
		}
	}

	removeQueueFromList(queue){
		let i = this.queueList.indexOf(queue);
		if(~i){
			this.queueList.splice(i, 1);
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
			this.log.notice(`Player has no queue ${player.id}`);
		}
	}

	removePlayerFromQueue(player){
		let queue = player.queue;
		if(queue){
			queue.removePlayer(player);
		}
		else{			
			this.log.notice(`Player has no queue ${player.id}`);
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