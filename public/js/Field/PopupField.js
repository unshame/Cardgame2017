var PopupField = function(options, style, popupStyle, iconStyle){
	IconField.call(this, options, style, iconStyle);

	this.popupStyle = mergeOptions(this.getPopupDefaultOptions(), popupStyle);

	this._hoverTextChanged = false;

	var popupArea = this[this.popupStyle.area];
	popupArea.inputEnabled = true;

	if(Phaser.Device.desktop){
		popupArea.events.onInputOver.add(this._cursorOver, this);
		popupArea.events.onInputOut.add(ui.popupManager.hoverOut.bind(ui.popupManager));
	}
	else{
		popupArea.events.onInputDown.add(this._cursorOver.bind(this, true));
		popupArea.events.onInputUp.add(ui.popupManager.hoverOut.bind(ui.popupManager));
	}
};

extend(PopupField, IconField);

PopupField.prototype.getPopupDefaultOptions = function(){
	return {
		numCardsText: 'Cards',
		area: 'area',
		getTextFunction: null
	};
};

PopupField.prototype.getHoverText = function(anyway){
	if(!this._hoverTextChanged && !anyway){
		return false;
	}
	this._hoverTextChanged = false;
	if(typeof this.popupStyle.getTextFunction == 'function'){
		return this.popupStyle.getTextFunction.call(this);
	}
	else{
		return this.popupStyle.numCardsText + ': ' + this.cards.length;
	}
};

PopupField.prototype.placeCards = function(){
	this._hoverTextChanged = true;
	supercall(PopupField).placeCards.apply(this, arguments);
};

PopupField.prototype.removeCards = function(cardsToRemove){
	this._hoverTextChanged = true;
	supercall(PopupField).removeCards.call(this, cardsToRemove);
};

PopupField.prototype._cursorOver = function(now){
	ui.popupManager.hoverOver(this, this.getHoverText(true), now);
};