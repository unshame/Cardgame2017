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

Menu.prototype = Object.create(Phaser.Group.prototype);
Menu.prototype.constructor = Menu;

/**
 * Выполняет callback для каждого элемента меню.
 * @param  {function} callback  Выполняется для каждого элемента, имеет три параметра `element, i, len`.
 * @param  {boolean}   [includeSpecial] Нужно ли включать в цикл специальные элементы из {@link Menu#specialElements}.
 */
Menu.prototype.forEachElement = function(callback, includeSpecial){
	var ii = 0, i = 0;
	var len = includeSpecial ? this.elements.length : this.elements.length - this.specialElements.length;

	for(; i < this.elements.length; i++){
		var element = this.elements[i];

		if(~this.specialElements.indexOf(element) && !includeSpecial)
			continue;

		callback.call(this, this.elements[i], ii, len);
		ii++;
	}
};

/**
 * Возвращает элемент меню с указанным именем.
 * @param  {string} name   Имя элемента.
 * @return {DisplayObject} Элемент с `name`, равным указанному.
 */
Menu.prototype.getElementByName = function(name){
	for (var i = 0; i < this.elements.length; i++){

		if (this.elements[i].name === name){
			return this.elements[i];
		}

	}
	return null;
};

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
 * Прячет элемент меню с указанным именем.
 * Чтобы элемент прятался только при следующем открытии меню, нужно предварительно запустить `fadeOut`.
 * @param  {string} name   Имя элемента.
 */
Menu.prototype.hideElement = function(name){
	var el = this.getElementByName(name);
	var i = this.hiddenElements.indexOf(el);

	if(!el || ~i)
		return;

	this.hiddenElements.push(el);
	if(this._fading != -1){
		el.hide();

		if(this.visible){
			this.updatePosition();
		}
	}
};

/** 
 * Прячет элемент меню с указанным именем.
 * Чтобы элемент показывался только при следующем открытии меню, нужно предварительно запустить `fadeOut`.
 * @param  {string} name   Имя элемента.
 */
Menu.prototype.showElement = function(name){
	var el = this.getElementByName(name);
	var i = this.hiddenElements.indexOf(el);

	if(!el || !~i)
		return;

	this.hiddenElements.splice(i, 1);

	if(this._fading != -1){
		el.show();

		if(this.visible){
			this.updatePosition();
		}
	}
};

/**
 * Отключает элемент с указанным именем.
 * @param  {string} name   Имя элемента.
 */
Menu.prototype.disableElement = function(name){
	var el = this.getElementByName(name);
	var i = this.disabledElements.indexOf(el);

	if(!el || ~i)
		return;

	this.disabledElements.push(el);
	el.disable();
};

/**
 * Включает элемент с указанным именем.
 * @param  {string} name   Имя элемента.
 */
Menu.prototype.enableElement = function(name){
	var el = this.getElementByName(name);
	var i = this.disabledElements.indexOf(el);

	if(!el || !~i)
		return;

	this.disabledElements.splice(i, 1);
	el.enable();
};

/**
 * Создает и добавляет кнопку {@link Button} к элементам меню.
 */
Menu.prototype.addButton = function (action, name, text, context) {
	var button = new Button({
		color: this.options.elementColor,
		textColor: this.options.textColor,
		size: 'wide',
		action: action,
		text: text,
		name: name,
		context: (context === false) ? undefined : (context || this),
		group: this
	});
	button.disable(true);
	this.elements.push(button);
	this.add(button);
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

/** Плавно скрывает меню. */
Menu.prototype.fadeOut = function(){
	if(this._fading == -1){
		return;
	}

	this._stopFader();
	this._fading = -1;

	this.disable(true);

	this._fader = game.add.tween(this);
	this._fader.to({alpha: 0}, this.options.fadeTime);
	this._fader.onComplete.addOnce(function(){
		this._fading = 0;
		this._fader = null;
		this._hide();
	}, this);
	this._fader.start();
};

/** Плавно показывает меню. */
Menu.prototype.fadeIn = function(){
	if(this._fading == 1){
		return;
	}

	this._stopFader();
	this._fading = 1;

	this._show();
	this.alpha = 0;

	this._fader = game.add.tween(this);
	this._fader.to({alpha: 1}, this.options.fadeTime);
	this._fader.onComplete.addOnce(function(){
		this._fading = 0;
		this._fader = null;		
		this.enable();
	}, this);
	this._fader.start();
};

/** Плавно показывает или скрывает меню в зависимости от текущего состояния. */
Menu.prototype.fadeToggle = function(){
	switch(this._fading){
		case 0:
		if(this.visible){
			this.fadeOut();
		}
		else{
			this.fadeIn();
		}
		break;

		case 1:
		this.fadeOut();
		break;

		case -1:
		this.fadeIn();
		break;
	}
};

/**
 * Останавливает анимацию меню.
 * @private
 */
Menu.prototype._stopFader = function(){
	if(!this._fader)
		return;
	this._fader.stop();
	this._fader = null;
	this._fading = 0;
};

/**
 * Прячет меню.
 * @private
 */
Menu.prototype._hide = function(){
	this.visible = false;
};

/**
 * Показывает и обновляет позицию меню.
 * @private
 */
Menu.prototype._show = function(){
	this.visible = true;
	this.updatePosition();
};

/** Прячет меню, останавливая анимацию и убирая возможность нажимать на элементы. */
Menu.prototype.hide = function(){
	this._stopFader();
	this.alpha = 0;
	this._hide();
	this.disable(true);
};

/** Показывает меню, останавливая анимацию и давая возможность нажимать на элементы. */
Menu.prototype.show = function(){
	this._stopFader();
	this.alpha = 1;
	this._show();
	this.enable();
};

/** 
 * Отключает элементы меню.
 * @param  {boolean} changeToDefaultFrame заставляет элемент переключиться на дефолтный кадр текстуры, 
 *                                        вместо кадра, соответствующего отключенному состоянию
 */
Menu.prototype.disable = function(changeToDefaultFrame){
	this.forEachElement(function(element){
		element.disable(changeToDefaultFrame);
	}, true);
};

/** Включает элементы игры, не входящие в {@link Menu#disabledElements} */
Menu.prototype.enable = function(){
	this.forEachElement(function(element){
		if(~this.disabledElements.indexOf(element))
			return;

		element.enable();
	}, true);
};

/** Переключает видимость меню */
Menu.prototype.toggle = function(){
	if(this.visible){
		this.hide();
	}
	else{
		this.show();
	}
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