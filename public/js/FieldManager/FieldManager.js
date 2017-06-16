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

/**
* Добавляет поле.
* @param {object} [options] опции поля
* @param {object} [style] стиль поля
* @param {object} [iconStyle] стиль иконки поля
*/
FieldManager.prototype.addField = function(options, style, iconStyle){

	var field = new Field(options, style, iconStyle);
	if(this.fields[options.id]){
		this.fields[options.id].destroy();
	}
	this.fields[options.id] = field;

	if(options.type == 'TABLE'){
		this.table.push(field);
	}
};

/**
* Устанавливает козырь колоде.
* @param {number} suit козырь
*/
FieldManager.prototype.setTrumpSuit = function(suit, delay){
	if(delay === undefined)
		delay = 1000;
	var icon = this.fields.DECK.icon;
	setTimeout(function(){
		icon.frame = suit;
		icon.visible = true;
	}, delay/game.speed);
};

/**
* Убирает визуальный замок с поля.
* @param  {string} id id поля
*/
FieldManager.prototype.unlockField = function(id){
	var field = this.fields[id];
	if(!field || !field.icon)
		return;
	
	if(game.paused){
		field.icon.destroy();
		field.icon = null;
		return;
	}

	field.icon.visible = true;
	field.iconStyle.shouldHide = false;
	field.icon.alpha = 1;

	var spinDelay = 300/game.speed,
		spinTime = 1300/game.speed;

	field.setOwnHighlight(true);

	var tween = game.add.tween(field.icon);
	tween.to({alpha: 0, angle: 720}, spinTime - 300, Phaser.Easing.Quadratic.In, false, spinDelay);

	setTimeout(function(){
		if(!field || !field.icon) return;
		field.icon.loadTexture('unlock');
	}, spinDelay/3);

	tween.onComplete.addOnce(function(){
		if(!field || !field.icon) return;
		field.icon.destroy();
		field.icon = null;

		setTimeout(function(){
			if(field){
				field.setOwnHighlight(false);
			}
		}, 300);

	}, this);

	tween.start();			

	return spinDelay + spinTime - 300/game.speed;
};

/**
* Меняет местами два поля
* @param  {Field} field1 первое поле
* @param  {Field} field2 второе поле
*/
FieldManager.prototype.swapFields = function(field1, field2){
	var tempId = field2.id;
	this.fields[tempId] = field1;
	this.fields[field1.id] = field2;
	field2.id = field1.id;
	field1.id = tempId;
};

//@include:FieldManagerCard
//@include:FieldManagerForEach

//ДЕБАГ

/** Обновляет дебаг каждого поля */
FieldManager.prototype.updateDebug = function(){
	this.forEachField(function(field, si){
		field.updateDebug();
	});
};

/** Переключает режим дебага в каждом поле */
FieldManager.prototype.toggleDebugMode = function(){
	this.inDebugMode = !this.inDebugMode;
	this.forEachField(function(field, si){
		if(field.inDebugMode != this.inDebugMode)
			field.toggleDebugMode();
	});
	actionHandler.highlightPossibleActions();
};