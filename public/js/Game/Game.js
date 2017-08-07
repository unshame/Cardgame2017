/**
* Модуль, работающий с движком игры и инициализирующий все остальные модули
* @param {string} [parent] id DOM элемента, в который будет добавлен canvas элемент игры
* @param {number} [speed=1] скорость игры
* @param {number} [inDebugMode=false] находится ли игра в дебаг режиме
* @class
* @extends {Phaser.Game}
* @listens document.resize
* @listens document.orientationchange
* @listens document.visibilitychange
* @see {@link http://phaser.io/docs/2.6.2/Phaser.Game.html}
*/

var Game = function(parent, speed, inDebugMode){

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


	/* Модули */

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

	/**
	* Менеджер карт
	* @type {CardManager}
	* @global
	*/
	window.cardManager = new CardManager(this.inDebugMode);

	/**
	* Контроллер карт
	* @type {CardControl}
	* @global
	*/
	window.cardControl = new CardControl(this.inDebugMode);

	/**
	* Менеджер соединения с сервером
	* @type {ConnectionManager}
	* @global
	*/
	window.connection = new ConnectionManager(window.serverMethods, window.clientMethods, 'menu', this.inDebugMode);


	/********/

	Phaser.Game.call(
		this,
		{
			width: this.screenWidth,
 			height: this.screenHeight, 
			renderer: Phaser.Device.desktop ? Phaser.CANVAS : Phaser.WEBGL, 
			parent: parent,
			transparent: true
		}
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

	// Устанавливаем размер игры
	this.scale.updateGameSize();

	// Отключаем контекстное меню
	this.canvas.oncontextmenu = function (e) {e.preventDefault();};

	// Добавляем листенеры
	this._addVisibilityChangeListener();
	window.addEventListener('resize', this._updateCoordinatesDebounce.bind(this));
	window.addEventListener('orientationchange', this._updateCoordinatesDebounce.bind(this));

	// Антиалиасинг
	// Phaser.Canvas.setImageRenderingCrisp(game.canvas);

	/**
	* Эмиттер карт
	* @type {CardEmitter}
	* @global
	*/
	window.cardEmitter = new CardEmitter();

	window.feed = new NotificationManager();
	

	// Инициализация модулей
	cardManager.initialize();
	cardControl.initialize();
	fieldManager.initialize();
	ui.initialize();
	connection.initialize();

	/* Дебаг */
	this.scale.drawDebugGrid();

	this.onPause.add(function(){
		if(this.inDebugMode)
			console.log('Game: paused internally');
	}, this);

	this.onResume.add(function(){
		if(this.inDebugMode)
			console.log('Game: unpaused internally');
	}, this);
	/********/
	
	this.initialized = true;
};

/**
* Корректирует размеры игры в соответствии с размером окна.
*/
Game.prototype.updateCoordinates = function(){
	this.scale.updateGameSize();
	this.scale.drawDebugGrid();
	var state = this.state.getCurrent();
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
	else if(!this.scale.fullScreenModeChanged && !this.inDebugMode){
		document.getElementById('loading').style.display = 'block';
	}
	var timeout = (this.scale.fullScreenModeChanged || this.inDebugMode) ? 10 : 500;
	this._dimensionsUpdateTimeout = setTimeout(this.updateCoordinates.bind(this), timeout);
};

/**
* Ставит и снимает игру с паузы в зависимости от видимости окна,
* корректирует элементы игры после снятия паузы.
* @private
*/
Game.prototype._visibilityChangeListener = function(){

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
		var state = this.state.getCurrent();
		setTimeout(state.postResumed.bind(state), 1000);
	}
	else{
		// Устанавливаем таймаут, после которого игра ставится на паузу
		this._pauseTimeout = setTimeout(pause.bind(this), this.inDebugMode ? 2000 : 10000);
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

	localStorage.setItem('durak_debug', this.inDebugMode);

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

/** Выводит состояние дебаг режима всех модулей. */
Game.prototype.checkDebugStatus = function(){
	console.log(
		'game:', this.inDebugMode,
		'\nconnection:', connection.inDebugMode,
		'\nscale:', this.scale.inDebugMode,
		'\ncardControl:', cardControl.inDebugMode,
		'\nfieldManager:', fieldManager.inDebugMode,
		'\ncardManager:', cardManager.inDebugMode
	);
};

/** Выводит FPS. */
Game.prototype.updateDebug = function(){
	if(!this.inDebugMode)
		return;
	this.debug.text(this.time.fps, 2, 14, "#00ff00");
};

/** Снимает игру с паузы, если она была поставлена на паузу по неверной причине. */
Game.prototype.fixPause = function(){
	if(this.stage.disableVisibilityChange && this.paused && !this.pausedByViewChange){
		this.paused = false;
		if(this.inDebugMode)
			console.log('Game: unpaused forced');
	}
};

//@include:GameOverride