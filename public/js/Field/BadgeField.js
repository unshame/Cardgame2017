/**
* Поле с плашкой информации игрока {@link Field.BadgeField#badge} ({@link Badge}).
* @class 
* @extends {Field.PopupField}
* @param {object} options
* @param {object} style
* @param {object} badgeStyle       Стиль плашки информации игрока.
* @param {string} badgeStyle.align Выравнивание плашки.
*                                  Значения: `'left', 'right', 'top', 'bottom'`
*/
Field.BadgeField = function(options, style, badgeStyle, popupStyle){
	Field.PopupField.call(this, options, style, popupStyle);

	this.badgeStyle = mergeOptions(this.getBadgeDefaultOptions(), badgeStyle);

	/**
	* Информационная плашка игрока.
	* @type {Badge}
	*/
	this.badge = new Badge(this, this.id);
	this.add(this.badge);
};

extend(Field.BadgeField, Field.PopupField);

Field.BadgeField.prototype.getBadgeDefaultOptions = function(){
	return {
		align: 'top'
	};
};

Field.BadgeField.prototype.setSize = function(width, height, shouldPlace){
	supercall(Field.BadgeField).setSize.call(this, width, height, shouldPlace);
	if(this.badge){
		this.badge.updatePosition();
	}
};
