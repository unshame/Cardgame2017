/**
* Кнопка с несколькими стилями и возможностью переключаться между ними.
* @class 
* @extends {UI.Button}
*/
UI.ButtonAltStyles = function(options){
	UI.Button.call(this, options);

	/**
	* Стили кнопки.  
	* Стандартный стиль всегда первый.
	* @type {object[]}
	*/
	this.styles = this._extractStyles(options.styles);

	/**
	* Индекс текущего стиля в `this.styles`.
	* @type {Number}
	*/
	this.currentStyle = 0;
};

extend(UI.ButtonAltStyles, UI.Button);

/**
* Извлекает стили и совмещает их со стандартным стилем.
* @param  {object[]} styles
* @return {object[]} Полученные стили.
*/
UI.ButtonAltStyles.prototype._extractStyles = function(styles){
	if(styles){
		styles.forEach(function(style, i){
			styles[i] = mergeOptions(this.getDefaultStyle(), style);
		}, this);
	}
	styles.unshift(this.getDefaultStyle());
	return styles;
};

/**
* Возвращает стандартный стиль для этой кнопки.
* @return {object}
*/
UI.ButtonAltStyles.prototype.getDefaultStyle = function(){
	return {
		key: 'button_' + this.options.color + '_' + this.options.size,
		font: this.options.font,
		fontSize: this.options.fontSize,
		fill: this.options.textColor
	};
};

/**
* Переключает стиль по индексу.
* @param  {number} index индекс стиля в `this.styles`.
*/
UI.ButtonAltStyles.prototype.changeStyle = function(index){
	var style = this.styles[index];
	if(!style || index === this.currentStyle){
		return;
	}
	var frame = this.button.frame;
	this.button.loadTexture(style.key);
	this.frame = frame;
	if(this.label && this.label.isText){
		this.label.font = style.font;
		this.label.fontSize = style.fontSize;
		this.label.fill = style.fill;
	}
	this.currentStyle = index;
};
