var Grid = function(options){

	this.options = this.getDefaultOptions();

	for(o in options){
		if(options.hasOwnProperty(o) && options[o] !== undefined){
			this.options[o] = options[o];
		}
	}

	this.density = this.options.density;
	this.thickness = this.options.thickness;
}

Grid.prototype.getDefaultOptions = function(){
	var options = {
		density:4,
		thickness: 1
	}
	return options
}

//Рисует или уничтожает сетку с рамкой по размеру карт
//Может быть пригодится для выравнивания полей на столе
Grid.prototype.draw = function(){
	if(this.border)
		this.border.destroy();
	if(this.grid)
		this.grid.destroy();
	if(this.highlight)
		this.highlight.destroy();
	if(!game.isInDebugMode)
		return;

	var screenWidth = game.screenWidth;
	var screenHeight = game.screenHeight;

	var grid = game.make.graphics(0, 0),
		density = this.density,
		thickness = this.thickness,
		width = this.cellWidth = Math.round(skinManager.skin.width/density),
		height = this.cellHeight = Math.round(skinManager.skin.height/density);
	
	//grid.lineStyle(thickness, 0x2BC41D, 1);
	grid.lineStyle(thickness, 0xffffff, 1);
	grid.drawRect(0, 0, width-thickness, height-thickness);
	this.grid = game.add.tileSprite(0, 0, screenWidth, screenHeight, grid.generateTexture());
	this.highlight = game.add.sprite(0, 0, grid.generateTexture());	
	this.highlight.tint = 0x2DD300;
	this.highlight.kill();

	var offset = this.offset = {
		x: Math.round(screenWidth%width/2),
		y: Math.round(screenHeight%height/2)
	}
	this.grid.tilePosition = offset;

	this.numCols = Math.floor(screenWidth/width);
	this.numRows = Math.floor(screenHeight/height);
	this.width = screenWidth - offset.x*2;
	this.height = screenHeight - offset.y*2;

	var x = offset.x,
		y = offset.y,
		//color = 0xC10BAC,
		color = 0xA50000;
	
	var border = this.border = game.add.graphics(0, 0);
	border.lineStyle(y, color, 1);
	border.moveTo(0, y/2 - thickness/2);
	border.lineTo(screenWidth, y/2 - thickness/2);
	border.lineStyle(x, color, 1);
	border.moveTo(screenWidth - x/2 + thickness/2, 0);
	border.lineTo(screenWidth - x/2 + thickness/2, screenHeight);
	border.lineStyle(y, color, 1);
	border.moveTo(screenWidth, screenHeight - y/2 + thickness/2);
	border.lineTo(0,screenHeight - y/2 + thickness/2);
	border.lineStyle(x, color, 1);
	border.moveTo(x/2 - thickness/2, screenHeight);
	border.lineTo(x/2 - thickness/2,0);

	game.background.add(this.grid);
	game.background.add(this.border);
}

Grid.prototype.at = function(col, row, offsetX, offsetY, centerX, centerY){
	if(!offsetX)
		offsetX = 0;
	if(!offsetY)
		offsetY = 0;

	var toCenter = Math.floor(this.density/2),
		toCenterX = centerX ? toCenter : 0,
		toCenterY = centerY ? toCenter : 0,
		x = (col-toCenterX)*this.cellWidth + this.offset.x,
		y = (row-toCenterY)*this.cellHeight + this.offset.y;

	if(this.highlight){
		this.highlight.reset();
		this.highlight.position.x = x;
		this.highlight.position.y = y;
		game.world.bringToTop(this.highlight)
	}
	return {x: x + offsetX, y: y + offsetY}
}