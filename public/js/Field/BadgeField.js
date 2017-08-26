/**
* Поле с плашкой информации игрока {@link BadgeField#badge} ({@link Badge}).
* @class 
* @extends {PopupField}
* @param {object} options
* @param {object} style
* @param {object} badgeStyle       Стиль плашки информации игрока.
* @param {string} badgeStyle.align Выравнивание плашки.
*                                  Значения: `'left', 'right', 'top', 'bottom'`
*/
var BadgeField = function(options, style, badgeStyle, popupStyle){
	PopupField.call(this, options, style, popupStyle);

	this.badgeStyle = mergeOptions(this.getBadgeDefaultOptions(), badgeStyle);

	/**
	* Информационная плашка игрока.
	* @type {Badge}
	*/
	this.badge = new Badge(this, this.id);
	this.add(this.badge);
};

extend(BadgeField, PopupField);

BadgeField.prototype.getBadgeDefaultOptions = function(){
	return {
		align: 'top'
	};
};

BadgeField.prototype.setSize = function(width, height, shouldPlace){
	supercall(BadgeField).setSize.call(this, width, height, shouldPlace);
	if(this.badge){
		this.badge.updatePosition();
	}
};
