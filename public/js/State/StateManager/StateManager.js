/**
* Менеджер состояний игры. 
* Позволяет переключаться между состояниями игры без ожидания следующего игрового кадра (синхронные состояния).  
* При использовании синхронных состояний, движок остается в последнем асинхронном состоянии, но все вызовы
* перенаправляются на новое синхронное состояние.
* @param {Phaser.Game} game игра
* @class 
* @extends {Phaser.StateManager}
* @see  {@link http://phaser.io/docs/2.6.2/Phaser.StateManager.html}
*/
var StateManager = function(game){
	Phaser.StateManager.call(this, game);

	/**
	* Синхронные состояния (в дополнение к `states`)
	* @type {Object}
	*/
	this.statesSync = {};

	/**
	* Текущее синхронное состояние игры. 
	* Считается реальным состоянием игры (выполнятся методы этого состояния).  
	* Чтобы узнать асинхронное состояние используется `current`.  
	* @type {string}
	*/
	this.currentSync = null;
};

extend(StateManager, Phaser.StateManager);

/**
* Текущее состояние (синхронное или асинхронное).  
* @return {State} Текущее состояние. 
*/
StateManager.prototype.getCurrent = function(){
	if(this.currentSync == this.current){
		return this.states[this.current];
	}
	else{
		return this.statesSync[this.currentSync];
	}
};

StateManager.prototype.getCurrentState = StateManager.prototype.getCurrent;

/**
* Добавляет асинхронное состояние в игру.
* @type {function}
*/
StateManager.prototype._addAsync = Phaser.StateManager.prototype.add;

/**
* Добавляет новое состояние в игру. 
* @param {State}   state   Состояние.
* @param {boolean} isAsync Является ли состояние асинхронным.
* @param {boolean} start   Нужно ли переходить к этому состоянию сразу.
*/
StateManager.prototype.add = function(state, isAsync, start){
	if(start){
		this.currentSync = state.key;
	}
	if(isAsync){
		this._addAsync(state.key, state, start);
	}
	else{
		this.statesSync[state.key] = state;
		if(start){
			this.change(state.key);
		}

	}
};

/**
* Меняет состояние игры. 
* Переходы к асинхронным состояниям плохо работают с ответами серверу и анимациями,
* поэтому такие переходы не рекомендуются и кидают предупреждение в консоль.
* @param {string} key название состояния
*/
StateManager.prototype.change = function(key){
	var oldState, state;

	if(this.states[key]){
		
		console.warn('StateManager: changing to async state', key);

		if(this.current != this.currentSync){
			state = this.statesSync[this.currentSync];
			state.shutdown();
			this.currentSync = key;
		}

		this.start(key, false, false);
	}
	else if(this.statesSync[key]){

		oldState = this.getCurrent();
		state = this.statesSync[key];

		oldState.shutdown();

		this.currentSync = key;

		state.preload();
		state.init();
		state.create();

		if(this.game.inDebugMode){
			console.log('StateManager: state changed to', key);
		}
	}
	else{
		console.error('StateManager: state not found', key);
	}
};
