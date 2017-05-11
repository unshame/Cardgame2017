//FOR EACH FIELD

/**
* Выполняет callback для каждого поля из {@link FieldManager#fields}
* @param {function} callback - Вызываемая функция
* @param {function} context - Контекст вызываваемой функции
* @return {any[]} Возвращенные переданной функцей значения
*/
FieldManager.prototype.forEachField = function(callback, context){
	var returnedValues = [];
	for(var si in this.fields){
		if(!this.fields.hasOwnProperty(si))
			continue;
		var field = this.fields[si];
		var returnValue = callback.call(context || this, field, si);
		if(returnValue !== undefined)
			returnedValues.push(returnValue);
	}
	return returnedValues;
};

/** Удаляет карты {@link Field#cardsToRemove} из соответсвующих полей*/
FieldManager.prototype.removeMarkedCards = function(){
	this.forEachField(function(field, si){
		field.removeMarkedCards();
	});
};

/** 
* Заставляет каждое поле разместить все карты
* @param  {BRING_TO_TOP_ON} bringToTopOn - Когда поднимать карту на передний план
* @param  {boolean} noDelay - Говорит полю, что перемещение не нужно задерживать
*/
FieldManager.prototype.placeCards = function(bringToTopOn, noDelay){
	this.forEachField(function(field){
		field.placeCards(null, bringToTopOn, noDelay);
	});
};

/** Заставляет каждое поле повернуть все карты*/
FieldManager.prototype.rotateCards = function(){
	this.forEachField(function(field){
		field.rotateCards();
	});
};

/** Заставляет каждое поле присвоить правильный z-index всем картам*/
FieldManager.prototype.zAlignCards = function(){
	this.forEachField(function(field){
		field.zAlignCards();
	});
};

/** Выполняет размещение очередей карт каждого поля*/
FieldManager.prototype.placeQueuedCards = function(){
	this.forEachField(function(field){
		field.placeQueuedCards();
	});
};

FieldManager.prototype.checkCompleteHighlight = function(){
	for(var fid in this.table){
		if(!this.table.hasOwnProperty(fid))
			continue;
		var f = this.table[fid];
		if(!f.highlighted){
			return;
		}
	}
	this.forEachField(function(f){
		f.setVisibility(false);
	});
	this.fields.dummy.setHighlight(true, ui.colors.orange);
};

/** Меняет размеры и устанавливает позицию полей в соотстветсвии с 
* {@link FieldBuilder#positions} и {@link FieldBuilder#dimensions}
*/
FieldManager.prototype.resizeFields = function(){
	if(!this.networkCreated)
		return;
	this.builder._calculateSizes();
	this.forEachField(function(field, si){
		field.margin = this.builder.offsets[si];
		field.setBase(this.builder.positions[si].x, this.builder.positions[si].y);
		field.resize(this.builder.dimensions[si].width, this.builder.dimensions[si].height, true);
	});
};

/** Ресетит поля*/
FieldManager.prototype.resetFields = function(){
	this.forEachField(function(field){
		field.reset();
	});
};

/** Уничтожает поля*/
FieldManager.prototype.resetNetwork = function(){
	this.forEachField(function(field){
		field.destroy();
	});
	this.fields = {};
	this.table = [];
};