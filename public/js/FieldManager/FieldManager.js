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
* Добавляет поле
*/
FieldManager.prototype.addField = function(options){
	if(!options){
		options = {};
	}

	var field = new Field(options);
	if(this.fields[options.id]){
		this.fields[options.id].destroy();
	}
	this.fields[options.id] = field;

	if(options.type == 'TABLE'){
		this.table.push(field);
	}
};

//FieldManagerCard
//FieldManagerForEach

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

FieldManager.prototype.setTrumpSuit = function(suit){
	var icon = this.fields.DECK.icon;
	icon.frame = suit;
	icon.visible = true;
};

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
	field.iconShouldHide = false;
	field.icon.alpha = 1;

	var spinDelay = 300/game.speed,
		spinTime = 1300/game.speed;

	field.setHighlight(true);
	field.highlighted = false;

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
				field.setVisibility(false);
			}
		}, 300);

	}, this);

	tween.start();			

	return spinDelay + spinTime - 300/game.speed;
};

FieldManager.prototype.swapFields = function(field1, field2){
	var tempId = field2.id;
	this.fields[tempId] = field1;
	this.fields[field1.id] = field2;
	field2.id = field1.id;
	field1.id = tempId;
	return field2;	
};