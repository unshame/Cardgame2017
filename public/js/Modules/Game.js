var Game = function(){

	this.isInDebugMode = true;

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
		this.drawGrid();
		fieldManager.resizeSpots();
		this.rope.maxHeight = this.rope.sprite.y = this.screenHeight;
		this.skipButton.reposition(this.screenWidth/2 - skinManager.skin.width/2, this.screenHeight - skinManager.skin.height - 120);
		this.takeButton.reposition(this.screenWidth/2 - skinManager.skin.width/2, this.screenHeight - skinManager.skin.height - 120);
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

//Рисует или уничтожает сетку с рамкой по размеру карт
//Может быть пригодится для выравнивания полей на столе
Game.prototype.drawGrid = function(){
	if(this.border){
		this.border.destroy();
	}
	if(this.grid){
		this.grid.destroy();
	}
	if(!this.isInDebugMode)
		return;
	var grid =  this.make.graphics(0, 0);
	grid.lineStyle(2, 0xffffff, 1);
	grid.drawRect(0, 0, skinManager.skin.width-2, skinManager.skin.height-2);
	this.grid = this.add.tileSprite(0, 0, this.screenWidth, this.screenHeight, grid.generateTexture());
	var offset = {
		x: (this.screenWidth%skinManager.skin.width)/2,
		y: (this.screenHeight%skinManager.skin.height)/2
	}
	this.grid.tilePosition = offset
	var x = Math.round(offset.x);
	var y = Math.round(offset.y);
	var border = this.border = this.add.graphics(0, 0);
	var color = 0xA50000;
	border.lineStyle(y, color, 1);
	border.moveTo(0, y/2 - 1);
	border.lineTo(this.screenWidth, y/2 - 1);
	border.lineStyle(x, color, 1);
	border.moveTo(this.screenWidth - x/2 + 1, 0);
	border.lineTo(this.screenWidth - x/2 + 1, this.screenHeight);
	border.lineStyle(y, color, 1);
	border.moveTo(this.screenWidth, this.screenHeight - y/2 + 1);
	border.lineTo(0,this.screenHeight - y/2 + 1);
	border.lineStyle(x, color, 1);
	border.moveTo(x/2 - 1, this.screenHeight);
	border.lineTo(x/2 - 1,0);
	this.world.setChildIndex(this.grid, 1);
	this.world.setChildIndex(this.border, 2)
}

Game.prototype.toggleDebugMode = function(){
	this.isInDebugMode = !this.isInDebugMode;
	this.drawGrid();
}