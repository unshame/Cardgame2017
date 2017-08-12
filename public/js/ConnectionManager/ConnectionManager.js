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

	this.responseTimer = null;
	this.inDebugMode = inDebugMode || false;

	this.hasConnected = false;
};

ConnectionManager.prototype = Object.create(Eureca.Client.prototype);
ConnectionManager.prototype.constructor = ConnectionManager;

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
		feed.newMessage('Connected to server', 2000);
	}
	else{
		this.hasConnected = true;
	}
};

ConnectionManager.prototype.handleConnectionLoss = function(){
	feed.newMessage('Lost connection to server', 2000);
};

ConnectionManager.prototype.handleConnectionRetry = function(){
	feed.newMessage('Retrying connection to server', 2000);
};

ConnectionManager.prototype.handleDisconnection = function(){
	feed.newMessage('Disconnected from server', 2000);
};

ConnectionManager.prototype.handleError = function(){
	feed.newMessage('Server connection error', 2000);
};

ConnectionManager.prototype.resetTimer = function(){
	if(this.responseTimer){
		clearTimeout(this.responseTimer);
		this.responseTimer = null;
	}
};

//@include:clientMethods
//@include:serverMethods