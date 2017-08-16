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

	this.opponents = [];

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

extend(FieldManager, Phaser.Group);

/**
* Добавляет поле.
* @param {object} [options]   опции поля
* @param {object} [style]     стиль поля
* @param {object} [iconStyle] стиль иконки поля
*
* @return {Field}
*/
FieldManager.prototype.addField = function(options, style, iconStyle){

	var field = new Field(options, style, iconStyle);
	if(this.fields[options.id]){
		this.fields[options.id].destroy();
	}
	this.fields[options.id] = field;
	this.add(field);

	if(options.type == 'TABLE'){
		this.table.push(field);
	}
	else if(options.type == 'HAND_OPPONENT'){
		this.opponents.push(field);
	}
	return field;
};

/**
* Устанавливает козырь колоде.
* @param {number} suit козырь
*/
FieldManager.prototype.setTrumpSuit = function(suit, delay){
	if(!this.fields.DECK || !this.fields.DECK.icon){
		console.error('Field manager: cannot set trump suit, no DECK');
		return;
	}
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
* @param {string}  id            id поля
* @param {boolean} [noAnimation] отключает анимацию
*/
FieldManager.prototype.unlockField = function(id, noAnimation){
	var field = this.fields[id];
	if(!field || !field.icon){
		console.error('Field manager: cannot unlock field', id, ', no such field or field has no icon');
		return;
	}
	var icon = field.icon;
	
	if(game.paused || noAnimation){
		field.icon.destroy();
		field.icon = null;
		return;
	}

	icon.visible = true;
	field.iconStyle.shouldHide = false;
	icon.alpha = 1;

	var lockDelay = 100/game.speed,
		spinDelay = 300/game.speed,
		spinTime = 1000/game.speed;

	var tween = game.add.tween(icon);	

	game.seq.start(function(){
		field.setOwnHighlight(true);
		tween.to({alpha: 0, angle: 720}, spinTime - lockDelay, Phaser.Easing.Quadratic.In, false, spinDelay);
		tween.start();	
	}, lockDelay)
	.then(function(seq){
		icon.loadTexture('unlock');
	}, spinTime + spinDelay - lockDelay)
	.then(function(seq){
		tween.stop();
		icon.destroy();
		field.icon = null;
	}, lockDelay)
	.then(function(){
		if(!field.playable){
			field.setOwnHighlight(false);
		}
	});

	return game.seq.duration - 500;
};

/**
* Меняет местами два поля
* @param {Field} field1 первое поле
* @param {Field} field2 второе поле
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
		if(field.inDebugMode != this.inDebugMode)
			field.toggleDebugMode();
	});
	actionHandler.highlightPossibleActions();
};

/** Применяет скин к полям */
FieldManager.prototype.applySkin = function(){
	this.resizeFields();
	var deck = this.fields.DECK;
	if(deck && deck.icon && skinManager.skin.hasSuits){
		var frame = deck.icon.frame;
		deck.icon.loadTexture(skinManager.skin.suitsName);
		deck.icon.scale.set(skinManager.skin.scale, skinManager.skin.scale);
		deck.icon.frame = frame;
	}
};
