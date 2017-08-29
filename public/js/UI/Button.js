/**
* Конструктор кнопок с текстом/иконкой.  
* Состоит из двух элементов: кнопки ({@link UI.Button|this}) и опционального текста\иконки ({@link UI.Button#label|label}).  
* Элементы не связаны группой, поэтому многие функции движка (добавление в группы например) работают некорректно, нужно использовать методы кнопки.
* @class
* @extends {Phaser.Button}
* @param {object}            [options]                        Настройки кнопки.
* @param {(object|function)} options.position={x:0,y:0}       Позиция кнопки в виде объекта или функции, возвращающий объект вида `{x, y}`. 
*                                                             В функцию передаются следующие параметры: `width, height`.
* @param {string}            options.color='grey'             Цвет кнопки.
* @param {string}            options.size='wide'              Тип кнопки (`'small', 'big', 'wide', 'circle'`)
* @param {function}          options.action                   Действие кнопки.
* @param {any}               options.context=null             Контекст действия.
* @param {external:Phaser.Group}      options.group=null               Группа, в которую будет помещена кнопка.
* @param {number}            options.scale=1                  Масштаб кнопки.
* @param {string}            options.text=null                Текст кнопки.
* @param {string}            options.textColor='black'        Цвет текста.
* @param {string}            options.font='Exo'               Шрифт текста.
* @param {number}            options.fontSize=26              Размер шрифта.
* @param {string}            options.icon=null                Иконка кнопки.
* @param {string}            options.name=null                Имя кнопки.
* @param {number}            options.downOffset=4             На сколько сдвигать текст\иконку кнопку, когда она нажата.
* @param {boolean}           options.mobileClickProtect=false На мобильных устройствах можно отменить нажатие кнопки, отведя от нее палец.
*/
UI.Button = function(options){

	/**
	* Опции.
	* @type {object}
	*/
	this.options = mergeOptions(this.getDefaultOptions(), options);

	/**
	* Действие.
	* @type {function}
	*/
	this.action = this.options.action;
	function actionWrapper(button, pointer, isOver){
		if(isOver || (!Phaser.Device.desktop && !this.options.mobileClickProtect)){
			if(cardControl.card){
				cardControl.cardReturn();
			}
			this.action.call(this.options.context || this, button, pointer, isOver);
		}
	}

	// Phaser кнопка
	Phaser.Button.call(
		this, game,
		0,
		0,
		'button_' + this.options.color + '_' + this.options.size,
		actionWrapper,
		this,
		1, 0, 2, 0
	);

	this.name = this.options.name;

	/**
	* Находится ли кнопка в нажатом положении (нажата или отключена).
	* @type {Boolean}
	*/
	this.isDown = false;

	this.scale.set(this.options.scale, this.options.scale);

	/**
	* Текст или иконка кнопки.
	* @type {(Phaser.Text|Phaser.Image)}
	* @property {boolean} isText является ли элемент текстом
	*/
	this.label = null;
	var style = { font: this.options.font, fontSize: this.options.fontSize, fill: this.options.textColor, align: 'center' };
	if(this.options.text){

		this.label = game.make.text(this.centerX, this.centerY, this.options.text, style);
		this.label.setShadow(1, 1, 'rgba(0,0,0,0.5)', 1);
		this.label.isText = true;
	}
	else if(this.options.icon){
		this.label = game.make.image(0, 0, 'icon_' + this.options.icon);
		this.label.isText = false;
	}	

	if(this.label){
		this.label.state = 'Out';
		this.label.anchor.set(0.5, 0.5);
	}

	// Убираем дефолтный курсор
	this.input.useHandCursor = false;

	// Группа
	if(this.options.group){
		this.group = this.options.group;
		this.group.add(this);
		if(this.label){
			this.group.add(this.label);
		}
	}
	else{
		game.add.existing(this);
		if(this.label){
			game.add.existing(this.label);
		}
	}

	this.updatePosition(this.options.position);
};

extend(UI.Button, Phaser.Button);

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
		scale: 1
	};
};

/** Прячет кнопку */
UI.Button.prototype.hide = function(){
	this.visible = false;
	if(this.label){
		this.label.visible = false;
	}
};

/** Показывает кнопку. */
UI.Button.prototype.show = function(){
	this.visible = true;
	if(this.label){
		this.label.visible = true;
	}
};

/** Включает кнопку. */
UI.Button.prototype.enable = function(){
	if(this.inputEnabled){
		return;
	}
	this.frame = 0;
	this.inputEnabled = true;

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
		this.frame = 3;
	}
	else{
		this.changeStateFrame('Up');
	}
	this.inputEnabled = false;

	if(this.label && !changeToDefaultFrame){
		this.label.alpha = 0.55;
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
		position = position(this.width, this.height);
	}
	this.x = position.x;
	this.y = position.y;

	if(this.label){
		this.label.x = this.centerX;
		this.label.y = this.centerY;
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
* Вызывается игрой для смены состояния кнопки.
* @param {string} state новое состояние
*
* @return {boolean} Было ли присвоено новое состояние.
*/
UI.Button.prototype.changeStateFrame = function (state) {
	if(this.label && this.inputEnabled){
		if(state != 'Down' && this.isDown){
			this.isDown = false;
			this.updatePosition();
		}
		else if(state == 'Down' && !this.isDown){
			this.isDown = true;
			this.label.y += this.options.downOffset;
		}
	}
	if(this.label){
		this.label.state = state;
	}

	if(this.inputEnabled){
		return supercall(UI.Button).changeStateFrame.call(this, state);
	}
};

/**
* Возвращает находится ли курсор над кнопкой.
* @return {boolean}
*/
UI.Button.prototype.cursorIsOver = function(){
	if(!this.inputEnabled || !this.visible){
		return false;
	}

	var gx = 0,
		gy = 0, 
		yFix = 0;
	if(this.group){
		gx = this.group.x;
		gy = this.group.y;
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

/** Уничтожает кнопку. */
UI.Button.prototype.destroy = function(){
	if(this.label){
		this.label.destroy();
	}
	supercall(UI.Button).destroy();
};

/**
* Удаляет кнопку с текстом/иконкой из родительской группы.
* Опционально уничтожает кнопку.
* @param  {boolean} destroy нужно ли уничтожать кнопку
*/
UI.Button.prototype.removeFromParent = function(destroy){
	if(this.parent){
		if(this.label){
			this.parent.remove(this.label);
		}
		this.parent.remove(this, destroy);
	}
};

//@include:ButtonPopup