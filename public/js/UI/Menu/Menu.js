/**
 * Меню.
 * @class
 * @param {object} options Опции.
 * @extends {Phaser.Group}
 */
var Menu = function(options){

	/**
	 * Переданные при создании меню опции.
	 * @type {object}
	 */
	this.options = mergeOptions(this.getDefaultOptions(), options);

	Phaser.Group.call(this, game);

	this.modal = this.options.modal;

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
	this.background.inputEnabled = true;
	this.background.tint = this.options.color || ui.colors.orange;
	this.add(this.background);

	/**
	 * Твин анимации фейда меню.
	 * @type {Phaser.Tween}
	 * @private
	 */
	this._fader = null;
	/**
	 * Направление анимации фейда
	 * (-1 - скрывается, 0 - стоит на месте, 1 - показывается).
	 * @type {number}
	 * @private
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
	 * @private
	 */
	this._bitmapArea = game.make.bitmapData();
	if(this.options.texture){
		var image = game.cache.getImage(this.options.texture);
		/**
		 * Повторяющаяся текстура фона меню.
		 * @type {CanvasPattern}
		 * @private
		 */
		this._pattern = this._bitmapArea.ctx.createPattern(image, 'repeat');
	}

	ui.layers.addExistingLayer(this, this.options.z, true);	
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
		modal: false,
		margin: 25,
		name: 'default',
		alpha: 0.8,
		color: ui.colors.orange,
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
 * @param  {object} [position] новая позиция меню `{x, y}`.
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
		position = position();
	}

	this.x = position.x - this.background.width/2;
	this.y = position.y - this.background.height/2;

	var y = 0,
		margin = this.options.margin;

	this.forEachElement(function(element, i){
		if(!element.visible)
			return;

		element.updatePosition({x: this.background.width/2 - element.width/2, y: y + margin});
		y += element.height + margin;
	});
};

/**
 * Устанавливает размер фона меню в соответствии с элементами.
 * @private
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

		if(!element.visible)
			return;

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
 * @private
 */
Menu.prototype._createArea = function(width, height){

	drawRoundedRectangle(
		this._bitmapArea,
		width,
		height,
		0,
		0,
		this.options.corner,
		this.options.border,
		this.options.alpha,
		this._pattern || 'rgba(255, 255, 255, 1)',
		'rgba(255, 255, 255, 1)'
	);

	this.background.loadTexture(this._bitmapArea);	
};

//@include:MenuState
//@include:MenuElement
//@include:MenuAdd
//@include:MenuFader