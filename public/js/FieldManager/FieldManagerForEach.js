// FOR EACH FIELD

/**
* Выполняет callback для каждого поля из {@link FieldManager#fields}. 
* @param {function} callback Вызываемая функция
* @param {function} context  Контекст вызываваемой функции
*
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
* @param {BRING_TO_TOP_ON} bringToTopOn Когда поднимать карту на передний план
* @param {boolean}         noDelay      Говорит полю, что перемещение не нужно задерживать
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

/** Убирает подсветку всех полей и карт и восстанавливает масштаб карт в полях. */
FieldManager.prototype.resetHighlights = function(){
	this.forEachField(function(field){
		field.setPopOut(false);
		field.setOwnPlayability(false);
		field.validCards.length = 0;
		field.setOwnHighlight(false);
		field.setCardsPlayability(false);
	});
};

/** Подсвечивает dummy поле, если все поля стола играбильны. */
FieldManager.prototype.tryHighlightDummy = function(){
	var allMarked = true;
	for(var fid in this.table){
		if(!this.table.hasOwnProperty(fid))
			continue;
		var f = this.table[fid];
		if(!f.playable){
			allMarked = false;
			break;
		}
	}
	if(allMarked){
		this.forEachField(function(f){
			if(f.playable != 'ATTACK')
				return;
			f.setOwnHighlight(false);
			f.setIconVisibility(true);
		});
		this.fields.dummy.setOwnHighlight(true);
	}
};

/** 
* Увеличивает масштаб карт в поле, восстанавливает масштаб во всех остальных полях.
* @param {Field} field поле
*/
FieldManager.prototype.popOutField = function(field){
	this.resetPopOut();
	field.setPopOut(true);
};

/** Восстанавливает масштаб во всех полях */
FieldManager.prototype.resetPopOut = function(){
	this.forEachField(function(field){
		field.setPopOut(false);
	});
};

/** Меняет размеры и устанавливает позицию полей в соотстветсвии с 
* {@link FieldBuilder#positions} и {@link FieldBuilder#dimensions}.
*/
FieldManager.prototype.resizeFields = function(){
	if(!this.networkCreated)
		return;
	this.builder.calcSizes();
	this.forEachField(function(field, id){
		field.style.padding = this.builder.offsets[id];
		
		var options = this.builder.options[id];
		if(options){
			mergeOptions(field, style);
		}

		var style = this.builder.styles[id];
		if(style){
			mergeOptions(field.style, style);
		}

		var badgeStyle = this.builder.badgeStyles[id];
		if(badgeStyle){
			mergeOptions(field.badgeStyle, badgeStyle);
		}

		field.setBase(this.builder.positions[id].x, this.builder.positions[id].y);
		field.setSize(this.builder.dimensions[id].width, this.builder.dimensions[id].height, true);
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

/** Восстанавливает порядок полей стола */
FieldManager.prototype.resetTableOrder = function(){
	for(var ti = 0; ti < this.table.length; ti++){
		var table = this.table[ti];
		if(table.savedPosition){
			table.setBase(table.savedPosition.x, table.savedPosition.y, true);
			table.savedPosition = null;
		}
	}
};

FieldManager.prototype.endFieldAnimations = function(){
	this.forEachField(function(f){
		f.endAnimation();
	});
};
