/**
* Компонент, добавляющий текст при наведении к указанному элементу.
* @class
* @param {DisplayObject} displayObject Элемент, который будет обрабатывать наведение курсора.
* @param {string}        [placement]   Позиция всплывающего текста. Если не указать, текст будет следовать за курсором.
* @param {string}        [text]        Статичное значение всплывающего текста.
*/
UI.PopupComponent = function(displayObject, placement, text){

	/**
	* Ведет к обновлению значения текста при наведении.
	* @type {Boolean}
	*/
	this._hoverTextChanged = false;

	/**
	* Элемент, который будет обрабатывать наведение курсора.
	* @type {DisplayObject}
	*/
	this._popupArea = displayObject;
	this._popupArea.inputEnabled = true;

	if(Phaser.Device.desktop){
		this._popupArea.events.onInputOver.add(this._notifyPopupManager.bind(this), this);
	}
	else{
		this._popupArea.events.onInputDown.add(this._notifyPopupManager.bind(this, true));
		this._popupArea.events.onInputUp.add(ui.popupManager.hoverOut.bind(ui.popupManager));
	}
	this._popupArea.events.onInputOut.add(ui.popupManager.hoverOut.bind(ui.popupManager));

	/**
	* Позиция всплывающего текста.
	* @type {string}
	*/
	this._popupPlacement = placement;

	/**
	* Статичный всплывающий текст.
	* @type {string}
	*/
	this._popupText = text;
};

UI.PopupComponent.prototype = {
	/**
	* Используется вместе с {@link PopupManager}'ом, чтобы получить текст для вывода на экран.
	* @param {boolean} anyway предоставить текст, даже если он не изменился
	*
	* @return {(string|boolean)} Возвращает строку для вывода или `false`, если текст не изменился.
	*/
	_getHoverText: function(anyway){
		if(!this._hoverTextChanged && !anyway){
			return false;
		}
		this._hoverTextChanged = false;
		return this.getCustomHoverText();
	},

	/**
	* Возвращает текст для вывода на экран.  
	* Должно быть перезаписано в наследующем классе, если при вызове конструктора не был указан `text`.
	* @abstract
	* @return {string}
	*/
	getCustomHoverText: function(){
		throw new Error('Must be implemented or static text must be provided to constructor');
	},

	/**
	* Оповещает {@link PopupManager} о том, что курсор находится над элементом.
	* @param  {boolean} now нужно ли вывести сообщение сразу
	*/
	_notifyPopupManager: function(now){
		ui.popupManager.hoverOver(this, this._popupArea, this._popupText || this._getHoverText, this._popupPlacement, now);
	}
};
