var Server;

var EurecaClientSetup = function() {
	//create an instance of eureca.io client

	var Client = new Eureca.Client();
	
	Client.ready(function (proxy) {		
		Server = proxy;
	});
	
	
	//methods defined under "exports" namespace become available in the server side
	
	Client.exports.setId = function(id) 
	{
		window.myId = id;
		create();
	}	
	Client.exports.meetOpponents = function(opponents){
		console.log(opponents);
		for(var oi in opponents){
			new Character(opponents[oi].id);
		}
		
	}
	Client.exports.recievePossibleActions = function(actions){		
		console.log(actions)
	}
	Client.exports.recieveAction = function(action){		
		console.log(action)
	}
	Client.exports.handleLateness = function(){
		console.log('Too late');
	}
}
