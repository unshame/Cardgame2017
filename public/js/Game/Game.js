//Модуль, работающий с движком игры и инициализирующий все остальные модули

var Game = function(minWidth, minHeight, speed, isInDebugMode){

	this.speed = speed || 1;
	this.minWidth = minWidth || 1280;
	this.minHeight = minHeight || 720;
	this.isInDebugMode = isInDebugMode || false;

	this.surface = this.background = this.rope = null;
	
	window.fieldManager = new FieldManager(false);
	window.actionHandler = new ActionHandler(window.reactions);
	window.playerManager = new PlayerManager();

	window.addEventListener('resize', this.updateAppDimensions.bind(this));
	window.addEventListener('orientationchange', this.updateAppDimensions.bind(this));

	this.calculateScreenSize();

	this.colors = {
		orange: 0xFF8300,
		green: 0x68C655,
		red: 0xC93F3F,
		white: 0xFFFFFF
	};

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

	this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
	this.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;

	//Отключаем контекстное меню
	this.canvas.oncontextmenu = function (e) {e.preventDefault();};

	//Антиалиасинг
	//Phaser.Canvas.setImageRenderingCrisp(game.canvas);

	this.stage.disableVisibilityChange  = true;	
	
	//Фон
	this.background = this.add.group();
	this.surface = this.add.tileSprite(0, 0, this.screenWidth, this.screenHeight, 'blue');
	this.background.add(this.surface); 

	window.grid = new Grid({debug: false});	
	
	window.cursor = new Cursor('cursor_orange');

	window.cardManager = new CardManager();
	window.cardControl = new CardControl();

	this.rope = new Rope();

	//Кнопки (временные)
	this.buttons = this.add.group();
	this.cornerButtons = this.add.group();
	this.queueButton = new Button({
		position: function(width, height){
			return {
				x: game.screenWidth/2 - width/2,
				y: game.screenHeight/2 - height/2
			};
		},
		action: function(){
			server.queueUp();
			this.hide();
		},
		text: 'Queue Up',
		color: 'grey',
		size: 'wide',
		textColor: 'black',
		group: this.buttons
	});
	this.actionButton = new Button({
		position: function(width, height){
			return {
				x: game.screenWidth/2 - width/2,
				y: grid.at(
					0,
					grid.numRows - grid.density - 2,
					0,
					-height/2
				).y
			};
		},
		action: function(){sendRealAction(actionHandler.realAction);},
		text: 'Take',
		color: 'orange',
		size: 'wide',
		textColor: 'white',
		group: this.buttons
	});
	this.debugButton = new Button({
		position: function(width, height){
			return grid.at(
				grid.numCols - grid.density*1.5 - 1,
				grid.numRows - grid.density - 2,
				-width/2,
				-height/2
			);
		},
		action: this.toggleDebugMode,
		text: 'Debug',
		context: this,
		color: 'orange',
		size: 'wide',
		textColor: 'white',
		group: this.buttons
	});

	this.fullScreenButton = new Button({
		position: function(width, height){
			return {
				x: game.screenWidth - 15 - width,
				y: 15
			};
		},
		action: this.toggleFullScreen,
		icon: 'fullscreen',
		context: this,
		color: 'orange',
		size: 'small',
		group: this.cornerButtons
	});

	this.menuButton = new Button({
		position: function(width, height){
			return {
				x: game.screenWidth - 15 - width,
				y: game.screenHeight - 15 - height
			};
		},
		action: function(){console.log('menu');},
		icon: 'menu',
		context: this,
		color: 'orange',
		size: 'small',
		group: this.cornerButtons
	});

	this.actionButton.disable();
	this.world.setChildIndex(this.buttons, 1);

	/*this.menu = new Menu(this.screenWidth/2,this.screenHeight/2);
	this.menu.addButton(function(){	},'SinglePlayer');
	this.menu.addButton(function(){console.log('sup');},'Multiplayer');
	this.menu.addButton(function(){console.log('lel');},'Options');
	this.testButton = new Button(
		50,
		50, function(){
			this.menu.toggle();
		},
		'Menu'
	)*/
	
	/*this.onPause.add();
	this.onResume.add(function(){});
	this.onBlur.add(function(){
		console.log('blurred')

	});*/	

	document.getElementById('loading').style.display = 'none';
	this.created = true;

	this.addVisibilityChangeListener();
};

//Выполняется по окончании throttle'a изменения размера экрана
Game.prototype.updateAppDimensionsListener = function(){
	this.calculateScreenSize();
	if(this.created){

		this.scale.setGameSize(this.screenWidth, this.screenHeight);

		this.surface.width = this.screenWidth;
		this.surface.height =  this.screenHeight;

		grid.draw();

		fieldManager.resizeFields();

		this.rope.maxHeight = this.rope.sprite.y = this.screenHeight;

		//Кнопки
		this.actionButton.updatePosition();
		this.debugButton.updatePosition();
		this.fullScreenButton.updatePosition();
		this.menuButton.updatePosition();
		//this.menu.update();
	}

	document.getElementById('loading').style.display = 'none';
	this.dimensionsUpdateTimeout = null;
};

//Выполняется при изменении размера экрана
Game.prototype.updateAppDimensions = function(){
	if(this.shouldUpdateFast){
		this.shouldUpdateFast = false;
		this.updateAppDimensionsListener();
		return;
	}
	if(this.dimensionsUpdateTimeout){
		clearTimeout(this.dimensionsUpdateTimeout);
	}
	else{
		document.getElementById('loading').style.display = 'block';
	}
	this.dimensionsUpdateTimeout = setTimeout(this.updateAppDimensionsListener.bind(this), 500);

};

//Выполняется, когда вкладка переходит на задний/передний план
Game.prototype.visibilityChangeListener = function(){

	function correct(){
		actionHandler.possibleActions && actionHandler.highlightPossibleActions(actionHandler.possibleActions);
		fieldManager.rotateCards();
		fieldManager.zAlignCards();
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

//Возвращает phaser пиксель для превращения в текстуру
Game.prototype.newPixel = function(){
	var pixel = this.make.graphics(0, 0);
	pixel.beginFill(this.colors.white);
	pixel.drawRect(0, 0, 1, 1);
	pixel.endFill();
	return pixel;
};

//Обновляет текст всех кнопок
Game.prototype.loadButtonText = function(){
	if(!this.created)
		return;
	for(var i = 0; i < this.buttons.children.length; i++){
		var button = this.buttons.children[i];
		if(typeof button.label == 'object' && button.label.isText)
			button.label.setText(button.label.text);
	}
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


Game.prototype.toggleFullScreen = function(){
	if (this.scale.isFullScreen){
		this.fullScreenButton.label.frame = 0;
		this.shouldUpdateFast = true;
	    this.scale.stopFullScreen();
	}
	else{
		this.fullScreenButton.label.frame = 1;
		this.shouldUpdateFast = true;
	    this.scale.startFullScreen();
	}
};

