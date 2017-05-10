/**
* Модуль, управляющий полями ({@link Field}).  
* Добавляет и удаляет карты из полей, предоставляет методы для работы с полями.  
* Создает {@link FieldBuilder}, который создает поля и карты.
* @class
* @param {Boolean} [inDebugMode] - Отображать ли дебаг информацию {@link FieldManager#toggleDebugMode}
*/

var FieldManager = function(inDebugMode){

	/**
	* Созданы ли поля
	* @type {boolean}
	* @default false
	*/
	this.networkCreated = false;

	/**
	* Карты, которые предстоит убрать из соответсвующих полей
	* @type {object<array<Card>>}
	* @private
	*/
	this.cardsToRemove = {};

	/**
	* Поля
	* @type {object<Field>}
	*/
	this.fields = {};

	/**
	* Phaser группа полей
	* @type {Phaser.Group}
	*/
	this.fieldsGroup = game.add.group();
	this.fieldsGroup.name = 'fields';

	/**
	* Поля стола
	* @type {Field[]}
	*/
	this.table = [];

	/**
	* Выводить ли дебаг информацию
	* @type {bollean}
	* @see  FieldManager#toggleDebugMode
	*/
	this.inDebugMode = inDebugMode;

	/**
	* Создает поля для менеджера
	* @type {FieldBuilder}
	*/
	this.builder = new FieldBuilder(this);
};


//РАЗМЕЩЕНИЕ КАРТ

/**
* Добавляет карты в очередь соответствующим полям
* @param {object} 		cardsInfo 			- Информация о перемещаемых картах
* @param {string} 		cardsInfo.cid 		- id карты
* @param {string} 		cardsInfo.pid/field - id игрока/поля
* @param {(number|null)} [cardsInfo.suit=null] - масть карты
* @param {number} 		[cardsInfo.value=0]	- значение карты
* @return {number} Время до начала движения последней перемещаемой карты
*/
FieldManager.prototype.queueCards = function(cardsInfo){

	var delay = 0;
	for(var ci = 0; ci < cardsInfo.length; ci++){
		var c = cardsInfo[ci];
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

/**
* Перемещает карты в соответствующие поля
* @param {Field} field - Поле, в которое происходит перемещение
* @param {object} cardsInfo - Информация о перемещаемых картах
* @param {string} cardsInfo.cid - id карты
* @param {(number|null)} [cardsInfo.suit=null] - масть карты
* @param {number} [cardsInfo.value=0] - значение карты
* @param {boolean} [noDelay=false] - Говорит полю, что перемещение не нужно задерживать
* @return {number} Время до начала движения последней перемещаемой карты
*/
FieldManager.prototype.moveCards = function(field, cardsInfo, noDelay){
	if(!cardsInfo.length)
		return 0;

	var cardsToPlace = [];
	for(var i = 0; i < cardsInfo.length; i++){
		var cid = cardsInfo[i].cid,
			suit = cardsInfo[i].suit,
			value = cardsInfo[i].value, 
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
			console.error('Field manager: Card', cid, 'not found');
		}
	}
	return field.addCards(cardsToPlace, noDelay);
};


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

/** Удаляет карты {@link FieldManager#cardsToRemove} из соответсвующих полей*/
FieldManager.prototype.removeMarkedCards = function(){
	this.forEachField(function(field, si){
		var cards = this.cardsToRemove[si];
		if(cards.length){
			field.removeCards(cards);
			this.cardsToRemove[si] = [];
		}
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
	var color = null;
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
	this.fields.dummy.setHighlight(true, ui.colors.orange)
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


//ДЕБАГ

/** Обновляет дебаг каждого поля*/
FieldManager.prototype.updateDebug = function(){
	this.forEachField(function(field, si){
		field.updateDebug();
	});
};

/** Переключает режим дебага в каждом поле*/
FieldManager.prototype.toggleDebugMode = function(){
	this.inDebugMode = !this.inDebugMode;
	this.forEachField(function(field, si){
		if(field.inDebugMode != this.inDebugMode)
			field.toggleDebugMode();
	});
	if(actionHandler.possibleActions && actionHandler.possibleActions.length)
		actionHandler.highlightPossibleActions(actionHandler.possibleActions);
};

/**
* Добавляет поле
* @deprecated Поля создаются автоматически при помощи {@link FieldBuilder}
*/
FieldManager.prototype.addField = function(options){
	if(!options)
		options = {};

	this.fields[options.id] = new Field(options);
};