/**
* Модуль, отвечает за общение между клиентом и сервером.
* Основан на Eureca.Client.
* По готовности клиента, меняет статус игры на `play`.
* @class
*/

var ConnectionManager = function(inDebugMode){

	/**
	* A nodejs transparent bidirectional RPC.
	* @external Eureca
	* @version 0.7.1
	* @see {@link http://eureca.io/}
	*/
	Eureca.Client.call(this);

	this.proxy = null;
	this.server = window.serverMethods;
	this.exports = window.clientMethods;

	this.on('ready', this.bindProxy.bind(this));
	this.on('connect', this.handleConnection.bind(this));
	this.on('connectionLost', this.handleConnectionLoss.bind(this));
	this.on('connectionRetry', this.handleConnectionRetry.bind(this));
	this.on('disconnect', this.handleConnectionLoss.bind(this));
	this.on('error', this.handleError.bind(this));

	this.responseTimer = null;
	this.inDebugMode = inDebugMode || false;
};

ConnectionManager.prototype = Object.create(Eureca.Client.prototype);
ConnectionManager.prototype.constructor = ConnectionManager;

ConnectionManager.prototype.bindProxy = function(proxy){
	console.log('Ready');
	this.proxy = proxy;
	game.state.start('play');
};

ConnectionManager.prototype.handleConnection = function(){
	console.log('Connected');
};

ConnectionManager.prototype.handleConnectionLoss = function(){
	console.log('Lost connection');
};

ConnectionManager.prototype.handleConnectionRetry = function(){
	console.log('Retrying connection');
};

ConnectionManager.prototype.handleDisconnection = function(){
	console.log('Disconnected');
};

ConnectionManager.prototype.handleError = function(){
	console.log('Error');
};

ConnectionManager.prototype.resetTimer = function(){
	if(this.responseTimer){
		clearTimeout(this.responseTimer);
		this.responseTimer = null;
	}
};
