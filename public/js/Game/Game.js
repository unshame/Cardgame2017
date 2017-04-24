//Модуль, работающий с движком игры и инициализирующий все остальные модули

var Game = function(){

	this.speed = 1;
	this.isInDebugMode = false;

	this.surface = this.background = this.rope = null;
	
	window.fieldManager = new FieldManager(false);
	window.actionHandler = new ActionHandler(window.reactions);

	window.addEventListener('resize', this.updateAppDimensions.bind(this));
	window.addEventListener('orientationchange', this.updateAppDimensions.bind(this));

	this.screenWidth = window.innerWidth;
	this.screenHeight = window.innerHeight;

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
		Phaser.Canvas, 
		'cardgame'
	);
};

Game.prototype = Object.create(Phaser.Game.prototype);
Game.prototype.constructor = Game;

//Инициализация игры
Game.prototype.initialize = function(){
	if(this.created)
		return;

	//Отключаем контекстное меню
	this.canvas.oncontextmenu = function (e) {e.preventDefault();};

	//Антиалиасинг
	//Phaser.Canvas.setImageRenderingCrisp(game.canvas);

	//this.world.setBounds(0, 0, this.screenWidth, this.screenHeight);
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
	this.actionButton = new Button(
		function(){
			return grid.at(
				Math.floor(grid.numCols/2),
				grid.numRows - grid.density - 2,
				-95,
				-25
			);
		},
		function(){sendRealAction(actionHandler.realAction);},
		'Take',
		null,
		this.buttons
	);
	this.debugButton = new Button(
		function(){
			return grid.at(
				grid.numCols - grid.density*1.5 - 1,
				grid.numRows - grid.density - 2,
				-95,
				-25
			);
		},
		this.toggleDebugMode,
		'Debug',
		this,
		this.buttons
	);
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

//Выполняется по окончанию throttle'a изменения размера экрана
Game.prototype.updateAppDimensionsListener = function(){
	this.screenWidth = window.innerWidth;
	this.screenHeight = window.innerHeight;
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
		//this.menu.update();
	}

	document.getElementById('loading').style.display = 'none';
	this.dimensionsUpdateTimeout = null;
};

//Выполняется при изменении размера экрана
Game.prototype.updateAppDimensions = function(){
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
	if (!document[this.hiddenValue]) {

		//Снимаем игру с паузы
		this.paused = false;
		if(this.pauseTimeout){
			clearTimeout(this.pauseTimeout);
			this.pauseTimeout = null;
		}

		//Ждем секунду, прежде чем откорректировать элементы игры, которые могли оказаться в неправильном положении
		//Это делается, чтобы браузер не пропустил requireAnimationFrames движка, или что-то еще, что может пойти не так
		setTimeout(function(){
			actionHandler.possibleActions && actionHandler.highlightPossibleActions(actionHandler.possibleActions)
			fieldManager.rotateCards();
			fieldManager.zAlignCards();
		}, 1000, this)
	}
	else{
		//Устанавливаем таймаут, после которого игра ставится на паузу
		this.pauseTimeout = setTimeout(function(){
			this.paused = true;		
		}, 10000, this)
	}
}

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
}

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
		if(typeof button.text == 'object')
			button.text.setText(button.text.text);
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