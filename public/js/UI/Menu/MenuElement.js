/**
* Выполняет callback для каждого элемента меню.
* @param {function} callback         Выполняется для каждого элемента, имеет три параметра `element, i, len`.
* @param {boolean}  [includeSpecial] Нужно ли включать в цикл специальные элементы из {@link Menu#specialElements}.
*/
Menu.prototype.forEachElement = function(callback, includeSpecial){
	var ii = 0, i = 0;
	var len = includeSpecial ? this.elements.length : this.elements.length - this.specialElements.length;

	for(; i < this.elements.length; i++){
		var element = this.elements[i];

		if(~this.specialElements.indexOf(element) && !includeSpecial){
			continue;
		}

		callback.call(this, this.elements[i], ii, len);
		ii++;
	}
};

Menu.prototype.removeAllElements = function(destroy){
	this.forEachElement(function(el){
		el.removeFromParent(destroy);
	});
};

/**
* Возвращает элемент меню с указанным именем.
* @param {string} name Имя элемента.
*
* @return {DisplayObject} Элемент с `name`, равным указанному.
*/
Menu.prototype.getElementByName = function(name){
	for (var i = 0; i < this.elements.length; i++){

		if (this.elements[i].name === name){
			return this.elements[i];
		}

	}
	return null;
};

/** 
* Прячет элемент меню с указанным именем.
* Чтобы элемент прятался только при следующем открытии меню, нужно предварительно запустить `fadeOut`.
* @param {string} name Имя элемента.
*/
Menu.prototype.hideElement = function(name){
	var el = this.getElementByName(name);
	var i = this.hiddenElements.indexOf(el);

	if(!el || ~i){
		return;
	}

	this.hiddenElements.push(el);
	if(this._fading != -1){
		el.hide();

		if(this.visible){
			this.updatePosition();
		}
	}
};

/** 
* Прячет элемент меню с указанным именем.
* Чтобы элемент показывался только при следующем открытии меню, нужно предварительно запустить `fadeOut`.
* @param {string} name Имя элемента.
*/
Menu.prototype.showElement = function(name){
	var el = this.getElementByName(name);
	var i = this.hiddenElements.indexOf(el);

	if(!el || !~i){
		return;
	}

	this.hiddenElements.splice(i, 1);

	if(this._fading != -1){
		el.show();

		if(this.visible){
			this.updatePosition();
		}
	}
};

/**
* Отключает элемент с указанным именем.
* @param {string} name Имя элемента.
*/
Menu.prototype.disableElement = function(name){
	var el = this.getElementByName(name);
	var i = this.disabledElements.indexOf(el);

	if(!el || ~i){
		return;
	}

	this.disabledElements.push(el);
	el.disable();
};

/**
* Включает элемент с указанным именем.
* @param {string} name Имя элемента.
*/
Menu.prototype.enableElement = function(name){
	var el = this.getElementByName(name);
	var i = this.disabledElements.indexOf(el);

	if(!el || !~i){
		return;
	}

	this.disabledElements.splice(i, 1);
	el.enable();
};