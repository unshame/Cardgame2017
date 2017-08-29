/**
* Создает и управляет "слоями" интерфейса. Слоем может быть любой `{@link DisplayObject}`.  
* Обновляет z-index и позиции элементов слоев, загружает текст кнопок после загрузки шрифтов.  
* Все слои добавляются в `game.world.children`. Существующие слои должны быть там же.
* z-index - индекс элемента в `game.world.children`.  
* z-index >= 0 - начиная с низа  
* z-index < 0 - начиная с верха (-1 - самый верхний слой)
* @class
*/
UI.Layers = function(){

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
	* Индекс модального слоя (слоя, блокирующего клики по элементам за ним).
	* @type {Number}
	*/
	this.modalLayerIndex = -1;
};

/**
* Определяет реальные индексы слоев для позиционирования.
* Исправляет повторяющиеся индексы.
*/
UI.Layers.prototype._sortPositions = function(){
	this.positions.sort(function(a, b){
		a = a.index;
		b = b.index;
		if(a < 0 && b >= 0){
			return 1;
		}
		if(a >= 0 && b < 0){
			return -1;
		}
		return a - b;
	});
	//console.log(this.positions.map(l => l.index))
};

/**
* Создает новую `Phaser.Group` группу и добавляет ее как слой.
* @param {number} i    index слоя
* @param {string} name имя слоя, должно быть уникальным
*
* @return {external:Phaser.Group} Созданный слой.
*/
UI.Layers.prototype.addLayer = function(i, name){
	if(this.byName[name]){
		console.error('UI.Layers: Layer name must be unique', name);
		return null;
	}
	var layer = game.add.group();
	layer.index = i;
	layer.name = name;
	this.byName[name] = layer;
	this.positions.push(layer);
	return layer;
};

/**
* Добавляет существующий элемент игры, как слой.
* @param {DisplayObject} layer добавляемый элемент игры
* @param {number}        i     index слоя
*
* @return {DisplayObject} Добавленный слой.
*/
UI.Layers.prototype.addExistingLayer = function(layer, i){
	if(this.byName[layer.name]){
		console.error('UI.Layers: Layer name must be unique', layer.name);
		return null;
	}
	layer.parent = game.world;
	layer.index = i;
	this.byName[layer.name] = layer;
	this.positions.push(layer);
	return layer;
};

/**
* Добавляет существующие элементы игры как слои из массива.
* @param {array} layers Слои `[layer, i]`
*/
UI.Layers.prototype.addExistingLayers = function(layers){
	for(var i = 0; i < layers.length; i++){
		var layer = layers[i];
		this.addExistingLayer(layer[0], layer[1], layer[2]);
	}
};

/**
* Прячет элементы слоя у которых есть метод `hide`.
* Опционально отключает элементы слоя, у которых есть метод `disable`.
* @param {DisplayObject} layer         слой
* @param {boolean}       shouldDisable нужно ли отключать элементы
*/
UI.Layers.prototype.hideLayer = function(layer, shouldDisable){
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
* @param {DisplayObject} layer         слой
* @param {boolean}       shouldDisable нужно ли отключать элементы
*/
UI.Layers.prototype.showLayer = function(layer, shouldDisable){
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
* Меняет z-index слоя.
* @param {DisplayObject} layer слой
* @param {number}        i     index слоя
*/
UI.Layers.prototype.setLayerIndex = function(layer, i){
	layer.index = i;
	this.positionLayers();
};

/**
* Позиционирует все слои по вертикали.
*/
UI.Layers.prototype.positionLayers = function(){
	this._sortPositions();
	game.world.children = this.positions;
};

/**
* Вызывает `updatePosition` у всех элементов слоя.
* @param {DisplayObject} layer слой
*/
UI.Layers.prototype._positionElementsInLayer = function(layer){
	layer.forEach(function(el){
		if(el.updatePosition){
			el.updatePosition();
		}
	});
};

/**
* Вызывает `updatePosition` у всех элементов всех слоев, которые относятся к `Phaser.Group`.
*/
UI.Layers.prototype.positionElements = function(){

	for(var pname in this.byName){
		if(!this.byName.hasOwnProperty(pname)){
			continue;
		}

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
UI.Layers.prototype.loadLabels = function(){
	for(var pname in this.byName){
		if(!this.byName.hasOwnProperty(pname)){
			continue;
		}

		var layer = this.byName[pname];
		if(layer instanceof Phaser.Text){
			layer.setText(layer.text);
			continue;
		}
		if(!(layer instanceof Phaser.Group)){
			continue;
		}

		layer.forEach(function(el){
			if(el.label && el.label.isText){
				el.label.setText(el.label.text);
			}
		});
	}
};


/**
* Дебаг функция для получения списка слоев.
* @return {object} Возвращает `{world: [], layers: []}`.  
* `world` содержит имена `{@link DisplayObject}` в `game.world.children`.  
* `layers` содержит соответствующие слои (`{@link DisplayObject}`), если они есть.
* @see  {@link printLayers}
*/
UI.Layers.prototype.getOrder = function(){
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

/**
* Вызывается из {@link UI.ModalManager} и обновляет индекс модального слоя.
* @param {DisplayObject} modalLayer слой, который стал модальным
*/
UI.Layers.prototype.updateModalIndex = function(modalLayer){
	if(!modalLayer){
		this.modalLayerIndex = -1;
		return;
	}
	var i = this.positions.indexOf(modalLayer);
	if(!~i){
		this.modalLayerIndex = -1;
		return;
	}
	this.modalLayerIndex = i;
};

/**
* Вызывается элементами игры и проверяет не заблокирован ли элемент
* над которым находится курсор модальным слоем и соответственно обновляет курсор.
* @param {DisplayObject} el объект над которым находится курсор
*/
UI.Layers.prototype.updateCursorOverlap = function(el){
	var parent = el.parent;
	if(!parent){
		return;
	}
	var i = this.positions.indexOf(parent);
	if(!~i){
		return;
	}
	var m = this.modalLayerIndex;
	if(!~m || i >= m){
		ui.cursor.updateOverlap(el);
	}
};
