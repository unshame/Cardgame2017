/**
* Модуль, управляющий полями ({@link Field}).  
* Добавляет и удаляет карты из полей, предоставляет методы для работы с полями.  
* Создает {@link FieldBuilder}, который создает поля и карты.
* @class
* @extends {external:Phaser.Group}
* @param {Boolean} [inDebugMode] Отображать ли дебаг информацию {@link FieldManager#toggleDebugMode}
*/

var FieldManager = function(inDebugMode){

	Phaser.Group.call(this, game, null, 'fields');

	/**
	* Созданы ли поля
	* @type {boolean}
	* @default false
	*/
	this.networkCreated = false;

	/**
	* Поля
	* @type {object<Field>}
	*/
	this.fields = {};

	/**
	* Поля стола
	* @type {Field[]}
	*/
	this.table = [];

	/**
	* Поля оппонентов.
	* @type {Array}
	*/
	this.opponents = [];

	/**
	* Выводить ли дебаг информацию
	* @type {bolean}
	* @see  FieldManager#toggleDebugMode
	*/
	this.inDebugMode = inDebugMode;

	/**
	* Создает поля для менеджера
	* @type {FieldBuilder}
	*/
	this.builder = new FieldBuilder(this);

};

extend(FieldManager, Phaser.Group);

/**
* Добавляет поле.
* @param {function} Constructor конструктор поля
* @param {...object} options   опции, передаваемые в конструктор поля
*
* @return {Field}
*/
FieldManager.prototype.addField = function(Constructor){
	var args = [],
		len = arguments.length;
	for(var i = 1; i < len; i++) {
		args[i] = arguments[i];
	}
	var field = new (Constructor.bind.apply(Constructor, args))();
	if(this.fields[field.id]){
		this.fields[field.id].destroy();
	}
	this.fields[field.id] = field;
	this.add(field);
	field.initialize();
	return field;
};

/**
* Добавляет обычное поле или поле с иконкой.
* @param {object} options   
* @param {object} style   
* @param {object} [iconStyle]
* @return {(Field|Field.IconField)}
*/
FieldManager.prototype.addGenericField = function(options, style, iconStyle){
	return this.addField(iconStyle ? Field.IconField : Field, options, style, iconStyle);
};

/**
* Добавляет поле стола.
* @param {object} options   
* @param {object} style   
* @param {object} [iconStyle]
* @return {Field.TableField}
*/
FieldManager.prototype.addTableField = function(options, style, iconStyle){
	var field = this.addField(Field.TableField, options, style, iconStyle);
	this.table.push(field);
	return field;
};

/**
* Добавляет поле руки игрока.
* @param {object} options   
* @param {object} style   
* @param {object} [badgeStyle]
* @return {Field.PlayerField}
*/
FieldManager.prototype.addPlayerField = function(options, style, badgeStyle){
	return this.addField(Field.PlayerField, options, style, badgeStyle);
};

/**
* Добавляет поле руки оппонента.
* @param {object} options   
* @param {object} style   
* @param {object} [badgeStyle]
* @return {Field.BadgeField}
*/
FieldManager.prototype.addOpponentField = function(options, style, badgeStyle, popupStyle){
	var field = this.addField(Field.BadgeField, options, style, badgeStyle, popupStyle);
	this.opponents.push(field);
	return field;
};

/**
* Устанавливает козырь колоде.
* @param {number} suit козырь
*/
FieldManager.prototype.setTrumpSuit = function(suit){
	if(!this.fields.DECK || !this.fields.DECK.icon){
		console.error('Field manager: cannot set trump suit, no DECK');
		return;
	}
	var icon = this.fields.DECK.icon;
	icon.frame = suit;
	icon.visible = true;
};

/**
* Меняет местами два поля
* @param {Field} field1 первое поле
* @param {Field} field2 второе поле
*/
FieldManager.prototype.swapFields = function(field1, field2){
	var pos1 = {x: field1.x, y: field1.y};
	var pos2 = {x: field2.x, y: field2.y};
	if(!field1.savedPosition){
		field1.savedPosition = pos1;
	}
	if(!field2.savedPosition){
		field2.savedPosition = pos2;
	}
	field1.setBase(pos2.x, pos2.y, true);
	field2.setBase(pos1.x, pos1.y, true);
};

//@include:FieldManagerCard
//@include:FieldManagerForEach
//@include:FieldManagerAnim

// ДЕБАГ

/** Обновляет дебаг каждого поля */
FieldManager.prototype.updateDebug = function(){
	this.forEachField(function(field, si){
		field.updateDebug();
	});
};

/** Переключает режим дебага в каждом поле */
FieldManager.prototype.toggleDebugMode = function(){
	this.inDebugMode = !this.inDebugMode;
	options.set('debug_fields', this.inDebugMode);
	options.save();
	this.forEachField(function(field, si){
		if(field.inDebugMode != this.inDebugMode){
			field.toggleDebugMode();
		}
	});
	actionHandler.highlightPossibleActions();
};
