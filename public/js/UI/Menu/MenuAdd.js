Menu.prototype.createLayout = function(layout){
	this.layout.length = 0;
	this.removeAllElements(true);
	for(var i = 0, len = layout.length; i < len; i++){
		var row = layout[i];		
		if(Array.isArray(row)){			
			for(var n = 0, lenn = row.length; n < lenn; n++){
				row[n] = this._addElement(row[n]);
			}			
		}
		else{
			row = [this._addElement(row)];
		}
		this.layout.push(row);
	}
};

Menu.prototype.addCloseButton = function(action){
	if(typeof action != 'function'){
		action = this.fadeOut.bind(this);
	}
	function getPosition(width, height){
		return {
			x: this.background.width - width*0.75,
			y: -height*0.25
		};
	}
	var button = this._addButton({
		position: getPosition.bind(this),
		action: this.options.closeButton,
		color: this.options.elementColor,
		icon: this.options.elementColor + '_cross',
		downOffset: 0,
		size: 'circle'
	});
	this.specialElements.push(button);
};

Menu.prototype._addElement = function(element){
	if(!element.type || !element.options){
		element = Menu.button(element);
	}
	var createMethod = this._elementTypeMap[element.type];
	if(!createMethod){
		return null;
	}
	return createMethod(element.options);
};

/**
* Создает и добавляет кнопку {@link Button} к элементам меню.
*/
Menu.prototype._addButton = function(options){
	options.group = this;
	if(!options.color && options.color !== 0){
		options.color = this.options.elementColor;
	}
	if(!options.textColor && options.textColor !== 0){
		options.textColor = this.options.textColor;
	}
	if(options.context === false){
		options.context = undefined;
	}
	else if(!options.context){
		options.context = this;
	}
	var button = new Button(options);
	button.disable(true);
	this.elements.push(button);
	//this.add(button);
	return button;
};

Menu.prototype._addSlider = function(){

};

Menu.prototype._addCheckbox = function(){

};

Menu.prototype._addTitle = function(){

};

Menu.prototype._addImage = function(){

};

Menu.prototype._addDivider = function(){

};