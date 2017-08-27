/**
* Менеджер текста при наведении на элементы игры.
* @class
* @extends {Phaser.Group}
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

	this.offset = 5;

	/**
	* Показывается ли текст.
	* @type {Boolean}
	*/
	this.showing = false;

	/**
	* Плашка/фон текста.
	* @type {Phaser.Image}
	*/
	this.background = game.make.image(0, 0);
	this.add(this.background);

	/**
	* BitmapData фона.
	* @type {Phaser.BitmapData}
	*/
	this._bitmapData = game.make.bitmapData();

	/**
	* Текст.
	* @type {Phaser.Text}
	*/
	this.text = game.add.text(0, 0, 'Test popup', {fill: 'black', font: '18px Exo', wordWrap: true, wordWrapWidth: 250, align: 'center'}, this);
	this.text.anchor.set(0.5, 0.5);
	this.text.setShadow(1, 1, 'rgba(0,0,0,0.5)', 3);

	this.visible = false;
};

extend(UI.PopupManager, Phaser.Group);

/**
* Запускает таймер до показа текста при наведении на элемент.
* @param  {DisplayObject} el элемент, над которым находится курсор
* @param  {string} text текст, который нужно показать
* @param  {boolean} now  показывает текст без задержки
*/
UI.PopupManager.prototype.hoverOver = function(el, text, now){
	if(this.overElement == el){
		return;
	}
	this.overElement = el;
	this.overText = text;
	this._resetDelay();
	if(now){
		this._showPopup();
	}
	else{
		this.delay = setTimeout(this._showPopup.bind(this), this.delayTime);
	}
};

/** Убирает текст при наведении или отменяет запланированный показ текста. */
UI.PopupManager.prototype.hoverOut = function(){
	if(!this.overElement){
		return;
	}
	if(this.showing){
		this.showing = false;
		this.visible = false;
	}
	this.overElement = null;
	this.overText = null;
	this._resetDelay();
};

/** Обновляет и показывает попап с текстом */
UI.PopupManager.prototype._showPopup = function(){
	this.showing = true;
	this._updateText(this.overText);
	this.updatePosition();
};

/** 
* Обновляет текст и фон текста.
* @param  {string} text новый текст
*/
UI.PopupManager.prototype._updateText = function(text){
	this.text.setText(text);
	Menu.drawPanel(
		this._bitmapData, 
		this.text.width + this.margin*2, 
		this.text.height + this.margin*2, 
		0, 
		0, 
		'grey'
	);
	this.background.loadTexture(this._bitmapData);

	this.text.x = this.background.width/2;
	this.text.y = this.background.height/2 + 3;
};

/** Обновляет позицию текста в соответствии с позицией курсора. */
UI.PopupManager.prototype.updatePosition = function(){
	if(!this.showing){
		return;
	}
	if(!ui.cursor.inGame || !this.overElement){
		this.hoverOut();
		return;
	}
	if(!this.visible){
		this.visible = true;
	}
	var text = this.overElement.getHoverText();
	if(text){
		this._updateText(text);
	}
	var position = this._getPopupPosition();

	this.x = position.x;
	this.y = position.y;
};

UI.PopupManager.prototype._getPopupPosition = function(){
	if(!this.overElement){
		return {};
	}
	var popupArea = this.overElement.popupArea;
	switch(this.overElement.popupPlacement){

		case 'right':
		x = popupArea.parent.x + popupArea.x + popupArea.width + this.offset;
		y = popupArea.parent.y + popupArea.y + popupArea.height/2 - this.background.height/2;
		break;

		case 'left':
		x = popupArea.parent.x + popupArea.x - this.background.width - this.offset;
		y = popupArea.parent.y + popupArea.y + popupArea.height/2 - this.background.height/2;
		break;

		case 'top':
		x = popupArea.parent.x + popupArea.x - this.background.width/2;
		y = popupArea.parent.y + popupArea.y - this.background.height - this.offset;
		break;

		case 'bottom':
		x = popupArea.parent.x + popupArea.x - this.background.width/2;
		y = popupArea.parent.y + popupArea.y + ui.cursor.height + this.offset;
		break;

		case 'middle':
		x = popupArea.parent.x + popupArea.x + popupArea.width/2 - this.background.width/2;
		y = popupArea.parent.y + popupArea.y + popupArea.height/2 - this.background.height/2;
		break;

		default:
		x = Math.max(Math.min(game.input.x - this.background.width/2, game.screenWidth - this.background.width), 0);
		y = Math.min(game.input.y - this.background.height - this.offset, game.screenHeight - this.background.height);
		if(y < 0){
			y = Math.max(game.input.y + ui.cursor.height + this.offset, 0);
		}

		break;
	}
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