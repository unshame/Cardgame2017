/**
* Модуль, работающий с движком игры и инициализирующий все остальные модули
* @class
*/

var Game = function(minWidth, minHeight, speed, inDebugMode){

	this.speed = speed || 1;
	this.minWidth = minWidth || 1024;
	this.minHeight = minHeight || 768;
	this.inDebugMode = inDebugMode || false;
	this.initialized = false;
	
	/**
	* Обработчик действий сервера
	* @type {ActionHandler}
	* @global
	*/
	window.actionHandler = new ActionHandler(window.reactions);

	/**
	* Менеджер игроков
	* @type {PlayerManager}
	* @global
	*/
	window.playerManager = new PlayerManager();

	/**
	* Менеджер интерфейса
	* @type {UI}
	* @global
	*/
	window.ui = new UI();

	window.addEventListener('resize', this.updateCoordinatesDebounce.bind(this));
	window.addEventListener('orientationchange', this.updateCoordinatesDebounce.bind(this));

	this.calculateScreenSize();

	/**
	* HTML5 2D WebGL graphics library with canvas fallback. Используется {@link external:Phaser|Phaser'ом} для рендеринга.   
	* @external PIXI
	* @version 2.2.9
	* @see {@link https://phaser.io/docs/2.6.2/PIXI.html}
	* @see {@link http://www.pixijs.com/}
	*/
	
	/**
	* HTML5 game framework. Использует {@link external:PIXI|PIXI} для рендеринга.   
	* ![Phaser](https://camo.githubusercontent.com/41b3f653a9ad25ca565c9c4bcfcc13b6d778e329/687474703a2f2f7068617365722e696f2f696d616765732f6769746875622f6172636164652d6361622e706e67)
	* @external Phaser
	* @version 2.6.2
	* @see {@link https://phaser.io/docs/2.6.2/index}
	*/
	Phaser.Game.call(
		this,
		this.screenWidth,
 		this.screenHeight, 
		Phaser.CANVAS, 
		'cardgame'
	);
};

Game.prototype = Object.create(Phaser.Game.prototype);
Game.prototype.constructor = Game;

Game.prototype.calculateScreenSize = function(){
	var width = window.innerWidth,
		height = window.innerHeight,
		minWidth = this.minWidth,
		minHeight = this.minHeight,
		diffWidth = minWidth - width,
		diffHeight = minHeight - height,
		multWidth = width/minWidth,
		multHeight = height/minHeight;

	if(this.inDebugMode){
		console.log(
			'width:', width,
			'height:', height
		);
		console.log(
			'diffWidth:', diffWidth,
			'diffHeight:', diffHeight
		);
		console.log(
			'multWidth:', multWidth,
			'multHeight:', multHeight
		);
	}
	/**
	* Ширина игры без учета масштаба
	* @param Game#screenWidth
	* @type {number}
	*/
	this.screenWidth = 	Math.max(width, minWidth);
	this.screenHeight = Math.max(height, minHeight);
	if(diffWidth > 0){
		this.screenHeight /= multWidth;
	}
	if(diffHeight > 0){
		this.screenWidth /= multHeight;
	}
};

//Инициализация игры
Game.prototype.initialize = function(){

	this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
	this.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;

	this.scale.setGameSize(this.screenWidth, this.screenHeight);

	//Отключаем контекстное меню
	this.canvas.oncontextmenu = function (e) {e.preventDefault();};

	//Антиалиасинг
	//Phaser.Canvas.setImageRenderingCrisp(game.canvas);

	/**
	* Фон
	* @type {Background}
	* @global
	*/
	window.background = new Background();	

	/**
	* Сетка
	* @type {Grid}
	* @global
	*/
	window.grid = new Grid({debug: false});	
	
	/**
	* Менеджер полей
	* @type {FieldManager}
	* @global
	*/
	window.fieldManager = new FieldManager(false);

	/**
	* Менеджер карт
	* @type {CardManager}
	* @global
	*/
	window.cardManager = new CardManager();

	/**
	* Контроллер карт
	* @type {CardControl}
	* @global
	*/
	window.cardControl = new CardControl();

	ui.initialize();

	this.addVisibilityChangeListener();
};

//Выполняется по окончании дебаунса изменения размера экрана
Game.prototype.updateCoordinates = function(){
	this.shouldUpdateFast = false;
	this.calculateScreenSize();
	var state = this.state.getCurrentState();
	state.postResize();
	this.dimensionsUpdateTimeout = null;
};

//Выполняется при изменении размера экрана
Game.prototype.updateCoordinatesDebounce = function(){
	if(this.dimensionsUpdateTimeout){
		clearTimeout(this.dimensionsUpdateTimeout);
	}
	else if(!this.shouldUpdateFast){
		document.getElementById('loading').style.display = 'block';
	}
	var timeout = this.shouldUpdateFast ? 10 : 500;
	this.dimensionsUpdateTimeout = setTimeout(this.updateCoordinates.bind(this), timeout);
};

//Выполняется, когда вкладка переходит на задний/передний план
Game.prototype.visibilityChangeListener = function(){

	function correct(){
		actionHandler.possibleActions && actionHandler.highlightPossibleActions(actionHandler.possibleActions);
		fieldManager.rotateCards();
		fieldManager.zAlignCards();
		cardManager.forceSetValues();
	}

	function pause(){
		this.paused = true;	
	}

	if (!document[this.hiddenValue]) {

		//Снимаем игру с паузы
		this.paused = false;
		if(this.pauseTimeout){
			clearTimeout(this.pauseTimeout);
			this.pauseTimeout = null;
		}

		//Ждем секунду, прежде чем откорректировать элементы игры, которые могли оказаться в неправильном положении
		//Это делается, чтобы браузер не пропустил requireAnimationFrames движка, или что-то еще, что может пойти не так
		setTimeout(correct.bind(this), 1000);
	}
	else{
		//Устанавливаем таймаут, после которого игра ставится на паузу
		this.pauseTimeout = setTimeout(pause.bind(this), 10000);
	}
};

//Добавляет листенер изменения видимости вкладки в зависимости от браузера
Game.prototype.addVisibilityChangeListener = function(){
	var visibilityChange; 
	if (typeof document.hidden !== "undefined") {
		this.hiddenValue = "hidden";
		visibilityChange = "visibilitychange";
	} else if (typeof document.msHidden !== "undefined") {
		this.hiddenValue = "msHidden";
		visibilityChange = "msvisibilitychange";
	} else if (typeof document.webkitHidden !== "undefined") {
		this.hiddenValue = "webkitHidden";
		visibilityChange = "webkitvisibilitychange";
	}
	document.addEventListener(visibilityChange, this.visibilityChangeListener.bind(this), false);
};

//Переключение дебага
Game.prototype.toggleDebugMode = function(){

	this.inDebugMode = !this.inDebugMode;

	if(grid.inDebugMode != this.inDebugMode)
		grid.toggleDebugMode();

	if(cardControl.inDebugMode != this.inDebugMode)
		cardControl.toggleDebugMode();

	if(fieldManager.inDebugMode != this.inDebugMode)
		fieldManager.toggleDebugMode();

	if(cardManager.inDebugMode != this.inDebugMode)
		cardManager.toggleDebugMode();
	
	this.time.advancedTiming = this.inDebugMode;

	inDebugMode = this.inDebugMode;
};