/**
* Модуль, отвечающий за расчет и установку размеров контейнера игры и ее масштаба.  
* Создает сетку по размеру карт для расположения элементов игры.
* @class
* @extends {Phaser.ScaleManager}
* @param {object}  [options]                Опции
* @param {Game}    options.game=game        игра
* @param {width}   options.width=0          текущая ширина игры для Phaser.ScaleManager
* @param {height}  options.height=0         текущая высота игры для Phaser.ScaleManager
* @param {number}  options.density=4        сколько клеток умещается в карте по одной оси
* @param {number}  options.thickness=1      ширина линий сетки для дебага
* @param {boolean} options.debug=false      нужно ли выводить дебаг информацию
* @param {number}  options.minColsLandscape минимальное число колонок сетки в горизонтальном режиме
* @param {number}  options.minRowsLandscape минимальное число строк сетки в горизонтальном режиме
* @param {number}  options.minColsPortrait  минимальное число колонок сетки в вертикальном режиме
* @param {number}  options.minRowsPortrait  минимальное число строк сетки в вертикальном режиме
* @see {@link http://phaser.io/docs/2.6.2/Phaser.ScaleManager.html}
*/

var ScaleManager = function(options){

	this.options = mergeOptions(this.getDefaultOptions(), options);

	Phaser.ScaleManager.call(this, this.options.game, this.options.width, this.options.height);

	this._minColsLandscape = this.options.minColsLandscape;
	this._minRowsLandscape = this.options.minRowsLandscape;
	this._minColsPortrait = this.options.minColsPortrait;
	this._minRowsPortrait = this.options.minRowsPortrait;
	this._cellRelationThreshold = this.options.cellRelationThreshold;

	/**
	* Сколько клеток умещается в карте по одной оси.
	* @type {number}
	*/
	this.density = this.options.density;

	/**
	* Отступ сетки от левого верхнего угла `{x, y}`.
	* @type {object}
	*/
	this.gridOffset = {x: 0, y:0};
	
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
	this.gridWidth = 0;

	/**
	* Высота сетки.
	* @type {number}
	*/
	this.gridHeight = 0;

	/**
	* Ширина сетки.
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
	* @private
	*/
	this._thickness = this.options.thickness;

	/**
	* Нужно ли выводить дебаг информацию.
	* @type {boolean}
	* @see  {@link ScaleManager#toggleDebugMode}
	* @see  {@link ScaleManager#drawDebug}
	*/
	this.inDebugMode = this.options.debug;

	/**
	* Текстура дебаг сетки.
	* @type {PIXI.Texture}
	* @private
	*/
	this._gridTexture = null;

	/**
	* Дебаг сетка.
	* @type {Phaser.TileSprite}
	* @private
	*/
	this._debugGrid = null;

	/**
	* Группа спрайтов, подсвечивающих клетки, возвращенные из `{@link ScaleManager#at}`,
	* если сетка в режиме дебага.
	* @type {Phaser.Group}
	* @private
	*/
	this._highlights = null;

	/**
	* Дебаг рамка.
	* @type {Phaser.Graphics}
	* @private
	*/
	this._border = null;

	/**
	* Был ли совершен переход из\в полный экран.  
	* Сообщает игре, что не нужно дебаунсить обновление позиций элементов.
	* @type {Boolean}
	*/
	this.fullScreenModeChanged = false;
};

extend(ScaleManager, Phaser.ScaleManager);

/**
* Получить опции по умолчанию (см. {@link ScaleManager|ScaleManager options}).
* @return {object} Опции по умолчанию.
*/
ScaleManager.prototype.getDefaultOptions = function(){
	return {
		game: game,
		width: 0,
		height: 0,
		density:4,		// плотность сетки (масштаб - 1:density)
		thickness: 1,	// толщина линий сетки для дебага
		debug: false,
		minColsLandscape:  28,
		minRowsLandscape: 18,
		minColsPortrait: 23,
		minRowsPortrait: 23,
		cellRelationThreshold: 2.5625
	};
};

/**
* Расчитывает и устанавливает размер контейнера игры,
* перерисовывает сетку.
*/
ScaleManager.prototype.updateGameSize = function(){
	this.fullScreenModeChanged = false;
	this._calculateScreenSize();
	this.setGameSize(this.game.screenWidth, this.game.screenHeight);
};

/**
* Расчитывает размеры игры.
* @private
*/
ScaleManager.prototype._calculateScreenSize = function(reduceMinHeight){
	this.cellWidth = Math.round(skinManager.skin.width/this.density);
	this.cellHeight = Math.round(skinManager.skin.height/this.density);

	var container;
	if(this.isFullScreen){
		container = {width: window.innerWidth, height: window.innerHeight};
	}
	else{
		container = document.getElementById(game.parent).getBoundingClientRect();
	}

	var width = container.width/window.devicePixelRatio,
		height = container.height/window.devicePixelRatio,
		widthRel = width/height,
		minWidth, minHeight;

	if(widthRel >= 1){
		if(reduceMinHeight){
			minHeight = (this._minRowsLandscape - 2)*this.cellHeight;
		}
		else{
			minHeight = this._minRowsLandscape*this.cellHeight;
		}
		minWidth = this._minColsLandscape*this.cellWidth;
		this.game.isRawLandscape = true;
	}
	else{
		minWidth = this._minColsPortrait*this.cellWidth;
		minHeight = this._minRowsPortrait*this.cellHeight;
		this.game.isRawLandscape = false;
	}

	if(width*(minHeight/minWidth) > height){
		minWidth = 0;
	}
	else{
		minHeight = 0;
	}
		
	var diffWidth = minWidth - width,
		diffHeight = minHeight - height,
		multWidth = width/minWidth,
		multHeight = height/minHeight;

	var screenWidth = Math.max(width, minWidth);
	var screenHeight = Math.max(height, minHeight);
	
	if(diffWidth > 0){
		screenHeight /= multWidth;
	}
	if(diffHeight > 0){
		screenWidth /= multHeight;
	}

	this._calculateGridSize(screenWidth, screenHeight);

	var cellRelation = this.cellRelation = this.numCols/this.numRows;

	if(!reduceMinHeight && cellRelation >= this._cellRelationThreshold){
		this._calculateScreenSize(true);
		return;
	}

	if(this.inDebugMode){
		console.log('====== Screensize =======');
		console.log(
			'width:', width,
			'height:', height,
			'relation:', widthRel
		);
		console.log(
			'diffWidth:', diffWidth,
			'diffHeight:', diffHeight
		);
		console.log(
			'multWidth:', multWidth,
			'multHeight:', multHeight
		);
		console.log('====== Gridsize ======');		
		console.log(
			'numCols:', this.numCols,
			'numRows:', this.numRows 
		);
		console.log(
			'cell:', this.cellWidth, 'x', this.cellHeight
		);
		console.log('cell relation:', cellRelation, this._cellRelationThreshold);
	}

	this.game.screenWidth = screenWidth;
	this.game.screenHeight = screenHeight;
};

/**
* Расчитывает размеры сетки.
* @private
* @param {number} screenWidth  ширина игры
* @param {number} screenHeight высота игры
*/
ScaleManager.prototype._calculateGridSize = function(screenWidth, screenHeight){
	var width = this.cellWidth,
		height = this.cellHeight;
	
	var offset = this.gridOffset = {
		x: Math.round(screenWidth%width/2),
		y: Math.round(screenHeight%height)
	};
	this.numCols = Math.floor(screenWidth/width);
	this.numRows = Math.floor(screenHeight/height);
	this.gridWidth = screenWidth - offset.x*2;
	this.gridHeight = screenHeight - offset.y*2;
};

/**
* Возвращает координаты ячейки.
* @param {number} [col=0]            колонка ячейки
* @param {number} [row=0]            строка ячейки
* @param {number} [offsetX=0]        отступ слева
* @param {number} [offsetY=0]        отступ сверху
* @param {string} [align='top left'] Выравнивание, если считать выравниваемый объект
*                             		 картой в вертикальном положении.  
* 		                             Формат аналогичен css `background-align`.
* 		         		             Если указать только вертикальное выравнивание, горизонтальное будет `center`.
* 		         		             
* @return {object} Координаты `{x, y}`
*/
ScaleManager.prototype.cellAt = function(col, row, offsetX, offsetY, align){

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

	var x = (col - adjustCol)*this.cellWidth + this.gridOffset.x ,
		y = (row - adjustRow)*this.cellHeight + this.gridOffset.y ;

	if(this._highlights){
		var highlight = this.game.add.sprite(0, 0, this._gridTexture);	
		this._highlights.add(highlight);
		highlight.tint = 0x2DD300;
		highlight.position.x = x;
		highlight.position.y = y;
		this.game.world.bringToTop(this._highlights);
	}
	return {x: x + offsetX, y: y + offsetY};
};

/**
* Переключает вывод дебаг информации.
*/
ScaleManager.prototype.toggleDebugMode = function(){
	this.inDebugMode = !this.inDebugMode;
	options.set('debug_grid', this.inDebugMode);
	options.save();
	this.drawDebugGrid();
};

/**
* Рисует сетку для дебага.
* @private
* @param {object} offset отступ от края `{x, y}`
* @param {number} width  ширина
* @param {number} height высота
*/
ScaleManager.prototype.drawDebugGrid = function(){

	if(this._border){
		this._border.destroy();
		this._border = null;
	}
	if(this._debugGrid){
		this._debugGrid.destroy();
		this._debugGrid = null;
	}
	if(this._highlights){
		this._highlights.destroy(true);
		this._highlights = null;
	}

	if(!this.inDebugMode)
		return;

	var offset = this.gridOffset,
		width = this.cellWidth,
		height = this.cellHeight;

	var screenWidth = this.game.screenWidth,
		screenHeight = this.game.screenHeight,
		debugGrid = this.game.make.graphics(0, 0),
		thickness = this._thickness;

	// debugGrid.lineStyle(thickness, 0x2BC41D, 1);
	debugGrid.lineStyle(thickness, 0xffffff, 1);
	debugGrid.drawRect(0, 0, width-thickness, height-thickness);
	this._gridTexture = debugGrid.generateTexture();
	this._debugGrid = this.game.add.tileSprite(0, 0, screenWidth, screenHeight, this._gridTexture);
	this._debugGrid.alpha = 0.3;

	this._highlights = this.game.add.group();

	this._debugGrid.tilePosition = offset;

	var x = offset.x,
		y = offset.y,
		// color = 0xC10BAC,
		color = 0x000000,
		alpha = 1;
	
	var border = this._border = this.game.add.graphics(0, 0);
	border.lineStyle(y, color, alpha);
	border.moveTo(0, y/2 - thickness/2);
	border.lineTo(screenWidth, y/2 - thickness/2);
	border.lineStyle(x, color, alpha);
	border.moveTo(screenWidth - x/2 + thickness/2, 0);
	border.lineTo(screenWidth - x/2 + thickness/2, screenHeight);
	// border.lineStyle(y, color, alpha);
	// border.moveTo(screenWidth, screenHeight - y/2 + thickness/2);
	// border.lineTo(0,screenHeight - y/2 + thickness/2);
	border.lineStyle(x, color, alpha);
	border.moveTo(x/2 - thickness/2, screenHeight);
	border.lineTo(x/2 - thickness/2,0);

	ui.background.add(this._debugGrid);
	ui.background.add(this._border);
};

ScaleManager.prototype.toggleFullScreen = function(){
	this.fullScreenModeChanged = true;
	if (this.isFullScreen){
		ui.cornerButtons.getByName('fullscreen').label.frame = 0;
		this.stopFullScreen();
	}
	else{
		ui.cornerButtons.getByName('fullscreen').label.frame = 1;
		this.startFullScreen();
	}
};