/**
* Модуль, отвечает за общение между клиентом и сервером.
* Основан на Eureca.Client.
* По готовности клиента, меняет статус игры на `menu`.
* @class
* @extends {Eureca.Client}
*/

var ConnectionManager = function(serverMethods, clientMethods, connectState, inDebugMode){
	/**
	* A nodejs transparent bidirectional RPC.
	* @external Eureca
	* @version 0.7.1
	* @see {@link http://eureca.io/}
	*/
	Eureca.Client.call(this, {
		autoConnect: false
	});

	this.proxy = null;
	this.server = serverMethods;
	this.exports = clientMethods;
	this.connectState = connectState;

	this.inDebugMode = inDebugMode || false;

	this.hasConnected = false;

	this.serverWaiting = false;
};

extend(ConnectionManager, Eureca.Client);

ConnectionManager.prototype.initialize = function(){
	this.on('ready', this.bindProxy.bind(this));
	this.on('connect', this.handleConnection.bind(this));
	this.on('connectionLost', this.handleConnectionLoss.bind(this));
	this.on('connectionRetry', this.handleConnectionRetry.bind(this));
	this.on('disconnect', this.handleConnectionLoss.bind(this));
	this.on('error', this.handleError.bind(this));
	this.connect();
};

ConnectionManager.prototype.bindProxy = function(proxy){
	this.proxy = proxy;
	game.state.change(this.connectState);
};

ConnectionManager.prototype.handleConnection = function(){
	if(this.hasConnected){
		ui.feed.newMessage('Connected to server', 2000);
	}
	else{
		this.hasConnected = true;
	}
};

ConnectionManager.prototype.handleConnectionLoss = function(){
	ui.feed.newMessage('Lost connection to server', 2000);
};

ConnectionManager.prototype.handleConnectionRetry = function(){
	ui.feed.newMessage('Retrying connection to server', 2000);
};

ConnectionManager.prototype.handleDisconnection = function(){
	ui.feed.newMessage('Disconnected from server', 2000);
};

ConnectionManager.prototype.handleError = function(){
	ui.feed.newMessage('Server connection error', 2000);
};

//@include:clientMethods
//@include:serverMethods