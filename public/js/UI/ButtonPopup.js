/**
* Кнопка с текстом при наведении.
* @class 
* @extends {UI.Button}
* @param {object} options
*/
UI.ButtonPopup = function(options){
	options.mobileClickProtect = true;
	UI.Button.call(this, options);
	UI.PopupComponent.call(this, this, this.options.hoverPlacement || 'right');
	this.options.hoverText = options.hoverText;
};

extend(UI.ButtonPopup, UI.Button);

mixin(UI.ButtonPopup, [UI.PopupComponent]);

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

UI.ButtonPopup.prototype.getCustomHoverText = function(){
	return this.options.hoverText;
};
