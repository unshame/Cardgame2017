/**
* Конструктор кнопок с текстом/иконкой.  
* Состоит из двух элементов: кнопки ({@link UI.Button#button|button}) и опционального текста\иконки ({@link UI.Button#label|label}).  
* @class
* @extends {external:Phaser.Group}
* @param {object}                [options]                        Настройки кнопки.
* @param {(object|function)}     options.position={x:0,y:0}       Позиция кнопки в виде объекта или функции, возвращающий объект вида `{x, y}`.
*                                                                 В функцию передаются следующие параметры: `width, height`.
* @param {string}                options.color='grey'             Цвет кнопки.
* @param {string}                options.size='wide'              Тип кнопки (`'small', 'big', 'wide', 'circle'`)
* @param {function}              options.action                   Действие кнопки.
* @param {any}                   options.context=null             Контекст действия.
* @param {external:Phaser.Group} options.group=null               Группа, в которую будет помещена кнопка.
* @param {number}                options.scale=1                  Масштаб кнопки.
* @param {string}                options.text=null                Текст кнопки.
* @param {string}                options.textColor='black'        Цвет текста.
* @param {string}                options.font='Exo'               Шрифт текста.
* @param {number}                options.fontSize=26              Размер шрифта.
* @param {string}                options.icon=null                Иконка кнопки.
* @param {string}                options.name=null                Имя кнопки.
* @param {number}                options.downOffset=4             На сколько сдвигать текст\иконку кнопку, когда она нажата.
* @param {boolean}               options.mobileClickProtect=false На мобильных устройствах можно отменить нажатие кнопки, отведя от нее палец.
*/
UI.Button = function(options){

	/**
	* Опции.
	* @type {object}
	*/
	this.options = mergeOptions(this.getDefaultOptions(), options);

	Phaser.Group.call(this, game, null, this.options.name);

	/**
	* Действие.
	* @type {function}
	*/
	this.action = this.options.action.bind(this.options.context || this);
	function actionWrapper(button, pointer, isOver){
		if(isOver || (!Phaser.Device.desktop && !this.options.mobileClickProtect)){
			if(cardControl.card){
				cardControl.cardReturn();
			}
			this.action.call(null, button, pointer, isOver);
		}
	}


	// Phaser кнопка
	this.button = new UI.ButtonBase(
		game,
		0, 0,
		'button_' + this.options.color + '_' + this.options.size,
		actionWrapper,
		this,
		this.options.overFrame, this.options.defaultFrame, this.options.downFrame, this.options.defaultFrame,
		this
	);
	this.button.scale.set(this.options.scale, this.options.scale);
	this.add(this.button);

	/**
	* Находится ли кнопка в нажатом положении (нажата или отключена).
	* @type {Boolean}
	*/
	this.isDown = false;

	/**
	* Текст или иконка кнопки.
	* @type {(Phaser.Text|Phaser.Image)}
	* @property {boolean} isText является ли элемент текстом
	*/
	this.label = null;
	var style = { font: this.options.font, fontSize: this.options.fontSize, fill: this.options.textColor, align: 'center' };
	if(typeof this.options.text == 'string'){
		this.label = game.make.text(this.centerX, this.centerY, this.options.text, style);
		this.label.setShadow(1, 1, 'rgba(0,0,0,0.5)', 1);
		this.label.isText = true;
	}
	else if(this.options.icon){
		this.label = game.make.image(0, 0, 'icon_' + this.options.icon);
		this.label.isText = false;
	}	

	if(this.label){
		this.label.state = UI.ButtonBase.States.STATE_OUT;
		this.label.anchor.set(0.5, 0.5);
		this.add(this.label);
	}

	// Убираем дефолтный курсор
	this.button.input.useHandCursor = false;

	// Группа
	if(this.options.group){
		var group = this.options.group;
		group.add(this);
	}
	else{
		game.add.existing(this);
	}
	this.updatePosition(this.options.position);
};

extend(UI.Button, Phaser.Group);

/**
* Возвращает опции по умолчанию.
* @return {object}
*/
UI.Button.prototype.getDefaultOptions = function(){
	return {
		position: {
			x: 0,
			y: 0
		},
		color: 'grey',
		size: 'wide',
		action: function(){},
		text: null,
		icon: null,
		name: null,
		downOffset: 4,
		textColor: 'black',
		font: 'Exo',
		fontSize: 26,
		context: null,
		group: null,
		mobileClickProtect: false,
		scale: 1,
		defaultFrame: 0,
		overFrame: 1,
		downFrame: 2,
		disabledFrame: 3,
		disabledLabelAlpha: 0.55
	};
};

/** Прячет кнопку */
UI.Button.prototype.hide = function(){
	this.visible = false;
};

/** Показывает кнопку. */
UI.Button.prototype.show = function(){
	this.visible = true;
};

/** Включает кнопку. */
UI.Button.prototype.enable = function(){
	if(this.button.inputEnabled){
		return;
	}
	this.button.frame = this.options.defaultFrame;
	this.button.inputEnabled = true;

	if(this.label){
		this.label.alpha = 1;
		if(this.isDown){
			this.isDown = false;
			this.updatePosition();
		}
	}
};

/**
* Выключает кнопку.
* @param  {boolean} changeToDefaultFrame Текстура кнопки переходит в обычное состояние, вместо выключенного.
*/
UI.Button.prototype.disable = function(changeToDefaultFrame){
	if(!changeToDefaultFrame){
		this.button.frame = this.options.disabledFrame;
	}
	else{
		this.button.changeStateFrame(UI.ButtonBase.States.STATE_UP);
	}
	this.button.inputEnabled = false;

	if(this.label && !changeToDefaultFrame){
		this.label.alpha = this.options.disabledLabelAlpha;
		if(!this.isDown){
			this.label.y += this.options.downOffset;
			this.isDown = true;
		}
	}
};

/**
* Меняет или восстанавливает заданную позицию.
* @param  {(object|function)} position позиция
*/
UI.Button.prototype.updatePosition = function(position){
	if(position){
		this.defaultPosition = position;
	}
	else{
		position = this.defaultPosition;
	}
	if(typeof position == 'function'){
		position = position.call(this, this.button.width, this.button.height);
	}
	this.x = position.x;
	this.y = position.y;

	if(this.label){
		this.label.x = this.button.centerX;
		this.label.y = this.button.centerY;
		if(!this.label.isText){
			//this.label.x++;
			this.label.y -= this.options.downOffset/2;
		}
		if(this.isDown){
			this.label.y += this.options.downOffset;
		}
	}
};

/**
* Возвращает находится ли курсор над кнопкой.
* @return {boolean}
*/
UI.Button.prototype.cursorIsOver = function(){
	if(!this.button.inputEnabled || !this.visible){
		return false;
	}

	var gx = 0,
		gy = 0, 
		yFix = 0;
	if(this.parent){
		gx = this.parent.worldPosition.x;
		gy = this.parent.worldPosition.y;
	}
	if(this.label && this.isDown){
		gy += 5;
		yFix += 5;
	}
	return Phaser.Rectangle.containsRaw(
		gx + this.x,
		gy + this.y,
		this.width,
		this.height - yFix,
		game.input.x,
		game.input.y
	);
};

/** Проверяет находится ли курсор над кнопкой. */
UI.Button.prototype.update = function(){
	if(this.cursorIsOver()){
		ui.layers.updateCursorOverlap(this);
	}
};

//@include:ButtonBase
//@include:ButtonPopup
//@include:ButtonAltStyle
