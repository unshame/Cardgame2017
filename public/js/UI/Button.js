var Button = function(position, action, text, context, group){
	function actionWrapper(button, pointer, isOver){
		if(isOver)
			action.call(this, button, pointer, isOver);
	}
	this.defaultPosition = position;
	if(typeof position == 'function')
		position = position();
	this.action = action;
	Phaser.Button.call(this, game, position.x, position.y, 'button_grey_wide', actionWrapper, context || this, 1, 0, 2, 0);
	game.add.existing(this);
	this.style = { font: '24px Exo', fill: '#000', align: 'center' };
	this.text = game.add.text(this.centerX, this.centerY, text, this.style);
	this.text.anchor.set(0.5, 0.5);
	this.text.state = 'Out';
	this.text.downOffset = 5;
	this.input.useHandCursor = false;
	if(group){
		group.add(this);
		group.add(this.text);
	}

};

Button.prototype = Object.create(Phaser.Button.prototype);
Button.prototype.constructor = Button;


Button.prototype.hide = function(){
	this.visible = false;
	this.text.visible = false;
};

Button.prototype.show = function(){
	this.visible = true;
	this.text.visible = true;
};

Button.prototype.enable = function(){
	if(this.inputEnabled)
		return;
	this.frame = 0;
	this.inputEnabled = true;
	this.text.alpha = 1;
	if(this.text.isDown){
		this.text.isDown = false;
		this.updatePosition();
	}
};

Button.prototype.disable = function(){
	if(!this.inputEnabled)
		return;
	this.frame = 3;
	this.inputEnabled = false;
	this.text.alpha = 0.35;
	if(!this.text.isDown){
		this.text.y += this.text.downOffset;
		this.text.isDown = true;
	}
};

Button.prototype.updatePosition = function(position){
	if(position)
		this.defaultPosition = position;
	else
		position = this.defaultPosition;
	if(typeof position == 'function')
		position = position();
	this.x = position.x;
	this.y = position.y;
	this.text.x = this.centerX;
	this.text.y = this.centerY;
	if(this.text.isDown)
		this.text.y += this.text.downOffset;
};

Button.prototype.changeStateFrame = function (state) {
	if(this.text && this.inputEnabled){
		if(state != 'Down' && this.text.isDown){
			this.text.isDown = false;
			this.updatePosition();
		}
		else if(state == 'Down' && !this.text.isDown){
			this.text.isDown = true;
			this.text.y += this.text.downOffset;
		}
	}
	if(this.text)
		this.text.state = state;

	if(this.inputEnabled)
		return Object.getPrototypeOf(Button.prototype).changeStateFrame.call(this, state);

};