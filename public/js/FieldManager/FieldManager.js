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
* @param  {boolean} [noAnimation] отключает анимацию
*/
FieldManager.prototype.unlockField = function(id, noAnimation){
	var field = this.fields[id];
	if(!field || !field.icon)
		return;
	
	if(game.paused || noAnimation){
		field.icon.destroy();
		field.icon = null;
		return;
	}

	field.icon.visible = true;
	field.iconStyle.shouldHide = false;
	field.icon.alpha = 1;

	var lockDelay = 100/game.speed,
		spinDelay = 300/game.speed,
		spinTime = 1000/game.speed;

	var tween = game.add.tween(field.icon);	

	gameSeq.start(function(){
		field.setOwnHighlight(true);
		tween.to({alpha: 0, angle: 720}, spinTime - lockDelay, Phaser.Easing.Quadratic.In, false, spinDelay);
		tween.start();	
	}, lockDelay)
	.then(function(seq){
		if(!field.icon){
			seq.abort();
		}
		field.icon.loadTexture('unlock');
	}, spinTime + spinDelay - lockDelay)
	.then(function(seq){
		if(!field.icon){
			seq.abort();
		}
		tween.stop();
		field.icon.destroy();
		field.icon = null;
	}, lockDelay)
	.then(function(){
		if(!field.playable){
			field.setOwnHighlight(false);
		}
	});

	return gameSeq.duration - 500;
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
