/**
* Создает и управляет "слоями" интерфейса. Слоем может быть любой `{@link DisplayObject}`.  
* Обновляет z-index и позиции элементов слоев, загружает текст кнопок после загрузки шрифтов.  
* Все слои добавляются в `game.world.children`. Существующие слои должны быть там же.
* z-index - индекс элемента в `game.world.children`.  
* z-index >= 0 - начиная с низа  
* z-index < 0 - начиная с верха (-1 - самый верхний слой)
* @class
*/
var UILayers = function(){

	/**
	* Слои интерфейса.
	* @type {Object<DisplayObject>}
	*/
	this.byName = {};
};

/**
* Создает новую `Phaser.Group` группу и добавляет ее как слой.
* @param {number} i                   z-index слоя  
* @param {string} name                имя слоя, должно быть уникальным
* @param {boolean} [checkCursorOverlap=false] Устанавливает `checkCursorOverlap` созданной группе.
* Указывает, нужно ли проверять эту группу в `{@link UILayers#cursorIsOverAnElement}`. 
*/
UILayers.prototype.addLayer = function(i, name, checkCursorOverlap){
	var layer = game.add.group();
	layer.index = i;
	layer.name = name;
	layer.checkCursorOverlap = checkCursorOverlap || false;
	this.byName[name] = layer;
	this._positionLayer(layer);
	return layer;
};

/**
* Добавляет существующий элемент игры, как слой.
* @param {DisplayObject} layer       добавляемый элемент игры
* @param {number} i                   z-index слоя
* @param {boolean} [checkCursorOverlap=false] Устанавливает `checkCursorOverlap` слою.
* Указывает, нужно ли проверять эту группу в `{@link UILayers#cursorIsOverAnElement}`. 
*/
UILayers.prototype.addExistingLayer = function(layer, i, checkCursorOverlap){
	layer.index = i;
	layer.checkCursorOverlap = checkCursorOverlap || false;
	this.byName[layer.name] = layer;
	this._positionLayer(layer);
	return layer;
};

/**
* Меняет z-index и `checkCursorOverlap` слоя.
* @param {DisplayObject} layer        слой
* @param {number} i                   z-index слоя
* @param {boolean} [checkCursorOverlap] устанавливает `checkCursorOverlap` слою
*/
UILayers.prototype.setLayerIndex = function(layer, i, checkCursorOverlap){
	layer.index = i;
	if(checkCursorOverlap !== undefined)
		layer.checkCursorOverlap = checkCursorOverlap || false;
	this._positionLayer(layer);
};

/**
* Позиционирует слой по вертикали.
* @private
* @param {DisplayObject} layer слой
*/
UILayers.prototype._positionLayer = function(layer){

	var i = layer.index,
		len = game.world.children.length;
	if(i < 0){
		i = len + i;
	}
	i = Math.min(i, len - 1);
	try{
		game.world.setChildIndex(layer, i);
	}
	catch(e){
		console.error(e);
	}
};

/**
* Позиционирует все слои по вертикали.
*/
UILayers.prototype.positionLayers = function(){
	for(var pname in this.byName){
		if(!this.byName.hasOwnProperty(pname))
			continue;

		this._positionLayer(this.byName[pname]);
	}
};

/**
* Вызывает `updatePosition` у всех элементов слоя.
* @param {DisplayObject} layer слой
* @private
*/
UILayers.prototype._positionElementsInLayer = function(layer){
	layer.forEach(function(el){
		if(el.updatePosition)
			el.updatePosition();
	});
};

/**
* Вызывает `updatePosition` у всех элементов всех слоев, которые относятся к `Phaser.Group`.
*/
UILayers.prototype.positionElements = function(){

	for(var pname in this.byName){
		if(!this.byName.hasOwnProperty(pname))
			continue;

		var layer = this.byName[pname];
		if(!(layer instanceof Phaser.Group))
			continue;

		this._positionElementsInLayer(layer);
	}
};

/**
* Перезагружает текст всех элементов всех слоев, относящихся к `Phaser.Group`, у готорых есть `label` и `label.isText`.
*/
UILayers.prototype.loadLabels = function(){
	for(var pname in this.byName){
		if(!this.byName.hasOwnProperty(pname))
			continue;

		var layer = this.byName[pname];
		if(!(layer instanceof Phaser.Group))
			continue;

		layer.forEach(function(el){
			if(el.label && el.label.isText)
				el.label.setText(el.label.text);
		});
	}
};

/**
* Находит первый элемент в слоях, относящихся к `Phaser.Group` с `checkCursorOverlap == true`, над которым находится курсор.
* @return {(DisplayObject|false)} Находится ли курсор над элементом.
* Если да, то возвращает первый попавшийся элемент, над которым находится курсор.
*/
UILayers.prototype.cursorIsOverAnElement = function(){
	for(var pname in this.byName){
		if(!this.byName.hasOwnProperty(pname))
			continue;

		var layer = this.byName[pname];
		if(!(layer instanceof Phaser.Group) || !layer.checkCursorOverlap)
			continue;

		for(var i = 0, len = layer.children.length; i < len; i++){
			var el = layer.children[i];
			if(el.cursorIsOver && el.cursorIsOver())
				return el;				
		}
	}
	return false;
};

/**
* Дебаг функция для получения списка слоев.
* @return {object} Возвращает `{world: [], layers: []}`.  
* `world` содержит имена `{@link DisplayObject}` в `game.world.children`.  
* `layers` содержит соответствующие слои (`{@link DisplayObject}`), если они есть.
* @see  {@link printLayers}
*/
UILayers.prototype.getOrder = function(){
	var arr = {
		world: game.world.children.map(function(c){
			return c.name;
		}),
		layers: game.world.children.map(function(c){
			return this.byName[c.name];
		}, this)
	};
	return arr;
};