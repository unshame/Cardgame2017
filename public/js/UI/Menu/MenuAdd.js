/**
* Создает макет меню и соответствующие макету элементы.
* Предварительно удаляет любые существующие элементы меню.
* @param  {array} layout Массив с настройками и типами элементов, представляющий макет меню. 
* @example
* var menu = new Menu();
* menu.createLayout([
* 	// Строка, выравненная по правому краю
* 	Menu.alignRight(				
* 		Menu.button({text: 'row0element0'}),	// Тип элемента указывается вызовом Menu.elementType
* 		{text: 'row0element1'}					// Кнопка создается по умолчанию без указания типа
* 	),
* 
* 	// Вместо вызова функции можно передавать обычный массив, тогда элементы будут выравнены по центру
* 	[				
* 		Menu.checkbox({text: 'row2element0'}),
* 		Menu.text({text: 'row2element1'})
* 	],
* 
* 	// Строка с одним элементом выравненная может быть не обернута в массив, элемент будет выравнен по центру
* 	{text: 'row1element0'},
* 
* 	// Строка с одним элементов, выравненным по левому краю
* 	Menu.alignLeft(
* 		Menu.button({text: 'row'})
* 	)
* ]);
*/
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

/**
* Добавляет кнопку закрытия меню.
* @param {function} [action] Действие кнопки. По умолчанию будет вызвано плавное закрытие меню.
*/
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
		icon: (this.options.closeButtonCrossColor || this.options.color) + '_cross',
		downOffset: 0,
		size: 'circle'
	});
	this.specialElements.push(button);
};

/**
* Создает и добавляет элемент меню в меню.
* @param {object} element Тип и настройки элемента в виде `{type, options}`.
*/
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
* Создает и добавляет кнопку {@link UI.Button} в меню.
*/
Menu.prototype._addButton = function(options, withPopup){
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
	var button = withPopup ? new UI.ButtonPopup(options) : new UI.Button(options);
	button.disable(true);
	this.elements.push(button);
	return button;
};

Menu.prototype._addButtonPopup = function(options){
	return this._addButton(options, true);
};

Menu.prototype._addStepper = function(options){
	options.group = this;
	if(!options.color && options.color !== 0){
		options.color = this.options.elementColor;
	}
	if(!options.textColor && options.textColor !== 0){
		options.textColor = this.options.textColor;
	}
	var stepper = new UI.Stepper(options);
	stepper.disable();
	this.elements.push(stepper);
	return stepper;
};

Menu.prototype._addCheckbox = function(options){
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
	var checkbox = new UI.Checkbox(options);
	this.elements.push(checkbox);
	return checkbox;
};

Menu.prototype._addText = function(options){
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
	var text = new UI.Text(options);
	this.elements.push(text);
	return text;
};

Menu.prototype._addImage = function(){

};

Menu.prototype._addDivider = function(){

};