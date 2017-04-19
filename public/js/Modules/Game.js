var Game = function(){

	this.isInDebugMode = false;

	this.cards = {};
	this.rope = null;
	this.speed = 1;
	
	window.fieldManager = new FieldManager(false);
	window.skinManager = null;
	window.controller = null;
	window.addEventListener('resize', this.updateAppDimensions.bind(this));
	window.addEventListener('orientationchange', this.updateAppDimensions.bind(this));

	this.screenWidth = window.innerWidth;
	this.screenHeight = window.innerHeight;
	this.surface = null;

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

	Phaser.Canvas.setImageRenderingCrisp(game.canvas);

	$('#loading').hide();

	this.created = true;
	//this.world.setBounds(0, 0, this.screenWidth, this.screenHeight);
	//this.stage.disableVisibilityChange  = true;	
	
	//Фон
	this.background = this.add.group();
	this.surface = this.add.tileSprite(0, 0, this.screenWidth, this.screenHeight, 'blue');
	this.background.add(this.surface); 

	window.grid = new Grid({debug: false});
	grid.draw();	
	
	this.cardsGroup = this.add.group();
	controller = new Controller();
	this.rope = new Rope();
	var buttonPosition = grid.at(
		Math.floor(grid.numCols/2),
		grid.numRows - grid.density - 2,
		-95,
		-25
	),
	debugButtonPosition = grid.at(
		grid.numCols - grid.density*1.5 - 1,
		grid.numRows - grid.density - 2,
		-95,
		-25
	);
	this.skipButton = new Button(
		buttonPosition.x,
		buttonPosition.y,
		function(){sendRealAction('SKIP');},
		'Skip'
	);
	this.takeButton = new Button(
		buttonPosition.x,
		buttonPosition.y,
		function(){sendRealAction('TAKE');},
		'Take'
	);
	this.debugButton = new Button(
		debugButtonPosition.x,
		debugButtonPosition.y,
		this.toggleDebugMode,
		'Debug',
		this
	);
	this.skipButton.hide();
	this.takeButton.hide();
	this.menu = new Menu(this.screenWidth/2,this.screenHeight/2);
	this.menu.addButton(function(){	},'SinglePlayer');
	this.menu.addButton(function(){console.log('sup');},'Multiplayer');
	this.menu.addButton(function(){console.log('lel');},'Options');
	this.canvas.oncontextmenu = function (e) { e.preventDefault(); };

	document.addEventListener('mouseleave', controller.updateCursor.bind(controller, false));
	document.addEventListener('mouseenter', controller.updateCursor.bind(controller, true));
/*	this.testButton = new Button(
		50,
		50, function(){
			this.menu.toggle();
		},
		'Menu'
	)*/

	
/*	this.onPause.add();
	this.onResume.add(function(){});
	this.onBlur.add(function(){console.log('blured')});
	this.onFocus.add(function(){console.log('focused')});*/

};

Game.prototype.updateAppDimensionsListener = function(){
	this.screenWidth = window.innerWidth;
	this.screenHeight = window.innerHeight;
	if(this.created){
		this.scale.setGameSize(this.screenWidth, this.screenHeight);
		this.surface.width = this.screenWidth;
		this.surface.height =  this.screenHeight;
		grid && grid.draw();
		fieldManager.resizeFields();
		this.rope.maxHeight = this.rope.sprite.y = this.screenHeight;

		var buttonPosition = grid.at(
			Math.floor(grid.numCols/2),
			grid.numRows - grid.density - 2,
			-95,
			-25
		),
		debugButtonPosition = grid.at(
			grid.numCols - grid.density,
			grid.numRows - grid.density - 2,
			-95,
			-25
		);
		this.skipButton.reposition(
			buttonPosition.x,
			buttonPosition.y
		);
		this.takeButton.reposition(
			buttonPosition.x,
			buttonPosition.y
		);
		this.debugButton.reposition(
			debugButtonPosition.x,
			debugButtonPosition.y
		);
		this.menu.update();
	}
	$('#loading').hide().css('opacity', 0);
	this.dimensionsUpdateTimeout = null;
};

Game.prototype.updateAppDimensions = function(){
	if(this.dimensionsUpdateTimeout){
		clearTimeout(this.dimensionsUpdateTimeout);
	}
	else{
		$('#loading').show().css('opacity', 1);
	}
	this.dimensionsUpdateTimeout = setTimeout(this.updateAppDimensionsListener.bind(this), 500);

};

Game.prototype.newPixel = function(){
	var pixel = this.make.graphics(0, 0);
	pixel.beginFill(0xffffff);
	pixel.drawRect(0, 0, 1, 1);
	pixel.endFill();
	return pixel;
};

Game.prototype.toggleDebugMode = function(){
	this.isInDebugMode = !this.isInDebugMode;
	if(grid && grid.isInDebugMode != this.isInDebugMode)
		grid.toggleDebugMode();
	if(controller && controller.isInDebugMode != this.isInDebugMode)
		controller.toggleDebugMode();
	if(fieldManager && fieldManager.isInDebugMode != this.isInDebugMode)
		fieldManager.toggleDebugMode();
	isInDebugMode = this.isInDebugMode;
	for(var ci in this.cards){
		if(this.cards.hasOwnProperty(ci))
			this.cards[ci].isInDebugMode = this.isInDebugMode;
	}
};