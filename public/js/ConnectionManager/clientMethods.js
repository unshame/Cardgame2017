/**
* Методы, вызываемые сервером
* @namespace clientMethods
*/

/* exported clientMethods */
var clientMethods = {

	/**
	* Сервер передает id соединения и id и имя игрока.
	* @param {string} connId id соединения
	* @param {string} pid    id игрока
	* @param {string} name   стандартное имя игрока (PlayerX)
	*/
	setId: function(connId, pid, name){
		actionHandler.sequencer.finish(true);
		game.pid = pid;
		var oldId = gameOptions.get('connection_id');
		gameOptions.set('connection_id', connId);
		gameOptions.save();
		if(oldId){
			connection.proxy.reconnectClient(oldId);
		}
		else{
			connection.server.restoreClientName();
			connection.server.tryJoiningLinkedQueue();
		}
		if(name){
			ui.menus.name.setPlaceHolder(name);
		}
	},

	/**
	* Сервер передает id и имя игрока, если удалось преподключить игрока к игре.
	* @param {string} pid  id игрока
	* @param {string} name имя игрока
	*/
	updateId: function(pid, name){
		if(pid){
			if(connection.inDebugMode){
				console.log('Reconnected to', pid);
			}
			game.pid = pid;
			game.state.change('play');
			connection.proxy.requestGameInfo();
			if(name){
				ui.menus.name.updateName(name);
			}
			else{
				connection.server.restoreClientName();
			}
			return;
		}
		if(game.state.currentSync != 'menu'){
			game.state.change('menu');
		}		
		connection.server.restoreClientName();
		connection.server.tryJoiningLinkedQueue();
	},

	/**
	* Все остальные серверные события/действия передаются в виде объектов в {@link ActionHandler}.
	* @param  {object} action событие/действие
	*/
	recieveAction: function(action){
		if(connection.inDebugMode){
			console.log(action);
		}
		actionHandler.executeAction(action);
	}
};
