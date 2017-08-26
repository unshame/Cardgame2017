/**
* Меню.
* @class
* @param {object} options Опции.
* @extends {external:Phaser.Group}
*/
var Menu = function(options){

	/**
	* Переданные при создании меню опции.
	* @type {object}
	*/
	this.options = mergeOptions(this.getDefaultOptions(), options);

	Phaser.Group.call(this, game);

	/**
	* Имя меню.
	* @type {string}
	*/
	this.name = this.options.name;

	/**
	* Видимость меню.
	* @type {Boolean}
	*/
	this.visible = false;

	/**
	* Фон меню.
	* @type {Phaser.Image}
	*/
	this.background = game.make.image(0, 0);
	this.background.alpha = this.options.alpha;
	this.background.inputEnabled = true;
	this.add(this.background);

	/**
	* Твин анимации фейда меню.
	* @type {Phaser.Tween}
	*/
	this._fader = null;
	/**
	* Направление анимации фейда
	* (-1 - скрывается, 0 - стоит на месте, 1 - показывается).
	* @type {number}
	*/
	this._fading = 0;

	/**
	* Элементы меню.
	* @type {Array}
	*/
	this.elements = [];
	/**
	* Элементы меню, которые не влияют на размер меню.
	* @type {Array}
	*/
	this.specialElements = [];
	/**
	* Скрытые элементы меню.
	* @type {Array}
	*/
	this.hiddenElements = [];
	/**
	* Отключенные элементы меню.
	* @type {Array}
	*/
	this.disabledElements = [];

	this.layout = [];

	/**
	* Графика фона меню.
	* @type {Phaser.BitmapData}
	*/
	this._bitmapArea = game.make.bitmapData();
	if(this.options.texture){
		var image = game.cache.getImage(this.options.texture);
		/**
		* Повторяющаяся текстура фона меню.
		* @type {CanvasPattern}
		*/
		this._pattern = this._bitmapArea.ctx.createPattern(image, 'repeat');
	}

	this._elementTypeMap = this._getTypeMap();

	ui.layers.addExistingLayer(this, this.options.z);	

	if(this.options.header){
		this.header = game.add.text(0, 0, this.options.header, {fill: this.options.headerTextColor, font: '24px Exo'}, this);
		this.header.anchor.set(0.5, 0.5);
		this.add(this.header);
	}

	if(this.options.closeButton){
		this.addCloseButton(this.options.closeButton);
	}

	if(this.options.layout){
		this.createLayout(this.options.layout);
	}
};

extend(Menu, Phaser.Group);

/** 
* Опции по умолчанию
* @return {object} опции
*/
Menu.prototype.getDefaultOptions = function(){
	return {
		position: {
			x: 0,
			y: 0
		},
		z: 0,
		margin: 25,
		name: 'default',
		alpha: 0.9,
		color: 'grey',
		texture: null,
		elementColor: 'orange',
		textColor: 'white',
		corner: 10,
		border: 4,
		fadeTime: 200,
		layout: null,
		closeButton: null,
		header: false,
		headerHeight: 40,
		headerColor: 'orange',
		headerTextColor: 'white'
	};
};

/**
* Возвращает объект с функциями для создания элементов по названию элемента.
* @return {object}
*/
Menu.prototype._getTypeMap = function(){
	return {
		button: this._addButton.bind(this),
		// slider: this._addSlider.bind(this),
		// add more
	};
};

/**
* Возвращает объект с настройками кнопки для передачи в {@link Menu#createLayout}.
* @static
* @param  {object} options настройки кнопки
*/
Menu.button = function(options){
	return {
		type: 'button',
		options: options
	};
};

/*Menu.slider = function(options){
	return {
		type: 'slider',
		options: options
	};
};*/

/**
* Возвращает массив с настройками элементов для передачи в {@link Menu#createLayout},
* как строка с выравниванием по левому краю.
* @static
* @param {...object} options опции элементов меню
* @return {array} Возвращает массив с настройками элементов и флагом выравнивания.
*/
Menu.alignLeft = function(){
	var row = [];
	row.align = 'left';
	for(var i = 0, len = arguments.length; i < len; i++){
		row.push(arguments[i]);
	}
	return row;
};

/**
* Возвращает массив с настройками элементов для передачи в {@link Menu#createLayout},
* как строка с выравниванием по левому краю.
* @static
* @param {...object} options опции элементов меню
* @return {array} Возвращает массив с настройками элементов и флагом выравнивания.
*/
Menu.alignRight = function(){
	var row = [];
	row.align = 'right';
	for(var i = 0, len = arguments.length; i < len; i++){
		row.push(arguments[i]);
	}
	return row;
};

/**
* Рисует фон меню
* @static
* @param {Phaser.BitmapData} bitmap где рисовать
* @param {number}            width  ширина
* @param {number}            height высота
* @param {number}            x      отступ по краям по горизонтали
* @param {number}            y      отступ по краям по вертикали
* @param {string}            color  цвет фона
* @param {(boolean|number)}  header нужно ли рисовать шапку для названия меню
*/
Menu.drawPanel = function(bitmap, width, height, x, y, color, header, headerColor){
	var ctx = bitmap.ctx;
	var corner = game.cache.getImage('panel_' + color + '_corners');
	var cs = 8;
	var bs = 2;
	var dif = cs - bs*2;
	var colors = ui.colors.menu[color];
	var offset = 0;
	if(header){
		if(typeof header == 'number' && !isNaN(header)){
			offset = header;
		}
		else{
			offset = 40;
		}
		height += offset;
	}
	bitmap.clear();
	bitmap.resize(width, height);

	if(header){
		var headerCorner = game.cache.getImage('panel_' + headerColor + '_corners');
		var headerColors = ui.colors.menu[headerColor];

		ctx.fillStyle = headerColors.background;
		ctx.fillRect(x + bs, y + bs, width - x*2 - bs*2, offset + cs);

		ctx.drawImage(headerCorner, 0, 0, cs, cs, x, y, cs, cs);
		ctx.drawImage(headerCorner, cs, 0, cs, cs, width - x*2 - cs, y, cs, cs);

		ctx.fillStyle = headerColors.outer;
		ctx.fillRect(x + cs, y, width - x*2 - cs*2, bs);
		ctx.fillRect(x, y + cs, bs, offset + cs);
		ctx.fillRect(width - x - cs + dif + bs, y + cs, bs, offset + cs);

		ctx.fillStyle = headerColors.inner;
		ctx.fillRect(x + cs, y + bs, width - x*2 - cs*2, bs);	
		ctx.fillRect(x + bs, y + cs, bs, offset + cs);
		ctx.fillRect(width - x - cs + dif, y + cs, bs, offset + cs);
	}

	ctx.fillStyle = colors.background;
	ctx.fillRect(x + bs, offset + y + bs, width - x*2 - bs*2, height - offset - y*2 - bs*2);

	ctx.drawImage(corner, 0, 0, cs, cs, x, offset + y, cs, cs);
	ctx.drawImage(corner, cs, 0, cs, cs, width - x*2 - cs, offset + y, cs, cs);
	ctx.drawImage(corner, 0, cs, cs, cs, x, height - y*2 - cs, cs, cs);
	ctx.drawImage(corner, cs, cs, cs, cs, width - x*2 - cs, height - y*2 - cs, cs, cs);

	ctx.fillStyle = colors.outer;
	ctx.fillRect(x + cs, offset + y, width - x*2 - cs*2, bs);	
	ctx.fillRect(x + cs, height - y - cs + dif + bs, width - x*2 - cs*2, bs);	
	ctx.fillRect(x, offset + y + cs, bs, height - offset - y*2 - cs*2);
	ctx.fillRect(width - x - cs + dif + bs, offset + y + cs, bs, height - offset - y*2 - cs*2);

	ctx.fillStyle = colors.inner;
	ctx.fillRect(x + cs, offset + y + bs, width - x*2 - cs*2, bs);	
	ctx.fillRect(x + cs, height - y - cs + dif, width - x*2 - cs*2, bs);	
	ctx.fillRect(x + bs, offset + y + cs, bs, height - offset - y*2 - cs*2);
	ctx.fillRect(width - x - cs + dif, offset + y + cs, bs, height - offset - y*2 - cs*2);

	//ctx.fillStyle = ;
	//ctx.fillStyle = ;

	bitmap.update();
};

//@include:MenuPosition
//@include:MenuState
//@include:MenuElement
//@include:MenuAdd
//@include:MenuFader