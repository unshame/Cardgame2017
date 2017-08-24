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

	ui.layers.addExistingLayer(this, this.options.z);	
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
		fadeTime: 200
	};
};

/**
* Позиционирует меню и элементы.
* @param {object} [position] новая позиция меню `{x, y}`.
*/
Menu.prototype.updatePosition = function(position){
	this._resize();

	if(position){
		this.options.position = position;
	}
	else{
		position = this.options.position;
	}

	if(typeof position == 'function'){
		position = position(this.background.width, this.background.height);
	}

	this.x = position.x - this.background.width/2;
	this.y = position.y - this.background.height/2;

	var y = 0,
		margin = this.options.margin;

	this.forEachElement(function(element, i){
		if(!element.visible){
			return;
		}

		element.updatePosition({x: this.background.width/2 - element.width/2, y: y + margin});
		y += element.height + margin;
	});
};

/**
* Устанавливает размер фона меню в соответствии с элементами.
*/
Menu.prototype._resize = function(){
	var width = 0,
		height = 0,
		margin = this.options.margin;

	this.forEachElement(function(element, i, len){
		var h = this.hiddenElements.indexOf(element);

		if(element.visible && ~h){
			element.hide();
		}
		else if(!element.visible && !~h){
			element.show();
		}

		if(!element.visible){
			return;
		}

		height += element.height;

		if(i < len - 1){
			height += margin;
		}

		if(width < element.width){
			width = element.width;
		}
	});

	this._createArea(width + margin*2, height + margin*2);
};

/**
* Рисует фон меню.
*/
Menu.prototype._createArea = function(width, height){

	drawPanel(this._bitmapArea, width, height, 0, 0, this.options.color);

	this.background.loadTexture(this._bitmapArea);	
};

//@include:MenuState
//@include:MenuElement
//@include:MenuAdd
//@include:MenuFader