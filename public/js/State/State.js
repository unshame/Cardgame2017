/**
 * Состояние игры. 
 * Предоставляет методы, выполняющиеся при апдейте, ресайзе, а также
 * при переключении между состояниями игры.  
 * Основные методы (используются в синхронных и асинхронных состояниях): `update, render, create, shutdown, postResize`  
 * Второстепенные методы (используются в асинхронных состояниях): `loadUpdate, loadRender, preRender, preload, init`  
 * Дополнительные методы (не используются): `resize, resumed, paused`  
 * @class
 * @param {string} key    название состояния
 * @param {object} events методы состояния
 * @extends {Phaser.State}
 * @see  {@link http://phaser.io/docs/2.6.2/Phaser.State.html}
 */
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

State.prototype.render = function(){
	if(game.state.current == game.state.currentSync){
		this._render();
	}
	else{
		game.state.getCurrent()._render();
	}
};
State.prototype._render = function(){};

State.prototype.update = function(){
	if(game.state.current == game.state.currentSync){
		this._update();
	}
	else{
		game.state.getCurrent()._update();
	}
};
State.prototype._update = function(){};


State.prototype.postResize = function(){
	if(game.state.current == game.state.currentSync){
		this._postResize();
	}
	else{
		game.state.getCurrent()._postResize();
	}
};
State.prototype._postResize = function(){};

//@include:stateBoot
//@include:statePlay
//@include:stateMenu
