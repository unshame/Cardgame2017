/**
* Кнопка с текстом при наведении.
* @class 
* @extends {UI.Button}
* @extends {UI.PopupComponent}
* @param {object}   options
* @param {string}   [options.hoverText]               Статичный текст, выводимый при наведении курсора на кнопку.
* @param {function} [options.hoverTextGetter]         Функция, возвращающая динамический текст при наведении.  
*                                                     Либо `hoverText`, либо `hoverTextGetter` должны присутствовать.
* @param {boolean}  [options.mobileClickProtect=true] На мобильных устройствах можно отменить нажатие кнопки, отведя от нее палец.
*/
UI.ButtonPopup = function(options){
	if(options.mobileClickProtect === undefined){
		options.mobileClickProtect = true;
	}
	UI.Button.call(this, options);
	UI.PopupComponent.call(
		this,
		this.button,
		options.hoverPlacement || 'right',
		options.hoverText
	);
	if(typeof options.hoverTextGetter == 'function'){
		/**
		* Возвращает текст при наведении на кнопку.
		* @method
		*/
		this.getCustomHoverText = options.hoverTextGetter.bind(this);
	}
};

extend(UI.ButtonPopup, UI.Button, [UI.PopupComponent]);

UI.ButtonPopup.prototype.destroy = function(){
	ui.popupManager.onHoverOut.dispatch(this);
	supercall(UI.ButtonPopup).destroy.call(this);
};

UI.ButtonPopup.prototype.disable = function(changeToDefaultFrame){
	ui.popupManager.onHoverOut.dispatch(this);
	supercall(UI.ButtonPopup).disable.call(this, changeToDefaultFrame);
};

UI.ButtonPopup.prototype.hide = function(){
	ui.popupManager.onHoverOut.dispatch(this);
	supercall(UI.ButtonPopup).hide.call(this);
};
