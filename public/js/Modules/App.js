var App = function(){

	window.game = {
		cards: {},
		cardsGroup: null,
		rope: null
	};
	window.spotManager = new SpotManager();
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

App.prototype = Object.create(Phaser.Game.prototype);
App.prototype.constructor = App;

App.prototype.updateAppDimensions = function(){
	this.screenWidth = window.innerWidth;
	this.screenHeight = window.innerHeight;
	if(this.created){
		this.scale.setGameSize(this.screenWidth, this.screenHeight)
		this.background.width = this.screenWidth;
		this.background.height =  this.screenHeight;
		spotManager.resizeSpots();
		game.rope.maxHeight = game.rope.sprite.y = this.screenHeight;
		game.skipButton.reposition(this.screenWidth - skinManager.skin.width - 120, this.screenHeight - skinManager.skin.height - 120);
		game.takeButton.reposition(this.screenWidth - skinManager.skin.width - 120, this.screenHeight - skinManager.skin.height - 120);
	}
}

App.prototype.newPixel = function(){
	var pixel = app.make.graphics(0, 0);
	pixel.beginFill(0xffffff);
	pixel.drawRect(0, 0, 1, 1);
	pixel.endFill();
	return pixel
}