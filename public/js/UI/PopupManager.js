/**
* Менеджер текста при наведении на элементы игры.
* @class
* @extends {external:Phaser.Group}
*/
UI.PopupManager = function(){
	Phaser.Group.call(this, game, null, 'popupManager');

	/**
	* Таймер задержки до показа текста.
	* @type {number}
	*/
	this.delay = null;

	/**
	* Задержка до показа текста.
	* @type {Number}
	*/
	this.delayTime = 200;

	/**
	* Отступ от краев плашки до текста.
	* @type {Number}
	*/
	this.margin = 10;

	/**
	* Отступ от курсора/элемента.
	* @type {Number}
	*/
	this.offset = Phaser.Device.desktop ? 5 : 50;

	/**
	* Показывается ли текст.
	* @type {Boolean}
	*/
	this.showing = false;

	/**
	* BitmapData фона.
	* @type {Phaser.BitmapData}
	*/
	this._bitmapData = game.make.bitmapData();

	/**
	* Плашка/фон текста.
	* @type {Phaser.Image}
	*/
	this.background = game.make.image(0, 0, this._bitmapData);
	this.add(this.background);

	/**
	* Текст.
	* @type {Phaser.Text}
	*/
	this.text = game.add.text(0, 0, '', {fill: 'black', font: '18px Exo, Helvetica', wordWrap: true, wordWrapWidth: 250, align: 'center'}, this);
	this.text.anchor.set(0.5, 0.5);
	this.text.setShadow(1, 1, 'rgba(0,0,0,0.5)', 3);

	this.visible = false;

	/**
	* Элемент, у которого есть `PopupComponent`, который вызвал показ вплывающего текста.
	* @type {any}
	*/
	this.overElement = null;

	/**
	* Элемент, над которым находится курсор.
	* @type {DisplayObject}
	*/
	this.overArea = null;

	/**
	* Функция получения текста или статичный текст.
	* @type {(function|string)}
	*/
	this.overTextGetter = null;

	/**
	* Позиция показа текста.  
	* Может быть `'left', 'right', 'top', 'bottom', 'middle'`.  
	* Отсутствие значение приведет к выводу текста над\под курсором.
	* @type {string}
	*/
	this.overPlacement = null;

	/**
	* Сигнал, отправляемый, когда над элементом с `PopupComponent` проносится курсор.
	* @type {Phaser.Signal}
	*/
	this.onHoverOver = new Phaser.Signal();

	/**
	* Сигнал, отправляемый, когда курсор уходит с элемента с `PopupComponent`.
	* @type {Phaser.Signal}
	*/
	this.onHoverOut = new Phaser.Signal();

	this.onHoverOver.add(this._hoverOver.bind(this));
	this.onHoverOut.add(this._hoverOut.bind(this));
};

extend(UI.PopupManager, Phaser.Group);

/**
* Запускает таймер до показа текста при наведении на элемент.  
* Вызывается при отправке сигнала {@link UI.PopupManager#onHoverOver|onHoverOver}.
* @param {any}               el         {@link UI.PopupComponent#overElement|overElement}
* @param {DisplayObject}     area       {@link UI.PopupComponent#overArea|overArea}
* @param {(function|string)} textGetter {@link UI.PopupComponent#overTextGetter|overTextGetter}
* @param {string}            placement  {@link UI.PopupComponent#overPlacement|overPlacement}
* @param {boolean}           now        показывает текст без задержки
*/
UI.PopupManager.prototype._hoverOver = function(el, area, textGetter, placement, now){
	if(this.overElement == el){
		return;
	}
	this.overElement = el;
	this.overArea = area;
	this.overTextGetter = textGetter;
	this.overPlacement = placement;
	this._resetDelay();
	if(now){
		this._showPopup();
	}
	else{
		this.delay = setTimeout(this._showPopup.bind(this), this.delayTime);
	}
};

/** 
* Убирает текст при наведении или отменяет запланированный показ текста.
* Вызывается при отправке сигнала {@link UI.PopupManager#onHoverOut|onHoverOut}.
* @param  {any} el {@link UI.PopupComponent#overElement|overElement}
*/
UI.PopupManager.prototype._hoverOut = function(el){
	if(!this.overElement || el && el != this.overElement){
		return;
	}
	if(this.showing){
		this.showing = false;
		this.visible = false;
	}
	this.overElement = null;
	this.overArea = null;
	this.overTextGetter = null;
	this.overPlacement = null;
	this._resetDelay();
};

/** Обновляет и показывает попап с текстом */
UI.PopupManager.prototype._showPopup = function(){
	this.showing = true;
	var text = this._getText(true);
	this._updateText(text);
	this.updatePosition();
};

/**
* Получает текст из `overTextGetter`.
* @param  {boolean} anyway передается в `overTextGetter`, сообщает, что нужно вернуть текст, даже если он не изменился
* @return {string} Возвращает текст.
*/
UI.PopupManager.prototype._getText = function(anyway){
	if(typeof this.overTextGetter == 'function'){
		return this.overTextGetter.call(this.overElement, anyway);
	}
	else{
		return this.overTextGetter;
	}
};

/** 
* Обновляет текст и фон текста.
* @param  {string} text новый текст
*/
UI.PopupManager.prototype._updateText = function(text){
	this.text.setText(text, true);
	Menu.drawPanel(
		this._bitmapData, 
		this.text.width + this.margin*2, 
		this.text.height + this.margin*2, 
		0, 
		0, 
		'grey'
	);

	this.text.x = this.background.width/2;
	this.text.y = this.background.height/2 + 3;
};

/** Обновляет позицию текста в соответствии с позицией курсора. */
UI.PopupManager.prototype.updatePosition = function(){
	if(!this.showing){
		return;
	}
	if(!ui.cursor.inGame || !this.overElement){
		this._hoverOut();
		return;
	}
	if(!this.visible){
		this.visible = true;
	}
	var text = this._getText();
	if(text){
		this._updateText(text);
	}
	var position = this._getPopupPosition();

	this.x = position.x;
	this.y = position.y;
};

/**
* Возвращает позицию всплывающего текста в зависимости от `overPlacement`.
* @return {object} `{x, y}`
*/
UI.PopupManager.prototype._getPopupPosition = function(){
	if(!this.overElement){
		return {};
	}
	var popupArea = this.overArea;
	var x, y;
	var ax = popupArea.parent.worldPosition.x + popupArea.x - popupArea.anchor.x*popupArea.width;
	var ay = popupArea.parent.worldPosition.y + popupArea.y - popupArea.anchor.y*popupArea.height;
	switch(this.overPlacement){

		case 'right':
		x = ax + popupArea.width + this.offset;
		y = ay + popupArea.height/2 - this.background.height/2;
		break;

		case 'left':
		x = ax - this.background.width - this.offset;
		y = ay + popupArea.height/2 - this.background.height/2;
		break;

		case 'top':
		x = ax + popupArea.width/2 - this.background.width/2;
		y = ay - this.background.height - this.offset;
		break;

		case 'bottom':
		x = ax + popupArea.width/2 - this.background.width/2;
		y = ay + popupArea.height + this.offset;
		break;

		case 'middle':
		x = ax + popupArea.width/2 - this.background.width/2;
		y = ay + popupArea.height/2 - this.background.height/2;
		break;

		default:
		x = Math.min(game.input.x - this.background.width/2, game.screenWidth - this.background.width);
		y = Math.min(game.input.y - this.background.height - this.offset, game.screenHeight - this.background.height);
		if(y < 0){
			y = Math.max(game.input.y + ui.cursor.height + this.offset, 0);
		}

		break;
	}
	x = Math.max(Math.min(x, game.screenWidth), 0);
	y = Math.max(Math.min(y, game.screenHeight), 0);
	return {x: x, y: y};
};

/** Вызывается игрой, обновляет позицию. */
UI.PopupManager.prototype.update = function(){
	this.updatePosition();
};

/** Отменяет запланированный показ текста. */
UI.PopupManager.prototype._resetDelay = function(){
	if(this.delay){
		clearTimeout(this.delay);
		this.delay = null;
	}
};

//@include:PopupComponent
