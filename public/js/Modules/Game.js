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

	this.gridDensity = 4;
	this.gridThickness = 1;
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
	var thickness = this.gridThickness;
	var density = this.gridDensity;
	var width = Math.round(skinManager.skin.width/density);
	var height = Math.round(skinManager.skin.height/density);
	
	//grid.lineStyle(thickness, 0x2BC41D, 1);
	grid.lineStyle(thickness, 0xffffff, 1);
	grid.drawRect(0, 0, width-thickness, height-thickness);
	this.grid = this.add.tileSprite(0, 0, this.screenWidth, this.screenHeight, grid.generateTexture());
	var offset = {
		x: (this.screenWidth%width)/2,
		y: (this.screenHeight%height)/2
	}
	this.grid.tilePosition = offset;

	var x = offset.x;
	var y = offset.y;
	//var color = 0xC10BAC;
	var color = 0xA50000;
	
	var border = this.border = this.add.graphics(0, 0);
	border.lineStyle(y, color, 1);
	border.moveTo(0, y/2 - thickness/2);
	border.lineTo(this.screenWidth, y/2 - thickness/2);
	border.lineStyle(x, color, 1);
	border.moveTo(this.screenWidth - x/2 + thickness/2, 0);
	border.lineTo(this.screenWidth - x/2 + thickness/2, this.screenHeight);
	border.lineStyle(y, color, 1);
	border.moveTo(this.screenWidth, this.screenHeight - y/2 + thickness/2);
	border.lineTo(0,this.screenHeight - y/2 + thickness/2);
	border.lineStyle(x, color, 1);
	border.moveTo(x/2 - thickness/2, this.screenHeight);
	border.lineTo(x/2 - thickness/2,0);

	this.background.add(this.grid);
	this.background.add(this.border);
}

Game.prototype.toggleDebugMode = function(){
	this.isInDebugMode = !this.isInDebugMode;
	this.drawGrid();
}