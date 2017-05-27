//FOR EACH FIELD

/**
* Выполняет callback для каждого поля из {@link FieldManager#fields}. 
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

/** Удаляет карты {@link Field#cardsToRemove} из соответсвующих полей. */
FieldManager.prototype.removeMarkedCards = function(){
	this.forEachField(function(field, si){
		field.removeMarkedCards();
	});
};

/** 
* Заставляет каждое поле разместить все карты. 
* @param  {BRING_TO_TOP_ON} bringToTopOn - Когда поднимать карту на передний план
* @param  {boolean} noDelay - Говорит полю, что перемещение не нужно задерживать
*/
FieldManager.prototype.placeCards = function(bringToTopOn, noDelay){
	this.forEachField(function(field){
		field.placeCards(null, bringToTopOn, noDelay);
	});
};

/** Заставляет каждое поле повернуть все карты. */
FieldManager.prototype.rotateCards = function(){
	this.forEachField(function(field){
		field.rotateCards();
	});
};

/** Заставляет каждое поле присвоить правильный z-index всем картам. */
FieldManager.prototype.zAlignCards = function(){
	this.forEachField(function(field){
		field.zAlignCards();
	});
};

/** Выполняет размещение очередей карт каждого поля. */
FieldManager.prototype.placeQueuedCards = function(bringToTopOn, noDelay){
	this.forEachField(function(field){
		field.placeQueuedCards(bringToTopOn, noDelay);
	});
};

/** Убирает подсветку всех полей и карт и восстанавливает масштаб картв полях. */
FieldManager.prototype.resetHighlights = function(){
	this.forEachField(function(field){
		field.setHighlight(false);
		field.validCards.length = 0;
		field.setIconVisibility(false);

	});
	this.resetPopOut();
	var field = this.fields[playerManager.pid];
	for(var ci = 0; ci < field.cards.length; ci++){
		field.cards[ci].setPlayability(false);
		field.cards[ci].setHighlight(false);
	}
};

/** Подсвечивает поля с `marked == true`. */
FieldManager.prototype.highlightMarkedFields = function(){
	var allMarked = true;
	for(var fid in this.table){
		if(!this.table.hasOwnProperty(fid))
			continue;
		var f = this.table[fid];
		if(!f.marked){
			allMarked = false;
		}
		else{
			f.marked = false;
			f.highlighted = true;
		}
	}
	if(allMarked){
		this.forEachField(function(f){
			f.setVisibility(false);
			f.setIconVisibility(true);
		});
		this.fields.dummy.setHighlight(true, ui.colors.orange);
	}
};

/** 
* Увеличивает масштаб карт в поле, восстанавливает масштаб во всех остальных полях.
* @param {Field} field поле
*/
FieldManager.prototype.popOutField = function(field){
	this.resetPopOut();
	field.popOut(true);
};

/** Восстанавливает масштаб во всех полях */
FieldManager.prototype.resetPopOut = function(){
	this.forEachField(function(field){
		field.popOut(false);
	});
};

/** Меняет размеры и устанавливает позицию полей в соотстветсвии с 
* {@link FieldBuilder#positions} и {@link FieldBuilder#dimensions}.
*/
FieldManager.prototype.resizeFields = function(){
	if(!this.networkCreated)
		return;
	this.builder.calcSizes();
	this.forEachField(function(field, si){
		field.style.padding = this.builder.offsets[si];
		field.setBase(this.builder.positions[si].x, this.builder.positions[si].y);
		field.setSize(this.builder.dimensions[si].width, this.builder.dimensions[si].height, true);
	});
};

/** Ресетит поля.*/
FieldManager.prototype.resetFields = function(){
	this.forEachField(function(field){
		field.reset();
	});
};

/** Уничтожает поля.*/
FieldManager.prototype.resetNetwork = function(){
	this.forEachField(function(field){
		field.destroy();
	});
	this.fields = {};
	this.table = [];
	this.networkCreated = false;
};