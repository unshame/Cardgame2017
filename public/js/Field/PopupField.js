/**
* Поле стола с сообщением при наведении.
* @class
* @extends {Field.IconField}
* @param {object} options
* @param {object} style
* @param {object} popupStyle настройки сообщения при наведении
* @param {object} iconStyle
*/
Field.PopupField = function(options, style, popupStyle, iconStyle){
	Field.IconField.call(this, options, style, iconStyle);

	this.popupStyle = mergeOptions(this.getPopupDefaultOptions(), popupStyle);

	UI.PopupComponent.call(this, this[this.popupStyle.area]);
};

extend(Field.PopupField, Field.IconField);

mixin(Field.PopupField, [UI.PopupComponent]);

Field.PopupField.prototype.getPopupDefaultOptions = function(){
	return {
		numCardsText: 'Cards',
		area: 'area',
		getTextFunction: null
	};
};

Field.PopupField.prototype.getCustomHoverText = function(anyway){
	if(typeof this.popupStyle.getTextFunction == 'function'){
		return this.popupStyle.getTextFunction.call(this);
	}
	else{
		return this.popupStyle.numCardsText + ': ' + this.cards.length;
	}
};

Field.PopupField.prototype.placeCards = function(){
	this._hoverTextChanged = true;
	supercall(Field.PopupField).placeCards.apply(this, arguments);
};

Field.PopupField.prototype.removeCards = function(cardsToRemove){
	this._hoverTextChanged = true;
	supercall(Field.PopupField).removeCards.call(this, cardsToRemove);
};

Field.PopupField.prototype.destroy = function(){
	if(ui.popupManager.overElement == this){
		ui.popupManager.hoverOut();
	}
	supercall(Field.PopupField).destroy.call(this);
};
