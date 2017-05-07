/**
 * Модуль, работающий с движком игры и инициализирующий все остальные модули
 * @class
 */

var Game = function(minWidth, minHeight, speed, isInDebugMode){

	this.speed = speed || 1;
	this.minWidth = minWidth || 1024;
	this.minHeight = minHeight || 768;
	this.isInDebugMode = isInDebugMode || false;
	
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

	window.addEventListener('resize', this.updateCoordinatesThrottle.bind(this));
	window.addEventListener('orientationchange', this.updateCoordinatesThrottle.bind(this));

	this.calculateScreenSize();

	/**
	 * HTML5 game framework.  
	 * ![Phaser](https://camo.githubusercontent.com/41b3f653a9ad25ca565c9c4bcfcc13b6d778e329/687474703a2f2f7068617365722e696f2f696d616765732f6769746875622f6172636164652d6361622e706e67)
	 * @external Phaser
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

	if(this.isInDebugMode){
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
	if(this.created)
		return;

	this.time.advancedTiming = true;

	this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
	this.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;

	this.scale.setGameSize(this.screenWidth, this.screenHeight);

	//Отключаем контекстное меню
	this.canvas.oncontextmenu = function (e) {e.preventDefault();};

	//Антиалиасинг
	//Phaser.Canvas.setImageRenderingCrisp(game.canvas);

	this.stage.disableVisibilityChange  = true;	

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

	document.getElementById('loading').style.display = 'none';

	this.addVisibilityChangeListener();

	this.created = true;
};

//Выполняется по окончании throttle'a изменения размера экрана
Game.prototype.updateCoordinates = function(){
	this.calculateScreenSize();
	if(this.created){

		this.scale.setGameSize(this.screenWidth, this.screenHeight);

		background.updateSize();

		grid.draw();

		fieldManager.resizeFields();

		ui.updatePosition();

		if(cardManager.emitter.on)
			cardManager.throwCardsStart();
	}

	document.getElementById('loading').style.display = 'none';
	this.dimensionsUpdateTimeout = null;
};

//Выполняется при изменении размера экрана
Game.prototype.updateCoordinatesThrottle = function(){
	if(this.shouldUpdateFast){
		this.shouldUpdateFast = false;
		this.updateCoordinates();
		return;
	}
	if(this.dimensionsUpdateTimeout){
		clearTimeout(this.dimensionsUpdateTimeout);
	}
	else{
		document.getElementById('loading').style.display = 'block';
	}
	this.dimensionsUpdateTimeout = setTimeout(this.updateCoordinates.bind(this), 500);
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
	if(!this.created)
		return;

	this.isInDebugMode = !this.isInDebugMode;

	if(grid.isInDebugMode != this.isInDebugMode)
		grid.toggleDebugMode();

	if(cardControl.isInDebugMode != this.isInDebugMode)
		cardControl.toggleDebugMode();

	if(fieldManager.isInDebugMode != this.isInDebugMode)
		fieldManager.toggleDebugMode();

	if(cardManager.isInDebugMode != this.isInDebugMode)
		cardManager.toggleDebugMode();

	isInDebugMode = this.isInDebugMode;
};
