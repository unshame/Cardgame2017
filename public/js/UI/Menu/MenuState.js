/**
* Прячет меню.
*/
Menu.prototype._hide = function(){
	this.visible = false;
};

/**
* Показывает и обновляет позицию меню.
*/
Menu.prototype._show = function(){
	this.visible = true;
	this.updatePosition();
};

/** Прячет меню, останавливая анимацию и убирая возможность нажимать на элементы. */
Menu.prototype.hide = function(){
	this._stopFader();
	this.alpha = 0;
	this._hide();
	this.disable(true);
};

/** Показывает меню, останавливая анимацию и давая возможность нажимать на элементы. */
Menu.prototype.show = function(){
	this._stopFader();
	this.alpha = 1;
	this._show();
	this.enable();
};

/** 
* Отключает элементы меню.
* @param {boolean} changeToDefaultFrame заставляет элемент переключиться на дефолтный кадр текстуры,
*                                       вместо кадра, соответствующего отключенному состоянию
*/
Menu.prototype.disable = function(changeToDefaultFrame){
	this.forEachElement(function(element){
		element.disable(changeToDefaultFrame);
	}, true);
};

/** Включает элементы игры, не входящие в {@link Menu#disabledElements} */
Menu.prototype.enable = function(){
	this.forEachElement(function(element){
		if(~this.disabledElements.indexOf(element)){
			return;
		}

		element.enable();
	}, true);
};

/** Переключает видимость меню */
Menu.prototype.toggle = function(){
	if(this.visible){
		this.hide();
	}
	else{
		this.show();
	}
};

