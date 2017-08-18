/**
* Поле с плашкой информации игрока {@link BadgeField#badge} ({@link Badge}).
* @class 
* @extends {Field}
* @param {object} options
* @param {object} style
* @param {object} badgeStyle       Стиль плашки информации игрока.
* @param {string} badgeStyle.align Выравнивание плашки.
*                                  Значения: `'left', 'right', 'top', 'bottom'`
*/
var BadgeField = function(options, style, badgeStyle){
	Field.call(this, options, style);

	this.badgeStyle = mergeOptions(this.getBadgeDefaultOptions(), badgeStyle);

	/**
	* Информационная плашка игрока.
	* @type {Badge}
	*/
	this.badge = new Badge(this, this.name);
	this.add(this.badge);
};

extend(BadgeField, Field);

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
