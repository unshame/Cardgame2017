'use strict';

const 
	Log = require('../logger'),
	Queue = reqfromroot('Queue/Queue');

class QueueManager{
	
	/**
	* Менеджер очередей и игр.
	* @param  {Server} server      сервер
	* @param  {object} quickConfig настройки быстрой игры
	*/
	constructor(server, quickConfig, quickRules){

		/**
		* Сервер.
		* @type {Server}
		*/
		this.server = server;

		/**
		* Логгер.
		* @type {winston.Logger}
		*/
		this.log = Log(module, null, quickConfig.debug);

		/**
		* Настройки быстрой игры.
		* @type {object}
		*/
		this.quickQueueConfig = quickConfig;


		this.quickQueueRules = quickRules;

		/**
		* Запущенные игры.
		* @type {Object}
		*/
		this.games = {};

		/**
		* Все очереди.
		* @type {Object}
		*/
		this.queues = {};

		/**
		* Очереди, в которые могут подключаться игроки (с `type` не равным `private` или `botmatch`).  
		* На время прохождения игр очереди убираются из этого списка.
		* @type {Array}
		*/
		this.queueList = [];

		this.queueListAll = [];

		/**
		* Очереди быстрой игры, в которые могут подключаться игроки (с `type` равным `quick`).  
		* На время прохождения игр быстрые очереди убираются из этого списка.
		* @type {Array}
		*/
		this.quickQueues = [];

		/**
		* Случайные имена ботов.
		* @type {Array}
		*/
		this.randomNames = ['John Snow','Gandalf','Joel','Ellie','Batman','Joker','Yoh','Geralt','Cirilla','Triss','Yennefer','Harry','Hermione','Ron','Arya','Sherlock','Neo','Marty McFly','Chester','Jodie','Aiden','Aloy','The Doctor','Severus','Alan','Regis','Nemo','Dio','Jesse','Heisenberg','Merlin','House M.D.','Bilbo','Legolas','Strider','Aragorn','Frodo','Sam','Merry','Pippin','Tess','Kenny','Ted','Barney','Marshall','Robin','Lily','Oleg','Sergey','Georgy','Talion', 'Johnny C.','Carl','Jotaro','Ken','Vanilla Ice','Zepelli','A Pig','Angela','Nataniel','Magnus','Leman','Malcador'];
	}

	/**
	* Возвращает список с информацией о существующих очередях.
	* @param {number}  page            номер страницы очередей
	* @param {number}  [pagination=10] во очередей на странице
	* @param {boolean} [hideStarted]   не добавлять очереди с начатыми играми
	*
	* @return {object[]} Возвращает массив с объектами с информацией об очередях.
	*/
	getQueueList(page, pagination, hideStarted){
		let list = [];

		if(typeof page != 'number' || isNaN(page) || page < 0){
			page = 0;
		}

		if(typeof pagination != 'number' || isNaN(pagination) || pagination <= 0 || pagination > 10){
			pagination = 10;
		}

		let pageLength = pagination;
		let queueList = hideStarted ? this.queueList : this.queueListAll;

		// Сколько элементов нужно будет пропустить
		let skip = page * pageLength;
		if(skip >= queueList.length){
			skip = Math.max(queueList.length - pageLength, 0);
			page = Math.max(queueList.length/pageLength, 1) - 1;
		}

		// Есть ли элементы перед и после текущей страницы
		let moreBefore = (skip > 0);
		let moreAfter = false;

		for(let i = 0, len = queueList.length; i < len; i++){

			// Пропускаем заданное кол-во элементов
			if(skip > 0){
				skip--;
				continue;
			}

			// Мы выбрали достаточное кол-во элементов
			if(pageLength <= 0){
				// Указываем, что есть элемент после последнего добавленного			
				moreAfter = true;
				break;
			}

			let queue = queueList[i];
			list.push(queue.info);

			pageLength--;
		}

		return {type: 'QUEUE_LIST', list, moreBefore, moreAfter, page, pagination};
	}

	/**
	* Создает очередь с заданными настройками и добавляет в нее игрока.
	* @param {Player} player      игрок
	* @param {string} gameMode    режим игры
	* @param {object} queueConfig настройки очереди
	* @param {object} [gameRules] настройки игры
	*/
	addCustomQueue(player, isPrivate, gameMode, queueConfig, gameRules){
		if(player.queue || player.game){
			return;
		}

		if(!queueConfig || typeof queueConfig != 'object'){
			player.recieveMenuNotification({type: 'QUEUE_INVALID'});
			return;
		}

		if(!this.server.gameModes.hasOwnProperty(gameMode)){
			player.recieveMenuNotification({type: 'QUEUE_INVALID'});
			return;
		}

		let gameClass = this.server.gameModes[gameMode];
		queueConfig.game = gameClass[0];
		queueConfig.bot = gameClass[1];
		queueConfig.debug = this.server.params.debug;
		queueConfig.name = player.name + '\'s Game';

		if(!gameRules || typeof gameRules != 'object'){
			gameRules = {};
		}

		let queue = this.addQueue(
			isPrivate ? 'private' : 'custom',
			queueConfig,
			gameRules
		);
		queue.addPlayer(player);
	}

	/**
	* Добавляет игрока в очередь по id очереди.
	* @param {Player} player игрок
	* @param {string} qid    id очереди
	*/
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
		let playerIsBusy = this.playerIsBusy(player);

		// Проверяем, не занят ли игрок уже
		if(playerIsBusy){
			if(playerIsBusy === QueueManager.PLAYER_STATUS.IN_GAME){
				this.reconnectPlayer(player);
			}
			return;
		}

		// Находим или создаем незаполненную быструю очередь
		let queue = this.quickQueues[0];
		if(!queue){
			queue = this.addQueue('quick', this.quickQueueConfig, this.quickQueueRules);
		}

		queue.addPlayer(player);
	}

	/**
	* Создает и добавляет новую очередь.
	* @param {string} type   Тип очереди.
	*                        Значения: `'quick', 'custom', 'private', 'botmatch'`
	* @param {object} config Конфигурация очереди.
	*
	* @return {Queue} Возвращает созданную очередь.
	*/
	addQueue(type, config, rules){
		config = Object.assign({}, config);
		rules = Object.assign({}, rules);

		config.decisionTime = this.server.params.decisionTime;

		let queue = new Queue(this, type, config, rules);

		this.queues[queue.id] = queue;
		this.addQueueToList(queue);

		return queue;
	}

	/**
	* Добавляет очередь в список очередей, к которым можно присоединиться.
	* @param {Queue} queue
	*/
	addQueueToList(queue){
		// Добавляем очередь в общий список
		if(queue.type != 'private' && queue.type != 'botmatch'){
			let i = this.queueList.indexOf(queue);
			if(!~i){
				this.queueList.unshift(queue);
			}

			i = this.queueListAll.indexOf(queue);
			if(!~i){
				this.queueListAll.unshift(queue);
			}
		}

		// Добавляем очередь в список быстрых игр
		let i = this.quickQueues.indexOf(queue);
		if(!~i && queue.type == 'quick'){
			this.quickQueues.push(queue);
		}
	}

	/**
	* Удаляет очередь из менеджера.
	* @param  {Queue} queue
	*/
	removeQueue(queue){
		if(!this.queues[queue.id]){
			return;
		}
		this.removeQueueFromList(queue);
		delete this.queues[queue.id];
	}

	/**
	* Удаляет очередь из списка очередей к которым можно присоединиться.
	* @param  {Queue} queue
	*/
	removeQueueFromList(queue, inProgress){
		// Убираем очередь из общего списка
		let i = this.queueList.indexOf(queue);
		if(~i){
			this.queueList.splice(i, 1);
		}

		if(!inProgress){
			i = this.queueListAll.indexOf(queue);
			if(~i){
				this.queueListAll.splice(i, 1);
			}
		}


		// Убираем очередь из списка быстрых игр
		i = this.quickQueues.indexOf(queue);
		if(~i) {
			this.quickQueues.splice(i, 1);
		}
	}

	/**
	* Устанавливает статус соединения игрока на `false` и возвращает `false`, 
	* если игро находится в игре, либо убирает игрока из очереди и возвращает `true`,
	* если игрок не находится в игре.
	* @param {Player} player
	*
	* @return {boolean} Возвращает нужно ли удалить игрока.
	*/
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

	/**
	* Удаляет игрока из игры.
	* @param  {Player} player
	*/
	concedePlayer(player){
		let queue = player.queue;
		if(queue){
			queue.concedePlayer(player);
		}
		else{
			this.log.notice(`Player has no queue ${player.id}`);
		}
	}

	/**
	* Удаляет игрока из очереди.
	* @param  {Player} player
	*/
	removePlayerFromQueue(player){
		let queue = player.queue;
		if(queue){
			queue.removePlayer(player);
		}
		else{			
			this.log.notice(`Player has no queue ${player.id}`);
		}
	}

	freePlayer(player){
		let playerStatus = this.playerIsBusy(player, true);
		if(playerStatus === QueueManager.PLAYER_STATUS.IN_GAME){
			this.concedePlayer(player);
		}
		else if(playerStatus === QueueManager.PLAYER_STATUS.IN_QUEUE){
			this.removePlayerFromQueue(player);
		}
	}

	/**
	* Возвращает статус игрока.
	* @param  {Player} player 
	* @param {boolean} [silent=false] убирает вывод статуса в консоль
	* @return {QueueManager.PLAYER_STATUS}        
	*/	
	playerIsBusy(player, silent = false){
		if(player.game){
			if(!silent){
				this.log.notice('Player %s already in game %s', player.id, player.game.id);
			}
			return QueueManager.PLAYER_STATUS.IN_GAME;
		}
		if(player.queue){
			if(!silent){
				this.log.notice('Player %s already in queue', player.id, player.queue.id);
			}
			return QueueManager.PLAYER_STATUS.IN_QUEUE;
		}
		return QueueManager.PLAYER_STATUS.FREE;
	}

	/**
	* Переподсоединяет игрока к игре.
	* @param  {Player} player
	*/
	reconnectPlayer(player){
		player.connected = true;
		if(player.game){
			player.game.players.reconnect(player);
		}
	}
} 

/**
* Статус игрока.
* @enum {number}
*/
QueueManager.PLAYER_STATUS = {
	/** Игрок свободен. */
	FREE: 0,

	/** Игрок в очереди. */
	IN_QUEUE: 1,

	/** Игрок в игре. */
	IN_GAME: 2
};

/**
* {@link QueueManager}
* @module
*/
module.exports = QueueManager;
