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

	if(options.type == 'TABLE')
		this.table.push(field);
};

//FieldManagerProtoCard
//FieldManagerProtoForEach

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
}

FieldManager.prototype.unlockField = function(id){
	var field = this.fields[id];
	if(!field || !field.icon)
		return;
	
	field.setHighlight(true);
	field.setVisibility(true);
	field.highlighted = false;
	field.icon.visible = true;
	field.iconShouldHide = false;
	var tween = game.add.tween(field.icon);
	tween.to({alpha: 0, angle: 360}, 1000, Phaser.Easing.Quadratic.Out, false, 500);
	tween.onStart.addOnce(function(){
		if(field && field.icon){
			field.icon.loadTexture('unlock');
		}
	})
	tween.onComplete.addOnce(function(){
		if(field && field.icon){
			field.icon.destroy();
			field.icon = null;
			field.setVisibility(false);
		}
	}, this);
	tween.start();
};