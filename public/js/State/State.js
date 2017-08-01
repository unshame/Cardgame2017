/**
 * Состояние игры. 
 * Предоставляет методы, выполняющиеся при апдейте, ресайзе, а также
 * при переключении между состояниями игры.  
 * Основные методы (используются во всех состояниях): `{@link State#update|update}, {@link State#preRender|preRender}, {@link State#render|render}, {@link State#create|create}, {@link State#shutdown|shutdown}, {@link State#postResize|postResize}`  
 * Методы, связанные с паузой симуляции игры (используются во всех состояниях): `{@link State#paused|paused}, {@link State#resumed|resumed}, {@link State#postResumed|postResumed}`  
 * Второстепенные методы (используются в асинхронных состояниях): `{@link State#loadUpdate|loadUpdate}, {@link State#loadRender|loadRender}, {@link State#preload|preload}, {@link State#init|init}`  
 * Неиспользуемые методы (присутствуют, но не вызываются): `resize, pauseUpdate`  
 * @class
 * @param {string} key    название состояния
 * @param {object} events методы состояния
 * @extends {Phaser.State}
 * @see  {@link http://phaser.io/docs/2.6.2/Phaser.State.html}
 */
var State = function(key, events){
	Phaser.State.call(this);

	/**
	 * Название состояния.
	 * @type {string}
	 */
	this.key = key;
	
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

// Методы перенаправляют вызовы из асинхронного состояния в синхронное
State.prototype.render = function(){
	if(game.state.current == game.state.currentSync){
		this._render();
	}
	else{
		game.state.getCurrent()._render();
	}
};
State.prototype._render = function(){};

State.prototype.preRender = function(){
	if(game.state.current == game.state.currentSync){
		this._preRender();
	}
	else{
		game.state.getCurrent()._preRender();
	}
};
State.prototype._preRender = function(){};

State.prototype.update = function(){
	if(game.state.current == game.state.currentSync){
		this._update();
	}
	else{
		game.state.getCurrent()._update();
	}
};
State.prototype._update = function(){};

State.prototype.paused = function(){
	if(game.state.current == game.state.currentSync){
		this._paused();
	}
	else{
		game.state.getCurrent()._paused();
	}
};
State.prototype._paused = function(){};

State.prototype.resumed = function(){
	if(game.state.current == game.state.currentSync){
		this._resumed();
	}
	else{
		game.state.getCurrent()._resumed();
	}
};
State.prototype._resumed = function(){};

// Дополнительные методы, не пресутствовавшие в Phaser.State
State.prototype.postResize = function(){};
State.prototype.postResumed = function(){};

//@include:stateBoot
//@include:statePlay
//@include:stateMenu


/**
* Во всех состояниях выполняется сразу после переключения в состояние (до preload).
* @method State#init
*/

/**
* В асинхронных состояниях выполняется после init и начинает загрузку ассетов.
* В синхронных состояниях выполняется сразу после переключения в состояние (после вызова init).
* @method State#preload
*/

/**
* В асинхронных состояниях выполняется после загрузки всех элементов в preload.  
* В синхронных состояниях выполняется сразу после переключения в состояние (после вызова init и preload).
* @method State#create
*/

/**
* Во всех состояниях выполняется сразу после переключения на другое состояние (до init нового состояния).
* @method State#shutdown
*/


/**
* Во всех состояниях выполняется, когда симуляция игры была поставлена на паузу.
* @method State#paused
*/

/**
* Во всех состояниях выполняется, когда симуляция игры была снята с паузы.
* @method State#resumed
*/

/**
* Во всех состояниях выполняется через секунду после того, как симуляция игры была снята с паузы.
* @method State#postResumed
*/


/**
* Во всех состояниях выполняется после окончания изменения размера игры.
* @method State#postResize
*/


/**
* Во всех состояниях выполняется после update, но перед render.
* @method State#preRender
*/

/**
* Во всех состояниях выполняется после того, как все элементы игры были выведены на экран.
* @method State#render
*/


/**
* В асинхронных состояниях выполняется во время загрузки элементов в preload после loadUpdate.
* В синхронных состояниях не выполняется.
* @method State#loadRender
*/

/**
* В асинхронных состояниях выполняется во время загрузки элементов в preload.
* В синхронных состояниях не выполняется.
* @method State#loadUpdate
*/


/**
* Выпоняется каждый кадр игры между preUpdate и postUpdate всех элементов игры
* как в синхронных, так и в асинхронных состояниях.
* @method State#update
*/