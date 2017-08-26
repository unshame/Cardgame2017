/**
* Конструктор кнопок с текстом
* @class
*/

var Button = function(options){

	this.options = mergeOptions(this.getDefaultOptions(), options);

	// Действие
	this.action = this.options.action;
	var thisButton = this;
	function actionWrapper(button, pointer, isOver){
		if(isOver || (!Phaser.Device.desktop && !this.options.mobileClickProtect)){
			if(cardControl.card){
				cardControl.cardReturn();
			}
			thisButton.action.call(this, button, pointer, isOver);
		}
	}

	// Phaser кнопка
	Phaser.Button.call(
		this, game,
		0,
		0,
		'button_' + this.options.color + '_' + this.options.size,
		actionWrapper,
		this.options.context || this,
		1, 0, 2, 0
	);

	this.name = this.options.name;
	this.isDown = false;

	this.scale.set(this.options.scale, this.options.scale);

	//Текст
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
		this.label.downOffset = this.options.downOffset;
		this.label.anchor.set(0.5, 0.5);
	}

	this.updatePosition(this.options.position);


	// Убираем дефолтный курсор
	this.input.useHandCursor = false;

	game.add.existing(this);
	if(this.label){
		game.add.existing(this.label);
	}

	// Группа
	if(this.options.group){
		this.group = this.options.group;
		this.group.add(this);
		if(this.label){
			this.group.add(this.label);
		}
	}
};

extend(Button, Phaser.Button);

Button.prototype.getDefaultOptions = function(){
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
		font: '28px Exo',
		fontSize: 30,
		context: null,
		group: null,
		mobileClickProtect: false,
		scale: 1
	};
};

// Прячет кнопку
Button.prototype.hide = function(){
	this.visible = false;
	if(this.label){
		this.label.visible = false;
	}
};

// Показывает кнопку
Button.prototype.show = function(){
	this.visible = true;
	if(this.label){
		this.label.visible = true;
	}
};

// Включает кнопку
Button.prototype.enable = function(){
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

// Выключает кнопку
Button.prototype.disable = function(changeToDefaultFrame){
	if(!this.inputEnabled){
		return;
	}
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
			this.label.y += this.label.downOffset;
			this.isDown = true;
		}
	}
};

// Меняет или восстанавливает заданную позицию
Button.prototype.updatePosition = function(position){
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
			this.label.y -= this.label.downOffset/2;
		}
		if(this.isDown){
			this.label.y += this.label.downOffset;
		}
	}
};

// Расширение Phaser.Button.changeStateFrame, для добавления изменения позиции текста
// при изменении состоянии кнопки
Button.prototype.changeStateFrame = function (state) {
	if(this.label && this.inputEnabled){
		if(state != 'Down' && this.isDown){
			this.isDown = false;
			this.updatePosition();
		}
		else if(state == 'Down' && !this.isDown){
			this.isDown = true;
			this.label.y += this.label.downOffset;
		}
	}
	if(this.label){
		this.label.state = state;
	}

	if(this.inputEnabled){
		return supercall(Button).changeStateFrame.call(this, state);
	}
};

Button.prototype.cursorIsOver = function(){
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

Button.prototype.update = function(){
	if(this.cursorIsOver()){
		ui.layers.updateCursorOverlap(this);
	}
};

Button.prototype.destroy = function(){
	if(this.label){
		this.label.destroy();
	}
	supercall(Button).destroy();
};

Button.prototype.removeFromParent = function(destroy){
	if(this.parent){
		if(this.label){
			this.parent.remove(this.label);
		}
		this.parent.remove(this, destroy);
	}
}