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
	* Графика фона меню.
	* @type {Phaser.BitmapData}
	*/
	this._bitmapArea = game.make.bitmapData();

	/**
	* Фон меню.
	* @type {Phaser.Image}
	*/
	this.background = game.make.image(0, 0, this._bitmapArea);
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

	/**
	* Макет меню.
	* @type {Array}
	*/
	this.layout = [];

	/**
	* Методы добавления элементов по типу элемента.
	* @type {object}
	*/
	this._elementTypeMap = this._getTypeMap();

	ui.layers.addExistingLayer(this, this.options.z);	

	if(this.options.header){
		this.header = game.add.text(0, 0, this.options.header, {fill: this.options.headerTextColor, font: '22px Exo, Helvetica'}, this);
		this.header.anchor.set(0.5, 0.5);
		this.header.setShadow(1, 1, 'rgba(0,0,0,0.5)', 1);
		this.add(this.header);
	}

	if(this.options.closeButton){
		this.addCloseButton(this.options.closeButton);
	}

	if(this.options.layout){
		this.createLayout(this.options.layout);
	}

	this.hide();
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
		closeButtonCrossColor: 'white',
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
		buttonPopup: this._addButtonPopup.bind(this),
		text: this._addText.bind(this),
		checkbox: this._addCheckbox.bind(this),
		stepper: this._addStepper.bind(this),
		inputField: this._addInputField.bind(this),
		// add more
	};
};

//@include:MenuStatic
//@include:MenuPosition
//@include:MenuState
//@include:MenuElement
//@include:MenuAdd
//@include:MenuFader