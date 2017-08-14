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

	/**
	 * Слои, отсортированные по вертикали.
	 * @type {DisplayObject[]}
	 */
	this.positions = [];

	/**
	* Кол-во слоев.
	* @type {Number}
	*/
	this.numOfLayers = 0;
};

/**
* Определяет реальные индексы слоев для позиционирования.
* Исправляет повторяющиеся индексы.
* @private
*/
UILayers.prototype._sortPositions = function(){
	this.positions.sort(function(a, b){
		a = a.index;
		b = b.index;
		if(a < 0 && b > 0 || a !== 0 && b === 0){
			return 1;
		}
		if(a > 0 && b < 0 || a === 0 && b !== 0){
			return -1;
		}
		return a - b;
	});
	//console.log(this.positions.map(l => l.index))
};

/**
* Создает новую `Phaser.Group` группу и добавляет ее как слой.
* @param {number} i                   z-index слоя  
* @param {string} name                имя слоя, должно быть уникальным
* @param {boolean} [checkCursorOverlap=false] Устанавливает `checkCursorOverlap` созданной группе.
* Указывает, нужно ли проверять эту группу в `{@link UILayers#cursorIsOverAnElement}`. 
* @return {Phaser.Group} Созданный слой.
*/
UILayers.prototype.addLayer = function(i, name, checkCursorOverlap){
	if(this.byName[name]){
		console.error('UILayers: Layer name must be unique', name);
		return null;
	}
	var layer = game.add.group();
	layer.index = i;
	layer.name = name;
	layer.checkCursorOverlap = checkCursorOverlap || false;
	this.byName[name] = layer;
	this.positions.push(layer);
	this.numOfLayers++;
	return layer;
};

/**
* Добавляет существующий элемент игры, как слой.
* @param {DisplayObject} layer       добавляемый элемент игры
* @param {number} i                   z-index слоя
* @param {boolean} [checkCursorOverlap=false] Устанавливает `checkCursorOverlap` слою.
* Указывает, нужно ли проверять эту группу в `{@link UILayers#cursorIsOverAnElement}`. 
* @return {DisplayObject} Добавленный слой.
*/
UILayers.prototype.addExistingLayer = function(layer, i, checkCursorOverlap){
	if(this.byName[layer.name]){
		console.error('UILayers: Layer name must be unique', layer.name);
		return null;
	}
	layer.parent = game.world;
	layer.index = i;
	layer.checkCursorOverlap = checkCursorOverlap || false;
	this.byName[layer.name] = layer;
	this.positions.push(layer);
	this.numOfLayers++;
	return layer;
};

/**
 * Добавляет существующие элементы игры как слои из массива.
 * @param {array} layers Слои `[layer, i, checkCursorOverlap]`
 */
UILayers.prototype.addExistingLayers = function(layers){
	for(var i = 0; i < layers.length; i++){
		var layer = layers[i];
		this.addExistingLayer(layer[0], layer[1], layer[2]);
	}
};

/**
 * Прячет элементы слоя у которых есть метод `hide`.
 * Опционально отключает элементы слоя, у которых есть метод `disable`.
 * @param  {DisplayObject} layer  слой
 * @param  {boolean} shouldDisable нужно ли отключать элементы
 */
UILayers.prototype.hideLayer = function(layer, shouldDisable){
	layer.forEach(function(el){
		if(el.hide){
			el.hide();
		}
		if(shouldDisable && el.disable){
			el.disable();
		}
	});
};

/**
 * Показывает элементы слоя у которых есть метод `show`.
 * Опционально отключает элементы слоя, у которых есть метод `disable`.
 * @param  {DisplayObject} layer  слой
 * @param  {boolean} shouldDisable нужно ли отключать элементы
 */
UILayers.prototype.showLayer = function(layer, shouldDisable){
	layer.forEach(function(el){
		if(el.show){
			el.show();
		}
		if(shouldDisable && el.disable){
			el.disable();
		}
	});
	this._positionElementsInLayer(layer);
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
	this.positionLayers();
};

/**
* Позиционирует все слои по вертикали.
*/
UILayers.prototype.positionLayers = function(){
	this._sortPositions();
	game.world.children = this.positions;
};

/**
* Вызывает `updatePosition` у всех элементов слоя.
* @param {DisplayObject} layer слой
* @private
*/
UILayers.prototype._positionElementsInLayer = function(layer){
	layer.forEach(function(el){
		if(el.updatePosition){
			el.updatePosition();
		}
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
		if(layer.updatePosition){
			layer.updatePosition();
			continue;
		}
		if(layer instanceof Phaser.Group){
			this._positionElementsInLayer(layer);
		}
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
			if(el.label && el.label.isText){
				el.label.setText(el.label.text);
			}
		});
	}
};

/**
* Находит первый элемент в слое, над которым находится курсор.
* @param  {DisplayObject} layer слой
* @return {(DisplayObject|null)} Находится ли курсор над элементом.
* Если да, то возвращает первый попавшийся элемент, над которым находится курсор.
*/
UILayers.prototype.cursorIsOverAnElementInLayer = function(layer){
	for(var i = 0, len = layer.children.length; i < len; i++){
		var el = layer.children[i];
		if(el.cursorIsOver && el.cursorIsOver())
			return el;				
	}
	return null;
}

/**
* Находит первый элемент в слоях, относящихся к `Phaser.Group` с `checkCursorOverlap == true`, над которым находится курсор.
* Перестает проверять после первого слоя с `modal` и `visible` равными `true` (проверка идет с верхнего слоя).
* @return {(DisplayObject|null)} Находится ли курсор над элементом.
* Если да, то возвращает первый попавшийся элемент, над которым находится курсор.
*/
UILayers.prototype.cursorIsOverAnElement = function(){
	for(var i = this.positions.length - 1; i >= 0; i--){
		var layer = this.positions[i];
		if(!layer.checkCursorOverlap || !layer.visible || !(layer instanceof Phaser.Group))
			continue;
		var el = this.cursorIsOverAnElementInLayer(layer);
		if(el){
			return el;
		}
		else if(layer.modal && layer.visible){
			return null;
		}
	}
	return null;
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