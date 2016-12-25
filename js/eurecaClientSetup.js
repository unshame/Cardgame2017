var Server;
var ready = false;
var found = false;

var EurecaClientSetup = function() {
	//create an instance of eureca.io client

	var Client = new Eureca.Client();
	
	Client.ready(function (proxy) {		
		Server = proxy;
	});
	
	
	//methods defined under "exports" namespace become available in the server side
	
	Client.exports.setId = function(id) 
	{
		//create() is moved here to make sure nothing is created before uniq id assignation
		if(typeof myId != 'undefined'){
			location.href = location.href;
			return
		}
		Object.defineProperty(window, 'myId', {
		    value: id,
		    writable : false,
		    enumerable : true,
		    configurable : false
		});
		create();
		Server.handshake(id);
		ready = true;
	}	
	Client.exports.removePlayer = function(id)
	{	
		if (charactersList[id]) charactersList[id].kill();
	}	
	
	Client.exports.spawnOpponent = function(options)
	{
		//console.log(options);
		if (options.id == myId) 
			return; //this is me
		var char = new Character(options);
		charactersList[options.id] = char;
	}
	
	Client.exports.updateState = function(id, state)
	{
		if (charactersList[id])  {
			charactersList[id].input = state;
			charactersList[id].update();
		}
	}
}
