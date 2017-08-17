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
		recieveCompleteAction: function(action){
			if(!action)
				return;
			let player = server.players[this.connection.id];
			if(player){
				player.sendResponse(action);
			}
		},

		/**
		 * Принимает пустой ответ от клиента
		 */
		recieveResponse: function(){
			let player = server.players[this.connection.id];
			if(player){
				player.sendResponse();
			}
		},

		/**
		 * Переподключает клиента к существующему экземпляру игрока
		 * @param  {string} connId старый id клиента
		 */
		reconnectClient: function(connId){
			let newConnId = this.connection.id;
			let player = server.players[connId];

			// Переподключаем клиента, если экземпляр игрока:
			// 	отключен (может быть открыто несколько вкладок)
			// 	находится в игре
			// 	игра в процессе (не идет голосование за рестарт)

			if(player && !player.connected && player.game && player.game.isRunning){
				server.players[newConnId] = player;
				delete server.players[connId];
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
				newPlayer.connected = true;
				newPlayer.updateRemote();
			}
		},

		/**
		 * Финализация переподключения игрока.
		 * Запрашивает полную информацию об игре от игры и разрешает экземпляру
		 * игрока передавать информацию от игры клиенту.
		 */
		requestGameInfo: function(){
			let player = server.players[this.connection.id];
			if(player){
				server.manager.reconnectPlayer(player);
			}
		},

		/**
		 * Добавляет игрока в очередь
		 */
		quickQueueUpClient: function(){
			let player = server.players[this.connection.id];
			server.log.notice(player.type, player.id);
			if(player){
				server.manager.addPlayerToQuickQueue(player);
			}
		},

		concedeClient: function(){
			let player = server.players[this.connection.id];
			if(player){
				server.manager.concedePlayer(player);
			}
		}
	};
};
