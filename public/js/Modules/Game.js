var Game = function(){

	this.cards = {}
	this.cardsGroup = null
	this.rope = null
	
	window.fieldManager = new FieldManager();
	window.skinManager = null;
	window.controller = null;
	window.addEventListener('resize', this.updateAppDimensions.bind(this));
	window.addEventListener('orientationchange', this.updateAppDimensions.bind(this));

	this.screenWidth = window.innerWidth;
	this.screenHeight = window.innerHeight;
	this.background = null;

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
		this.background.width = this.screenWidth;
		this.background.height =  this.screenHeight;
		fieldManager.resizeSpots();
		game.rope.maxHeight = game.rope.sprite.y = this.screenHeight;
		game.skipButton.reposition(this.screenWidth - skinManager.skin.width - 120, this.screenHeight - skinManager.skin.height - 120);
		game.takeButton.reposition(this.screenWidth - skinManager.skin.width - 120, this.screenHeight - skinManager.skin.height - 120);
		game.menu.update();
	}
	this.dimensionsUpdateTimeout = null;
}

Game.prototype.updateAppDimensions = function(){
	if(this.dimensionsUpdateTimeout){
		clearTimeout(this.dimensionsUpdateTimeout);
	}
	this.dimensionsUpdateTimeout = setTimeout(this.updateAppDimensionsListener.bind(this), 500)

}

Game.prototype.newPixel = function(){
	var pixel = game.make.graphics(0, 0);
	pixel.beginFill(0xffffff);
	pixel.drawRect(0, 0, 1, 1);
	pixel.endFill();
	return pixel
}