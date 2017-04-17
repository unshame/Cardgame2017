var Game = function(){

	this.isInDebugMode = true;

	this.cards = {}
	this.rope = null
	
	window.fieldManager = new FieldManager();
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
}

Game.prototype = Object.create(Phaser.Game.prototype);
Game.prototype.constructor = Game;

Game.prototype.updateAppDimensionsListener = function(){
	this.screenWidth = window.innerWidth;
	this.screenHeight = window.innerHeight;
	if(this.created){
		this.scale.setGameSize(this.screenWidth, this.screenHeight)
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
		)
		this.skipButton.reposition(
			buttonPosition.x,
			buttonPosition.y
		);
		this.takeButton.reposition(
			buttonPosition.x,
			buttonPosition.y
		);
		this.menu.update();
	}
	$('#loading').hide().css('opacity', 0);
	this.dimensionsUpdateTimeout = null;
}

Game.prototype.updateAppDimensions = function(){
	if(this.dimensionsUpdateTimeout){
		clearTimeout(this.dimensionsUpdateTimeout);
	}
	else{
		$('#loading').show().css('opacity', 1);
	}
	this.dimensionsUpdateTimeout = setTimeout(this.updateAppDimensionsListener.bind(this), 500)

}

Game.prototype.newPixel = function(){
	var pixel = this.make.graphics(0, 0);
	pixel.beginFill(0xffffff);
	pixel.drawRect(0, 0, 1, 1);
	pixel.endFill();
	return pixel
}

Game.prototype.toggleDebugMode = function(){
	this.isInDebugMode = !this.isInDebugMode;
	grid.draw();
}