/**
* Компонент, добавляющий текст при наведении к указанному элементу.
* @class
* @param {DisplayObject} displayObject Элемент, который будет обрабатывать наведение курсора.
* @param {string}        [placement]   Позиция всплывающего текста. Если не указать, текст будет следовать за курсором.
*/
UI.PopupComponent = function(displayObject, placement){

	/**
	* Оповещает {@link PopupManager}, что нужно обновить текст при наведении.
	* @type {Boolean}
	*/
	this._hoverTextChanged = false;

	/**
	* Элемент, который будет обрабатывать наведение курсора.
	* @type {[type]}
	*/
	this.popupArea = displayObject;
	this.popupArea.inputEnabled = true;

	if(Phaser.Device.desktop){
		this.popupArea.events.onInputOver.add(this._notifyPopupManager.bind(this), this);
	}
	else{
		this.popupArea.events.onInputDown.add(this._notifyPopupManager.bind(this, true));
		this.popupArea.events.onInputUp.add(ui.popupManager.hoverOut.bind(ui.popupManager));
	}
	this.popupArea.events.onInputOut.add(ui.popupManager.hoverOut.bind(ui.popupManager));

	/**
	* Позиция всплывающего текста.
	* @type {string}
	*/
	this.popupPlacement = placement;
};

UI.PopupComponent.prototype = {
	/**
	* Используется вместе с {@link PopupManager}'ом, чтобы получить текст для вывода на экран.
	* @param  {boolean} anyway предоставить текст, даже если он не изменился
	* @return {(string|boolean)}        Возвращает строку для вывода или `false`, если текст не изменился.
	*/
	getHoverText: function(anyway){
		if(!this._hoverTextChanged && !anyway){
			return false;
		}
		this._hoverTextChanged = false;
		return this.getCustomHoverText();
	},

	/**
	* Возвращает текст для вывода на экран.
	* @abstract
	* @return {string}
	*/
	getCustomHoverText: function(){
		throw new Error('Must be implemented');
	},

	/**
	* Оповещает {@link PopupManager} о том, что курсор находится над элементом.
	* @param  {boolean} now нужно ли вывести сообщение сразу
	*/
	_notifyPopupManager: function(now){
		ui.popupManager.hoverOver(this, this.getHoverText(true), now);
	}
};
