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
	this.onBlur.add(function(){console.log('blured')});
	this.onFocus.add(function(){console.log('focused')});*/

	document.getElementById('loading').style.display = 'none';
	this.created = true;
};

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

Game.prototype.updateAppDimensions = function(){
	if(this.dimensionsUpdateTimeout){
		clearTimeout(this.dimensionsUpdateTimeout);
	}
	else{
		document.getElementById('loading').style.display = 'block';
	}
	this.dimensionsUpdateTimeout = setTimeout(this.updateAppDimensionsListener.bind(this), 500);

};

Game.prototype.newPixel = function(){
	var pixel = this.make.graphics(0, 0);
	pixel.beginFill(this.colors.white);
	pixel.drawRect(0, 0, 1, 1);
	pixel.endFill();
	return pixel;
};

Game.prototype.loadButtonText = function(){
	if(!this.created)
		return;
	for(var i = 0; i < this.buttons.children.length; i++){
		var button = this.buttons.children[i];
		if(typeof button.text == 'object')
			button.text.setText(button.text.text);
	}
};

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