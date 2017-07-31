/**
* Модуль, работающий с движком игры и инициализирующий все остальные модули
* @param {number} [speed=1] скорость игры
* @param {number} [inDebugMode=false] находится ли игры в дебаг режиме
* @class
* @extends {Phaser.Game}
* @listens document.resize
* @listens document.orientationchange
* @listens document.visibilitychange
* @see {@link http://phaser.io/docs/2.6.2/Phaser.Game.html}
*/

var Game = function(speed, inDebugMode){

	/**
	 * Скорость игры.
	 * @type {number}
	 * @default 1
	 */
	this.speed = speed || 1;

	/**
	 * Находится ли игры в дебаг режиме.
	 * @type {boolean}
	 * @default false
	 */
	this.inDebugMode = inDebugMode || false;

	/**
	 * Инициализирована ли игра.
	 * @type {Boolean}
	 */
	this.initialized = false;

	/**
	 * Была ли игра остановлена из-за потери видимости окна.
	 * @type {Boolean}
	 */
	this.pausedByViewChange = false;

	/**
	 * Длительность перемещения карт по-умолчанию.
	 * @type {Number}
	 * @default 300
	 */
	this.defaultMoveTime = 300;

	/**
	 * Находится ли игра в горизонтальном положении, 
	 * рассчитывается только по размеру экрана.
	 * @type {Boolean}
	 */
	this.isRawLandscape = true;

	/**
	* Менеджер полей
	* @type {FieldManager}
	* @global
	*/
	window.fieldManager = new FieldManager(this.inDebugMode);

	/**
	 * Менеджер последовательностей игровых анимаций.
	 * @type {Sequencer}
	 * @global
	 */
	window.gameSeq = new Sequencer();

	/**
	* Обработчик действий сервера.
	* @type {ActionHandler}
	* @global
	*/
	window.actionHandler = new ActionHandler(window.actionReactions, window.notificationReactions);

	/**
	* Менеджер игроков.
	* @type {PlayerManager}
	* @global
	*/
	window.playerManager = new PlayerManager();

	/**
	* Менеджер интерфейса.
	* @type {UI}
	* @global
	*/
	window.ui = new UI();

	/**
	* Менеджер скинов.
	* @type {SkinManager}
	* @global
	*/
	window.skinManager = new SkinManager('modern');

	window.addEventListener('resize', this._updateCoordinatesDebounce.bind(this));
	window.addEventListener('orientationchange', this._updateCoordinatesDebounce.bind(this));

	Phaser.Game.call(
		this,
		this.screenWidth,
 		this.screenHeight, 
		Phaser.CANVAS, 
		'cardgame'
	);

	this._dimensionsUpdateTimeout = null;
	this._pauseTimeout = null;
	this._hiddenValue = null;

};

Game.prototype = Object.create(Phaser.Game.prototype);
Game.prototype.constructor = Game;

/**
 * Инициализирет игру.
 */
Game.prototype.initialize = function(){
	this.onPause.add(function(){
		if(this.inDebugMode)
			console.log('Game: paused internally');
	}, this);

	this.onResume.add(function(){
		if(this.inDebugMode)
			console.log('Game: unpaused internally');
	}, this);	

	this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
	this.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;

	this.scale.updateGameSize();

	// Отключаем контекстное меню
	this.canvas.oncontextmenu = function (e) {e.preventDefault();};

	// Антиалиасинг
	// Phaser.Canvas.setImageRenderingCrisp(game.canvas);

	/**
	* Фон
	* @type {Background}
	* @global
	*/
	window.background = new Background();	

	/**
	* Менеджер карт
	* @type {CardManager}
	* @global
	*/
	window.cardManager = new CardManager();

	/**
	* Эмиттер карт
	* @type {CardEmitter}
	* @global
	*/
	window.cardEmitter = new CardEmitter();

	/**
	* Контроллер карт
	* @type {CardControl}
	* @global
	*/
	window.cardControl = new CardControl();

	fieldManager.initialize();

	ui.initialize();

	this._addVisibilityChangeListener();

	this.initialized = true;
};

/**
 * Корректирует размеры игры в соответствии с размером окна.
 */
Game.prototype.updateCoordinates = function(){
	this.shouldUpdateFast = false;
	this.scale.updateGameSize();
	var state = this.state.getCurrentState();
	state.postResize();
	this._dimensionsUpdateTimeout = null;
};

/**
 * Запускает дебаунс корректировки размеров игры.
 * @private
 */
Game.prototype._updateCoordinatesDebounce = function(){
	if(this._dimensionsUpdateTimeout){
		clearTimeout(this._dimensionsUpdateTimeout);
	}
	else if(!this.shouldUpdateFast && !this.inDebugMode){
		document.getElementById('loading').style.display = 'block';
	}
	var timeout = (this.shouldUpdateFast || this.inDebugMode) ? 10 : 500;
	this._dimensionsUpdateTimeout = setTimeout(this.updateCoordinates.bind(this), timeout);
};

/**
 * Ставит и снимает игру с паузы в зависимости от видимости окна,
 * корректирует элементы игры после снятия паузы.
 * @private
 */
Game.prototype._visibilityChangeListener = function(){

	function correct(){
		actionHandler.highlightPossibleActions();
		fieldManager.rotateCards();
		fieldManager.zAlignCards();
		cardManager.forceApplyValues();
	}

	function pause(){
		this.paused = true;	
		this.pausedByViewChange = true;
		if(this.inDebugMode)
			console.log('Game: paused by visibility change');
	}

	if (!document[this._hiddenValue]) {

		// Снимаем игру с паузы
		this.paused = false;
		this.pausedByViewChange = false;
		if(this.inDebugMode)
			console.log('Game: unpaused by visibility change');
		if(this._pauseTimeout){
			clearTimeout(this._pauseTimeout);
			this._pauseTimeout = null;
		}

		// Ждем секунду, прежде чем откорректировать элементы игры, которые могли оказаться в неправильном положении
		// Это делается, чтобы браузер не пропустил requireAnimationFrames движка, или что-то еще, что может пойти не так
		setTimeout(correct.bind(this), 1000);
	}
	else{
		// Устанавливаем таймаут, после которого игра ставится на паузу
		this._pauseTimeout = setTimeout(pause.bind(this), 10000);
	}
};

/**
 * Добавляет листенер изменения видимости вкладки в зависимости от браузера.
 * @private
 */
Game.prototype._addVisibilityChangeListener = function(){
	var visibilityChange; 
	if (typeof document.hidden !== "undefined") {
		this._hiddenValue = "hidden";
		visibilityChange = "visibilitychange";
	} else if (typeof document.msHidden !== "undefined") {
		this._hiddenValue = "msHidden";
		visibilityChange = "msvisibilitychange";
	} else if (typeof document.webkitHidden !== "undefined") {
		this._hiddenValue = "webkitHidden";
		visibilityChange = "webkitvisibilitychange";
	}
	document.addEventListener(visibilityChange, this._visibilityChangeListener.bind(this), false);
};

/** Переключает дебаг всех элементов игры. */
Game.prototype.toggleDebugMode = function(){

	this.inDebugMode = !this.inDebugMode;

	connection.inDebugMode = this.inDebugMode;

	if(this.scale.inDebugMode != this.inDebugMode)
		this.scale.toggleDebugMode();

	if(cardControl.inDebugMode != this.inDebugMode)
		cardControl.toggleDebugMode();

	if(fieldManager.inDebugMode != this.inDebugMode)
		fieldManager.toggleDebugMode();

	if(cardManager.inDebugMode != this.inDebugMode)
		cardManager.toggleDebugMode();

	this.time.advancedTiming = this.inDebugMode;
};

Game.prototype.updateDebug = function(){
	if(!this.inDebugMode)
		return;
	this.debug.text(this.time.fps, 2, 14, "#00ff00");
}

Game.prototype.fixPause = function(){
	if(this.stage.disableVisibilityChange && this.paused && !this.pausedByViewChange){
		this.paused = false;
		if(this.inDebugMode)
			console.log('Game: unpaused forced');
	}
}

Game.prototype.changeState = function(key, callback, context){
	game.state.start(key, false, false, callback, context);
}

//@include:GameOverride
//@include:stateBoot
//@include:statePlay
//@include:stateMenu