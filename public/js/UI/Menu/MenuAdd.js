/**
 * Создает и добавляет кнопку {@link Button} к элементам меню.
 */
Menu.prototype.addButton = function(action, name, text, context){
	var button = new Button({
		color: this.options.elementColor,
		textColor: this.options.textColor,
		size: 'wide',
		action: action,
		text: text,
		name: name,
		context: (context === false) ? undefined : (context || this),
		group: this
	});
	button.disable(true);
	this.elements.push(button);
	this.add(button);
};

Menu.prototype.addSlider = function(){

};

Menu.prototype.addCheckbox = function(){

};

Menu.prototype.addTitle = function(){

};

Menu.prototype.addImage = function(){

};

Menu.prototype.addDivider = function(){

};