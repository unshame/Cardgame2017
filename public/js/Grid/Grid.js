/**
* Модуль, создающий сетку по размеру карт для расположения элементов игры.
* @class
* @param {object} options 		 Опции, используемые при создании сетки
* @param {number} [options.density=4] сколько клеток умещается в карте по одной оси
* @param {number} [options.thickness=1] ширина линий сетки для дебага
* @param {boolean} [options.debug=false] нужно ли выводить дебаг информацию
*/

var Grid = function(options){

	this.options = Grid.getDefaultOptions();

	for(var o in options){
		if(options.hasOwnProperty(o) && options[o] !== undefined){
			this.options[o] = options[o];
		}
	}

	/**
	* Сколько клеток умещается в карте по одной оси.
	* @type {number}
	*/
	this.density = this.options.density;

	/**
	* Отступ сетки от правого верхнего угла `{x, y}`.
	* @type {object}
	*/
	this.offset = {x: 0, y:0};
	
	/**
	* Количество колонок сетки.
	* @type {number}
	*/
	this.numCols = 0;

	/**
	* Количество строк сетки.
	* @type {number}
	*/
	this.numRows = 0;

	/**
	* Ширина сетки.
	* @type {number}
	*/
	this.width = 0;

	/**
	* Высота сетки.
	* @type {number}
	*/
	this.height = 0;

	/**
	* Высота сетки.
	* @type {number}
	*/
	this.cellWidth = 0;

	/**
	* Высота сетки.
	* @type {number}
	*/
	this.cellHeight = 0;

	/**
	* Ширина линий сетки для дебага.
	* @type {number}
	*/
	this.thickness = this.options.thickness;

	/**
	* Нужно ли выводить дебаг информацию.
	* @type {boolean}
	* @see  {@link Grid#toggleDebugMode}
	* @see  {@link Grid#drawDebug}
	*/
	this.isInDebugMode = this.options.debug;

	/**
	* Текстура дебаг сетки.
	* @type {PIXI.Texture}
	*/
	this.gridTexture = null;

	/**
	* Дебаг сетка.
	* @type {Phaser.TileSprite}
	*/
	this.grid = null;

	/**
	* Группа спрайтов, подсвечивающих клетки, возвращенные из `{@link Grid#at}`,
	* если сетка в режиме дебага.
	* @type {Phaser.Group}
	*/
	this.highlights = null;

	/**
	* Дебаг рамка.
	* @type {Phaser.Graphics}
	*/
	this.border = null;

	this.draw();
};

/**
* Получить опции по умолчанию (см. {@link Grid|Grid options}).
* @static
* @return {object} Опции по умолчанию.
*/
Grid.getDefaultOptions = function(){
	var options = {
		density:4,		//плотность сетки (масштаб - 1:density)
		thickness: 1,	//толщина линий сетки для дебага
		debug: false
	};
	return options;
};

/**
* Расчитывает размеры сетки. Рисует сетку, если `{@link Grid#isInDebugMode}`.
*/
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

	var screenWidth = game.screenWidth,
		screenHeight = game.screenHeight,
		density = this.density,
		width = this.cellWidth = Math.round(skinManager.skin.width/density),
		height = this.cellHeight = Math.round(skinManager.skin.height/density);
	
	var offset = this.offset = {
		x: Math.round(screenWidth%width/2),
		y: Math.round(screenHeight%height/2)
	};

	this.numCols = Math.floor(screenWidth/width);
	this.numRows = Math.floor(screenHeight/height);
	this.width = screenWidth - offset.x*2;
	this.height = screenHeight - offset.y*2;

	if(this.isInDebugMode){
		this._drawDebug(offset, width, height);
	}
};

/**
* Возвращает координаты ячейки.
* @param  {number} [col=0]    колонка ячейки
* @param  {number} [row=0]   строка ячейки
* @param  {number} [offsetX=0] отступ слева
* @param  {number} [offsetY=0] отступ сверху
* @param  {string} [align='top left']   Выравнивание, если считать выравниваемый объект
* картой в вертикальном положении.  
* Формат аналогичен css `background-align`.
* Если указать только вертикальное выравнивание, горизонтальное будет `center`.
* @return {object}         Координаты `{x, y}`
*/
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
		align = [validAlignVertical[0], validAlignHorizontal[0]];
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
		game.world.bringToTop(this.highlights);
	}
	return {x: x + offsetX, y: y + offsetY};
};

/**
* Переключает вывод дебаг информации.
*/
Grid.prototype.toggleDebugMode = function(){
	this.isInDebugMode = !this.isInDebugMode;
	this.draw();
};

/**
* Рисует сетку для дебага.
* @private
* @param  {object} offset отступ от края `{x, y}`
* @param  {number} width  ширина
* @param  {number} height высота
*/
Grid.prototype._drawDebug = function(offset, width, height){
	var screenWidth = game.screenWidth,
		screenHeight = game.screenHeight,
		grid = game.make.graphics(0, 0),
		thickness = this.thickness;

	//grid.lineStyle(thickness, 0x2BC41D, 1);
	grid.lineStyle(thickness, 0xffffff, 1);
	grid.drawRect(0, 0, width-thickness, height-thickness);
	this.gridTexture = grid.generateTexture();
	this.grid = game.add.tileSprite(0, 0, screenWidth, screenHeight, this.gridTexture);
	this.grid.alpha = 0.3;

	this.highlights = game.add.group();

	this.grid.tilePosition = offset;

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

	background.add(this.grid);
	background.add(this.border);
};