/*
 * Конструктор кнопок с текстом
 */

var Button = function(options){

	this.options = Button.getDefaultOptions();
	for(var o in options){
		if(options.hasOwnProperty(o))
			this.options[o] = options[o];
	}

	//Действие
	this.action = this.options.action;
	var thisButton = this;
	function actionWrapper(button, pointer, isOver){
		if(isOver)
			thisButton.action.call(this, button, pointer, isOver);
	}

	//Phaser кнопка
	Phaser.Button.call(
		this, game,
		0,
		0,
		'button_' + this.options.color + '_' + this.options.size,
		actionWrapper,
		this.options.context,
		1, 0, 2, 0
	);

	//Текст
	var style = { font: this.options.font, fill: this.options.textColor, align: 'center' };
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
		this.label.downOffset = 4;
		this.label.anchor.set(0.5, 0.5);
	}

	this.updatePosition(this.options.position);


	//Убираем дефолтный курсор
	this.input.useHandCursor = false;

	game.add.existing(this);
	if(this.label)
		game.add.existing(this.label);

	//Группа
	if(this.options.group){
		this.group = this.options.group;
		this.group.add(this);
		if(this.label)
			this.group.add(this.label);
	}
};

Button.prototype = Object.create(Phaser.Button.prototype);
Button.prototype.constructor = Button;

Button.getDefaultOptions = function(){
	var options = {
		position: {
			x: 0,
			y: 0
		},
		color: 'grey',
		size: 'wide',
		action: function(){},
		text: null,
		icon: null,
		textColor: 'black',
		font: '28px Exo',
		context: this,
		group: null
	};
	return options;
};

//Прячет кнопку
Button.prototype.hide = function(){
	this.visible = false;
	if(this.label)
		this.label.visible = false;
};

//Показывает кнопку
Button.prototype.show = function(){
	this.visible = true;
	if(this.label)
		this.label.visible = true;
};

//Включает кнопку
Button.prototype.enable = function(){
	if(this.inputEnabled)
		return;
	this.frame = 0;
	this.inputEnabled = true;

	if(this.label){
		this.label.alpha = 1;
		if(this.label.isDown){
			this.label.isDown = false;
			this.updatePosition();
		}
	}
};

//Выключает кнопку
Button.prototype.disable = function(){
	if(!this.inputEnabled)
		return;
	this.frame = 3;
	this.inputEnabled = false;

	if(this.label){
		this.label.alpha = 0.55;
		if(!this.label.isDown){
			this.label.y += this.label.downOffset;
			this.label.isDown = true;
		}
	}
};

//Меняет или восстанавливает заданную позицию
Button.prototype.updatePosition = function(position){
	if(position)
		this.defaultPosition = position;
	else
		position = this.defaultPosition;
	if(typeof position == 'function')
		position = position(this.width, this.height);
	this.x = position.x;
	this.y = position.y;

	if(this.label){
		this.label.x = this.centerX;
		this.label.y = this.centerY;
		if(!this.label.isText){
			this.label.x++;
			this.label.y -= this.label.downOffset/2;
		}
		if(this.label.isDown)
			this.label.y += this.label.downOffset;
	}
};

//Расширение Phaser.Button.changeStateFrame, для добавления изменения позиции текста
//при изменении состоянии кнопки
Button.prototype.changeStateFrame = function (state) {
	if(this.label && this.inputEnabled){
		if(state != 'Down' && this.label.isDown){
			this.label.isDown = false;
			this.updatePosition();
		}
		else if(state == 'Down' && !this.label.isDown){
			this.label.isDown = true;
			this.label.y += this.label.downOffset;
		}
	}
	if(this.label)
		this.label.state = state;

	if(this.inputEnabled)
		return Object.getPrototypeOf(Button.prototype).changeStateFrame.call(this, state);
};
