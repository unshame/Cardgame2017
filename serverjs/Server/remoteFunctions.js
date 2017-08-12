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
				let player = server.players[newConnId];
				player.connected = true;
				player.updateRemote();
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
				player.connected = true;
				if(player.game){
					player.game.players.reconnect(player);
				}
			}
		},

		/**
		 * Добавляет игрока в очередь
		 */
		queueUp: function(){
			let player = server.players[this.connection.id];
			if(player){
				if(player.game){
					server.log.notice('Player %s already in game %s', player.id, player.game.id);
					server.exports.requestGameInfo.call(this);
					return;
				}
				if(server.newPlayers.includes(player)){
					server.log.notice('Player %s already in queue', player.id);
					return;
				}
				server.addPlayerToQueue(player);
			}
		},

		disconnectClient: function(){
			let player = server.players[this.connection.id];
			if(!player)
				return;
			let game = player.game;
			if(game){
				game.players.disconnect(player);
				server.log.notice('Player %s disconnected from game %s', player.id, game.id);
			}
			else if(server.newPlayers.includes(player)){
				server.newPlayers.splice(server.newPlayers.indexOf(player), 1);
				player.recieveNotification({message: 'LEFT_QUEUE', noResponse: true});
				server.log.notice('Player %s left queue', player.id);
				server.updateQueueStatus();
			}
			else{
				server.log.warn('Player %s isn\'t in a game, cannot disconnect', player.id);
			}
		}
	};
};
