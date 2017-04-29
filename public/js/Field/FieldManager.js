/*
 * Модуль, управляющий полями (Field)
 * Добавляет и удаляет карты из полей, предоставляет методы для работы с полями
 * Создает FieldBuilder, который создает поля и карты
 */

var FieldManager = function(isInDebugMode){

	this.networkCreated = false;

	this.cardsToRemove = {};
	this.fields = {};
	this.table = [];

	this.isInDebugMode = isInDebugMode;

	this.builder = new FieldBuilder(this);
};


//РАЗМЕЩЕНИЕ КАРТ

/*
 * Добавляет карты в очередь соответствующим полям
 * @newCards Array of {
 *		cid,
 *		pid || field,
 *		[suit,]
 *		[value]	
 * }
 */
FieldManager.prototype.queueCards = function(newCards){

	var delay = 0;
	for(var ci = 0; ci < newCards.length; ci++){
		var c = newCards[ci];
		var card = game.cards[c.cid];
		var fieldChanged;
		if(card){
			card.presetValue(c.suit, c.value);		
			fieldChanged = card.presetField(c.field || c.pid);
		}
		else{
			console.error('Field manager: Card', c.cid, 'not found');
			continue;
		}
		if(fieldChanged){
			card.field && this.cardsToRemove[card.field.id].push(card);
			var fieldId = card.fieldId;
			if(fieldId == 'BOTTOM')
				fieldId = 'DECK';
			delay = this.fields[fieldId].queueCards([card], delay);
		}
		else{
			console.warn('Field manager: Card', c.cid, 'already on field', (c.field || c.pid));
		}
	}
	return delay;
};

/*
 * Перемещает карты в соответствующие поля
 * @field Field - куда добавлять
 * @newCards Array of {
 * 		cid,
 * 		[suit,]
 * 		[value]
 * } 
 */
FieldManager.prototype.moveCards = function(field, newCards, noDelay){
	if(!newCards.length)
		return 0;

	var cardsToPlace = [];
	for(var i = 0; i < newCards.length; i++){
		var cid = newCards[i].cid,
			suit = newCards[i].suit,
			value = newCards[i].value, 
			card = game.cards[cid];
		
		if(card){
			card.presetValue(suit, value);
			var fieldChanged = card.presetField(field.id);
			if(fieldChanged){
				card.field && card.field.removeCard(card);
				cardsToPlace.push(card);
			}
		}
		else{
			console.error('Field Manager: Card', cid, 'not found');
		}
	}
	return field.addCards(cardsToPlace, noDelay);
};

FieldManager.prototype.findFirstEmptyTable = function(){
	for(var i = 0; i < this.table.length; i++){
		var field = this.table[i];
		if(!field.cards.length)
			return field;
	}
	console.error('Field manager: could\'t find an empty table');
	return null;
}


//FOR EACH FIELD

//Выполняет callback для каждого поля из this.fields
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

//Удаляет карты this.cardsToRemove из соответсвующих полей
FieldManager.prototype.removeMarkedCards = function(){
	this.forEachField(function(field, si){
		var cards = this.cardsToRemove[si];
		if(cards.length){
			field.removeCards(cards);
			this.cardsToRemove[si] = [];
		}
	});
};

//Заставляет каждое поле разместить все карты
FieldManager.prototype.placeCards = function(bringToTopOn, noDelay){
	this.forEachField(function(field){
		field.placeCards(null, bringToTopOn, noDelay);
	});
};

FieldManager.prototype.rotateCards = function(){
	this.forEachField(function(field){
		field.rotateCards();
	});
};

FieldManager.prototype.zAlignCards = function(){
	this.forEachField(function(field){
		field.zAlignCards();
	});
};

//Выполняет размещение очередей карт каждого поля
FieldManager.prototype.placeQueuedCards = function(){
	this.forEachField(function(field){
		field.placeQueuedCards();
	});
};

//Меняет размеры и устанавливает позицию полей в соотстветсвии с this.positions и this.dimensions
FieldManager.prototype.resizeFields = function(){
	if(!this.networkCreated)
		return;
	this.builder._calculateSizes();
	this.forEachField(function(field, si){
		field.setBase(this.builder.positions[si].x, this.builder.positions[si].y);
		field.resize(this.builder.dimensions[si].width, this.builder.dimensions[si].height, true);
	});
};

//Ресетит поля
FieldManager.prototype.resetFields = function(){
	this.forEachField(function(field){
		field.reset();
	});
};

//Убирает поля
FieldManager.prototype.resetNetwork = function(){
	this.forEachField(function(field){
		field.destroy();
	});
	this.fields = {};
	this.table = [];
};


//ДЕБАГ

//Обновляет дебаг каждого поля
FieldManager.prototype.updateDebug = function(){
	this.forEachField(function(field, si){
		field.updateDebug();
	});
};

//Переключает режим дебага в каждом поле
FieldManager.prototype.toggleDebugMode = function(){
	this.isInDebugMode = !this.isInDebugMode;
	this.forEachField(function(field, si){
		if(field.isInDebugMode != this.isInDebugMode)
			field.toggleDebugMode();
	});
	actionHandler.possibleActions && actionHandler.possibleActions.length && actionHandler.highlightPossibleActions(actionHandler.possibleActions);
};

//Добавляет поле (не используется)
FieldManager.prototype.addField = function(options){
	if(!options)
		options = {};

	this.fields[options.id] = new Field(options);
};