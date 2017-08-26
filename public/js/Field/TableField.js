/**
* Поле стола с подсветкой верхней карты.
* @class
* @extends {Field.IconField}
* @param {object} options
* @param {object} style
* @param {object} iconStyle
*/
Field.TableField = function(options, style, iconStyle){
	Field.IconField.call(this, options, style, iconStyle);
};

extend(Field.TableField, Field.IconField);

/**
* Подсвечивает последнюю карту.
* @param {boolean} highlight включить ли подсветку
*/
Field.TableField.prototype.setLastCardHighlight = function(highlight){
	if(!this.cards.length){
		return;
	}

	this.setCardsHighlight(false);
	if(highlight){
		var i = this.style.direction == 'backward' ? 0 : this.cards.length - 1;
		this.cards[i].setHighlight(highlight);
	}
};

Field.TableField.prototype.setOwnHighlight = function(on, tint){
	if(this.cards.length){
		this.highlighted = on;
		this.setVisibility(false);
		this.setLastCardHighlight(on);
	}
	else{
		supercall(Field.TableField).setOwnHighlight.call(this, on, tint);
	}
};