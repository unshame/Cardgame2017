/*
 * Модуль, создающий сетку по размеру карт для расположения элементов игры
 * draw расчитывает координаты сетки и рисует ее, если включен дебаг
 * at используется для получения координат определенной клетки сетки
 */

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
		density:4,		//плотность сетки (масштаб - 1:density)
		thickness: 1	//толщина линий сетки для дебага
	}
	return options
}

//Рисует или уничтожает сетку с рамкой по размеру карт
Grid.prototype.draw = function(){
	if(this.border){
		this.border.destroy();
		this.border = null;
	}
	if(this.grid){
		this.grid.destroy();
		this.grid = null;
	}
	if(this.highlights){
		this.highlights.destroy(true);
		this.highlights = null;
	}
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
	this.gridTexture = grid.generateTexture();
	this.grid = game.add.tileSprite(0, 0, screenWidth, screenHeight, this.gridTexture);
	this.grid.alpha = 0.3

	this.highlights = game.add.group();
	game.world.add(this.highlights);

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
		color = 0x000000,
		alpha = 1;
	
	var border = this.border = game.add.graphics(0, 0);
	border.lineStyle(y, color, alpha);
	border.moveTo(0, y/2 - thickness/2);
	border.lineTo(screenWidth, y/2 - thickness/2);
	border.lineStyle(x, color, alpha);
	border.moveTo(screenWidth - x/2 + thickness/2, 0);
	border.lineTo(screenWidth - x/2 + thickness/2, screenHeight);
	border.lineStyle(y, color, alpha);
	border.moveTo(screenWidth, screenHeight - y/2 + thickness/2);
	border.lineTo(0,screenHeight - y/2 + thickness/2);
	border.lineStyle(x, color, alpha);
	border.moveTo(x/2 - thickness/2, screenHeight);
	border.lineTo(x/2 - thickness/2,0);

	game.background.add(this.grid);
	game.background.add(this.border);
}

//Возвращает координаты ячейки [col, row] 
//с опциональным сдвигом (offsetX, offsetY) 
//и выравниванием по размеру карт (align)
Grid.prototype.at = function(col, row, offsetX, offsetY, align){

	if(typeof col != 'number' || isNaN(col))
		col = 0;
	if(typeof row != 'number' || isNaN(row))
		row = 0;

	if(!offsetX)
		offsetX = 0;
	if(!offsetY)
		offsetY = 0;
	
	var validAlignVertical = ['top', 'middle', 'bottom'],
		validAlignHorizontal = ['left', 'center', 'right'];

	if(!align)
		align = [validAlignVertical[0], validAlignHorizontal[0]]
	else
		align = align.split(' ');

	var alignVertical = align[0],
		alignHorizontal = align[1],
		alignVerticalIndex = validAlignVertical.indexOf(alignVertical),
		fallbackIndex = ~alignVerticalIndex ? 1 : 0;

	if(!~alignVerticalIndex)
		 alignVertical = validAlignVertical[0];
	if(!~validAlignHorizontal.indexOf(alignHorizontal))
		 alignHorizontal = validAlignHorizontal[fallbackIndex];

		
	var adjustCol, adjustRow;
	switch(alignHorizontal){

		case 'left':
		adjustCol = 0;
		break;

		case 'center':
		adjustCol = Math.floor(this.density/2);
		break;

		case 'right':
		adjustCol = this.density + 1;
		break;
	}
	switch(alignVertical){

		case 'top':
		adjustRow = 0;
		break;

		case 'middle':
		adjustRow = Math.floor(this.density/2);
		break;

		case 'bottom':
		adjustRow = this.density + 1;
		break;
	}

	var x = (col - adjustCol)*this.cellWidth + this.offset.x ,
		y = (row - adjustRow)*this.cellHeight + this.offset.y ;

	if(this.highlights){
		var highlight = game.add.sprite(0, 0, this.gridTexture);	
		this.highlights.add(highlight);
		highlight.tint = 0x2DD300;
		highlight.position.x = x;
		highlight.position.y = y;
		game.world.bringToTop(this.highlights)
	}
	return {x: x + offsetX, y: y + offsetY}
}