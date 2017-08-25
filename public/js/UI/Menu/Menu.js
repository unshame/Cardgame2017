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
		alpha: 0.8,
		color: 'grey',
		texture: null,
		elementColor: 'orange',
		textColor: 'white',
		corner: 10,
		border: 4,
		fadeTime: 200,
		layout: null
	};
};

Menu.prototype._getTypeMap = function(){
	return {
		button: this._addButton.bind(this),
		// slider: this._addSlider.bind(this),
		// add more
	};
}

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

Menu.alignLeft = function(){
	var row = [];
	row.align = 'left';
	for(var i = 0, len = arguments.length; i < len; i++){
		row.push(arguments[i]);
	}
	return row;
};

Menu.alignRight = function(){
	var row = [];
	row.align = 'right';
	for(var i = 0, len = arguments.length; i < len; i++){
		row.push(arguments[i]);
	}
	return row;
};

//@include:MenuPosition
//@include:MenuState
//@include:MenuElement
//@include:MenuAdd
//@include:MenuFader