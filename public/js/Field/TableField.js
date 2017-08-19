/**
* Поле стола с подсветкой верхней карты.
* @extends {IconField}
* @param {object} options
* @param {object} style
* @param {object} iconStyle
*/
var TableField = function(options, style, iconStyle){
	IconField.call(this, options, style, iconStyle);
};

extend(TableField, IconField);

/**
* Подсвечивает последнюю карту.
* @param {boolean} highlight включить ли подсветку
*/
TableField.prototype.setLastCardHighlight = function(highlight){
	if(!this.cards.length){
		return;
	}

	this.setCardsHighlight(false);
	if(highlight){
		var i = this.style.direction == 'backward' ? 0 : this.cards.length - 1;
		this.cards[i].setHighlight(highlight);
	}
};

TableField.prototype.setOwnHighlight = function(on, tint){
	if(this.cards.length){
		this.highlighted = on;
		this.setVisibility(false);
		this.setLastCardHighlight(on);
	}
	else{
		supercall(TableField).setOwnHighlight.call(this, on, tint);
	}
};