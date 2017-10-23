 'use strict';

/**
* @module
*/

/**
* Создает функции для вызова клиентами.
* @param  {Server} server сервер, которые вызвается клиентами
* @return {object<function>}        Копии функций, описанных ниже.
*/
module.exports = function(server){
	return {

		/**
		* Принимает выполненое действие от клиента
		* @param  {object} action действие
		*/
		recieveCompleteAction(action){
			if(!action){
				return;
			}
			let player = server.players[this.connection.id];
			if(player){
				player.sendResponse(action);
			}
		},

		/**
		* Принимает пустой ответ от клиента
		*/
		recieveResponse(){
			let player = server.players[this.connection.id];
			if(player){
				player.sendResponse();
			}
		},

		/**
		* Переподключает клиента к существующему экземпляру игрока
		* @param  {string} connId старый id клиента
		*/
		reconnectClient(connId){
			let newConnId = this.connection.id;
			let player = server.players[connId];

			// Переподключаем клиента, если экземпляр игрока:
			// 	отключен (может быть открыто несколько вкладок)
			// 	находится в игре
			// 	игра в процессе (не идет голосование за рестарт)

			if(player && !player.connected && player.game && player.game.isRunning){
				server.players[newConnId] = player;
				server.deletePlayer(connId);
				player.updateRemote(newConnId, server.clients[newConnId].remote);
			}
			// Иначе сообщаем игроку, что переподключиться нельзя
			else{
				let str = 'Can\'t reconnect ' + connId + ': ';
				if(!player){
					str += 'player not found';
				}
				else if(player.connected){
					str += 'player already connected';
				}
				else if(!player.game){
					str += 'player not in a game';
				}
				else if(!player.game.isRunning){
					str += 'game has ended';
				}
				server.log.notice(str);
				let newPlayer = server.players[newConnId];

				// Если новый игрок успел подключиться к чему-то до окончания подключения
				server.manager.freePlayer(newPlayer);

				// Сообщаем игроку, что переподключиться не удалось
				newPlayer.updateRemote();
			}
		},

		/**
		* Финализация переподключения игрока.
		* Запрашивает полную информацию об игре от игры и разрешает экземпляру
		* игрока передавать информацию от игры клиенту.
		*/
		requestGameInfo(){
			let player = server.players[this.connection.id];
			if(player){
				server.manager.reconnectPlayer(player);
			}
		},

		/**
		* Отправляет игроку список очередей.
		* @param  {number} page       страница очередей
		* @param  {number} pagination кол-во очередей на страницу
		*/
		requestQueueList(page, pagination, hideStarted){
			let player = server.players[this.connection.id];
			if(!player){
				return;
			}
			let action = server.manager.getQueueList(page, pagination, hideStarted);
			player.recieveMenuNotification(action);
		},

		/**
		* Передает менеджеру очередей информацию для создания новой очереди.
		* @param {Boolean} isPrivate   является ли очередь скрытой
		* @param {string}  gameMode    режим игры
		* @param {object}  queueConfig      конфигурация очереди
		* @param {object}  [gameRules] конфигурация игры
		*/
		createCustomQueue(isPrivate, gameMode, queueConfig, gameRules){
			let player = server.players[this.connection.id];
			if(!player){
				return;
			}
			server.manager.addCustomQueue(player, isPrivate, gameMode, queueConfig, gameRules);
		},

		/**
		* Подключает игрока к очереди по id.
		* @param  {string} id
		*/
		joinCustomQueue(id){
			let player = server.players[this.connection.id];
			if(player){
				server.manager.addPlayerToCustomQueue(player, id);
			}
		},

		/**
		* Добавляет игрока в очередь
		*/
		quickQueueUpClient(){
			let player = server.players[this.connection.id];
			if(player){
				server.manager.addPlayerToQuickQueue(player);
			}
		},

		/**
		* Сообщает менеджеру очередей, что нужно запустить очередь в которой находится игрок с ботами.
		*/
		voteForPrematureStart(){
			let player = server.players[this.connection.id];
			if(!player || !player.queue){
				return;
			}
			player.queue.voteForPrematureStart(player);
		},

		/**
		* Сообщает менеджеру, что нужно убрать игрока из игры.
		*/
		concedeClient(){
			let player = server.players[this.connection.id];
			if(player){
				server.manager.freePlayer(player);
			}
		},

		/**
		* Сообщает игре, в которой находится игрок, что курсор находится над картой с указанным id.
		* @param  {string} cid id карты
		*/
		hoverOverCard(cid){
			let player = server.players[this.connection.id];
			if(player && player.game){
				player.game.hoverOverCard(player, cid);
			}
		},

		/**
		* Сообщает игре, в которой находится игрок, что курсор больше не находится над картой с указанным id.
		* @param  {string} [cid] id карты
		*/
		hoverOutCard(cid){
			let player = server.players[this.connection.id];
			if(player && player.game){
				player.game.hoverOutCard(player, cid);
			}
		},

		changeClientName(name){
			server.changePlayerName(this.connection.id, name);
		}
	};
};
