UI.Stepper = function(options) {

	this.options = mergeOptions(this.getDefaultOptions(), options);
	
	Phaser.Group.call(this, game, null, this.options.name);

	if(this.options.group){
		this.options.group.add(this);
	}
	else{
		game.add.existing(this);
	}

	this.action = this.options.action.bind(this.options.context || this);

	this.slidesByName = {};
	this.content = [];
	this.keys = [];

	for(var key in this.options.choices){
		if(this.options.choices.hasOwnProperty(key)){
			this.addTextContent(key, this.options.choices[key]);
		}
	}

	if(this.content.length === 0){
		this.addTextContent('default', 'NO_CHOICES');
	}

	this.maxHeight = this.options.minHeight;
	this.maxWidth = this.options.minWidth;
	for(var i = 0; i < this.content.length;i++){
		if(this.content[i].width > this.maxWidth){
			this.maxWidth = this.content[i].width;
		}
		if(this.content[i].height > this.maxHeight){
			this.maxHeight = this.content[i].height;
		}
	}

	var keyIndex = this.options.startKey ? this.keys.indexOf(this.options.startKey) : -1;
	this.index = ~keyIndex ? keyIndex : 0;

	this.currentContent = this.content[this.index];
	this.previousContent = this.content[this.index - 1] || null;
	this.nextContent = this.content[this.index + 1] || null;
	this.currentContent.visible = true;

	this.rightArrow = new UI.Button({
		color: this.options.color,
		size: 'arrow',
		action: this.nextSlide.bind(this),
		name: 'rightArrow',
		group: this
	});

	this.leftArrow = new UI.Button({	
		color: this.options.color,
		size: 'arrow',
		action: this.prevSlide.bind(this),
		name: 'leftArrow',
		group: this
	});

	this.disabledAlpha = 0.5;

	if(!this.previousContent){
		this.leftArrow.alpha = this.disabledAlpha;
		this.leftArrow.disable();
	}
	if(!this.nextContent){
		this.rightArrow.alpha = this.disabledAlpha;
		this.rightArrow.disable();
	}

	UI.ButtonBase.setStateFrames(this.leftArrow, 0);
	UI.ButtonBase.setStateFrames(this.rightArrow, 1);

	this.updatePosition(this.options.position);
};

extend(UI.Stepper, Phaser.Group);

UI.Stepper.prototype.getDefaultOptions = function(){
	return {
		position: {
			x: 0,
			y: 0
		},
		margin: 10,
		name: null,
		color: 'orange',
		textColor: 'white',
		menu: null,
		icon: null,
		group: null,
		fontSize: 28,
		font: 'Exo',
		choices: {},
		startKey: null,
		action: function(){},
		context: null,
		minWidth: 0,
		minHeight: 0
	};
};

UI.Stepper.prototype.updatePosition = function(position){
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

	var left = this.leftArrow;
	var right = this.rightArrow;
	var margin = this.options.margin;	
	left.updatePosition({
		x: 0,
		y: this.maxHeight/2 - left.height/2
	});

	right.updatePosition({
		x: left.width + this.maxWidth + margin*2,
		y: this.maxHeight/2 - left.height/2
	});

	for(var i = 0; i < this.content.length; i++) {
		var x = left.width + margin + this.maxWidth/2 - this.content[i].width/2;
		var y = this.maxHeight/2 - this.content[i].height/2 + 1;
		if(this.content[i].updatePosition){
			this.content[i].updatePosition({
				x: x,
				y: y
			});
		}
		else{
			this.content[i].x = x;
			this.content[i].y = y;
		}
	}
	
};

UI.Stepper.prototype.hide = function(){
	this.visible = false;
};

UI.Stepper.prototype.show = function(){
	this.visible = true;
};

UI.Stepper.prototype.addTextContent = function (key, value) {
	var style = {
		font: this.options.font,
		fontSize: this.options.fontSize,
		fill: this.options.textColor,
		align: 'center'
	};
	var text = game.make.text(this.centerX, this.centerY, value, style);
	text.setShadow(1, 1, 'rgba(0,0,0,0.5)', 1);
	text.visible = false;
	this.add(text);
	this.content.push(text);
	this.keys.push(key);
};

/*UI.Stepper.prototype.addButtonContent = function(action,icon){
	var newBut = new Button({
		color: 'orange',
		size: 'huge',
		action: action,
		icon:icon,
		name: 'default',
		context: 'button',
		group: this
	});
	newBut.hide();
	this.content.push(newBut);
};*/

UI.Stepper.prototype.nextSlide = function(){
		
	if(this.nextContent){
		this.leftArrow.alpha = 1;
		this.leftArrow.enable();

		if(this.currentContent instanceof Phaser.Text){
			this.currentContent.visible = false;
		}
		else{
			this.currentContent.hide();
		}
		if(this.nextContent instanceof Phaser.Text){
			this.nextContent.visible = true;
		}
		else{
			this.nextContent.show();
		}
		this.previousContent = this.currentContent;
		this.currentContent = this.nextContent;
		this.index++;
		if(this.index < this.content.length - 1){
			this.nextContent = this.content[this.index + 1];
		}
		else{
			this.nextContent = null;
			this.rightArrow.alpha = this.disabledAlpha;
			this.rightArrow.disable();
		}

		this.action.call(null, this.keys[this.index]);
	}

};

UI.Stepper.prototype.prevSlide = function(){
	if(this.previousContent){
		this.rightArrow.alpha = 1;
		this.rightArrow.enable();

		if(this.currentContent instanceof Phaser.Text){
			this.currentContent.visible = false;
		}
		else{
			this.currentContent.hide();
		}
		if(this.previousContent instanceof Phaser.Text){
			this.previousContent.visible = true;
		}
		else{
			this.previousContent.show();
		}
		this.nextContent = this.currentContent;
		this.currentContent = this.previousContent;
		this.index--;
		if(this.index !== 0){
	    	this.previousContent = this.content[this.index - 1];
		}
		else{
			this.previousContent = null;
			this.leftArrow.alpha = this.disabledAlpha;
			this.leftArrow.disable();
		}

		this.action.call(null, this.keys[this.index]);
	}
};

UI.Stepper.prototype.cursorIsOver = function(){
	return (
		this.leftArrow.cursorIsOver() ||
		this.rightArrow.cursorIsOver() ||
		this.currentContent.cursorIsOver &&
		this.currentContent.cursorIsOver()
	);
};

UI.Stepper.prototype.update = function(){
	if(this.cursorIsOver()){
		ui.layers.updateCursorOverlap(this);
	}
};

UI.Stepper.prototype.disable = function(passive){
	this.leftArrow.disable(passive);
	this.rightArrow.disable(passive);
	if(!passive){
		this.leftArrow.alpha = this.disabledAlpha;
		this.rightArrow.alpha = this.disabledAlpha;
		this.currentContent.alpha = this.disabledAlpha;
	}
};

UI.Stepper.prototype.enable = function(){
	if(this.nextContent){
		this.rightArrow.enable();
		this.rightArrow.alpha = 1;
	}
	else{
		this.rightArrow.disable();
		this.rightArrow.alpha = this.disabledAlpha;
	}
	if(this.previousContent){
		this.leftArrow.enable();
		this.leftArrow.alpha = 1;
	}
	else{
		this.leftArrow.disable();
		this.leftArrow.alpha = this.disabledAlpha;
	}
	this.currentContent.alpha = 1;
};

UI.Stepper.prototype.loadLabels = function(){
	this.content.forEach(function(c){
		c.setText(c.text);
	})
};
