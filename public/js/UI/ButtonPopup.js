/**
* Кнопка с текстом при наведении.
* @class 
* @extends {UI.Button}
* @extends {UI.PopupComponent}
* @param {object} options
* @param {string} options.hoverText Текст, выводимый при наведении курсора на кнопку.
* @param {boolean} options.mobileClickProtect=true На мобильных устройствах можно отменить нажатие кнопки, отведя от нее палец.
*/
UI.ButtonPopup = function(options){
	if(options.mobileClickProtect === undefined){
		options.mobileClickProtect = true;
	}
	UI.Button.call(this, options);
	UI.PopupComponent.call(this, this, this.options.hoverPlacement || 'right');
	this.options.hoverText = options.hoverText;
};

extend(UI.ButtonPopup, UI.Button, [UI.PopupComponent]);

UI.ButtonPopup.prototype.destroy = function(){
	if(ui.popupManager.overElement == this){
		ui.popupManager.hoverOut();
	}
	supercall(UI.ButtonPopup).destroy.call(this);
};

UI.ButtonPopup.prototype.disable = function(changeToDefaultFrame){
	if(ui.popupManager.overElement == this){
		ui.popupManager.hoverOut();
	}
	supercall(UI.ButtonPopup).disable.call(this, changeToDefaultFrame);
};

UI.ButtonPopup.prototype.hide = function(){
	if(ui.popupManager.overElement == this){
		ui.popupManager.hoverOut();
	}
	supercall(UI.ButtonPopup).hide.call(this);
};

/**
* Возвращает текст, заданный в `options.hoverText`, для вывода при наведении курсора.
* @return {string}
*/
UI.ButtonPopup.prototype.getCustomHoverText = function(){
	return this.options.hoverText;
};
