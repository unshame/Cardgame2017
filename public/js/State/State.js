var State = function(key, events){
	Phaser.State.call(this);
	this.key = key;
	this.callback = null;
	for(var e in events){
		if(!events.hasOwnProperty(e))
			continue;
		var event = events[e]; 
		if(typeof event == 'function'){
			if(typeof this['_' + e] == 'function'){
				this['_' + e] = event;
			}
			else{
				this[e] = event;
			}
		}
	}
};

State.prototype = Object.create(Phaser.State.prototype);
State.prototype.constructor = State;

State.prototype.init = function(callback, context){
	this._init();
	if(callback){
		this.callback = callback.bind(context);
	}
};

State.prototype.create = function(){
	this._create();
	if(typeof this.callback == 'function'){
		this.callback();
		this.callback = null;
	}
};

State.prototype._init = function(){};

State.prototype._create = function(){};

State.prototype.postResize = function(){};

//@include:stateBoot
//@include:statePlay
//@include:stateMenu
