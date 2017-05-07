/**
 * Создает и управляет "слоями" интерфейса.
 * Обновляет позиции элементов слоев, загружает текст кнопок после загрузки шрифтов.
 *
 * @class
 */

var UILayers = function(){
	this.byName = {};
}

UILayers.prototype.addLayer = function(i, name){
	var layer = game.add.group();
	layer.index = i;
	layer.name = name;
	this.byName[name] = layer;
	this._positionLayer(layer);
	return layer;
}

UILayers.prototype.addExistingLayer = function(layer, i){
	layer.index = i;
	this.byName[layer.name] = layer;
	this._positionLayer(layer);
	return layer;
}

UILayers.prototype._positionLayer = function(layer){

	var i = layer.index;
	if(i < 0){
		i = game.world.children.length + i;
	}
	game.world.setChildIndex(layer, i);
}

UILayers.prototype.positionLayers = function(){
	for(var pname in this.byName){
		if(!this.byName.hasOwnProperty(pname))
			return;

		this._positionLayer(this.byName[pname]);
	}
}

UILayers.prototype._positionElementInLayer = function(layer){
	layer.forEach(function(el){
		if(el.updatePosition)
			el.updatePosition();
	});
}

UILayers.prototype.positionElements = function(){
	for(var pname in this.byName){
		if(!this.byName.hasOwnProperty(pname))
			return;

		this._positionElementInLayer(this.byName[pname]);
	}
}

UILayers.prototype.loadLabels = function(){
	for(var pname in this.byName){
		if(!this.byName.hasOwnProperty(pname))
			return;

		var layer = this.byName[pname];
		layer.forEach(function(el){
			if(el.label && el.label.isText)
				el.label.setText(el.label.text);
		});
	}
}

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
}