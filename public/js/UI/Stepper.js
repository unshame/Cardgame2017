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

	this.content = [];
	this.keys = [];

	this.disabledAlpha = 0.5;

	this.maxHeight = this.options.minHeight;
	this.maxWidth = this.options.minWidth;

	this.arrowRight = new UI.Button({
		color: this.options.color,
		size: 'arrow',
		action: this.next.bind(this),
		name: 'arrowRight',
		group: this
	});

	this.arrowLeft = new UI.Button({	
		color: this.options.color,
		size: 'arrow',
		action: this.prev.bind(this),
		name: 'arrowLeft',
		group: this
	});

	UI.ButtonBase.setStateFrames(this.arrowLeft, 0);
	UI.ButtonBase.setStateFrames(this.arrowRight, 1);

	this.defaultPosition = this.options.position;

	this.setChoices(this.options.choices, this.options.startKey);
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

UI.Stepper.prototype.setChoices = function(choices, startKey){

	this.keys.length = 0;

	this.content.forEach(function(c){
		c.destroy();
	});

	this.content.length = 0;

	if(Array.isArray(choices)){
		choices.forEach(function(choice){
			var key, value;
			if(Array.isArray(choice)){
				key = choice[0];
				value = choice[1];
			}
			else{
				key = value = choice;
			}
			this.addTextContent(key, value);
		}, this);
	}
	else{
		for(var key in choices){
			if(choices.hasOwnProperty(key)){
				this.addTextContent(key, choices[key]);
			}
		}
	}

	if(this.content.length === 0){
		this.addTextContent('default', 'NO_CHOICES');
	}

	this.index = 0;

	for(var i = 0; i < this.content.length; i++){
		if(this.content[i].width > this.maxWidth){
			this.maxWidth = this.content[i].width;
		}
		if(this.content[i].height > this.maxHeight){
			this.maxHeight = this.content[i].height;
		}
	}

	var keyIndex = startKey ? this.keys.indexOf(startKey) : -1;
	this.index = ~keyIndex ? keyIndex : 0;

	this.currentContent = this.content[this.index];
	this.previousContent = this.content[this.index - 1] || null;
	this.nextContent = this.content[this.index + 1] || null;
	this.limitLeft = 0;
	this.limitRight = this.content.length - 1;
	this.currentContent.visible = true;

	this.enable();

	this.updatePosition();
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

	var left = this.arrowLeft;
	var right = this.arrowRight;
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

UI.Stepper.prototype.disable = function(passive){
	this.arrowLeft.disable(passive);
	this.arrowRight.disable(passive);
	if(!passive){
		this.arrowLeft.alpha = this.disabledAlpha;
		this.arrowRight.alpha = this.disabledAlpha;
		this.currentContent.alpha = this.disabledAlpha;
	}
};

UI.Stepper.prototype.enable = function(){
	if(this.nextContent){
		this.arrowRight.enable();
		this.arrowRight.alpha = 1;
	}
	else{
		this.arrowRight.disable();
		this.arrowRight.alpha = this.disabledAlpha;
	}
	if(this.previousContent){
		this.arrowLeft.enable();
		this.arrowLeft.alpha = 1;
	}
	else{
		this.arrowLeft.disable();
		this.arrowLeft.alpha = this.disabledAlpha;
	}
	this.currentContent.alpha = 1;
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

UI.Stepper.prototype.setToIndex = function(i, doAction){
	if(i < this.limitLeft || i > this.limitRight){
		return;
	}

	if(doAction === undefined){
		doAction = true;
	}

	if(this.currentContent instanceof Phaser.Text){
		this.currentContent.visible = false;
	}
	else{
		this.currentContent.hide();
	}

	this.currentContent = this.content[i];

	if(this.currentContent instanceof Phaser.Text){
		this.currentContent.visible = true;
	}
	else{
		this.currentContent.show();
	}

	this.nextContent = (i + 1 <= this.limitRight && this.content[i + 1]) ? this.content[i + 1] : null;
	this.previousContent = (i - 1 >= this.limitLeft && this.content[i - 1]) ? this.content[i - 1] : null;

	this.index = i;

	this.enable();

	if(doAction){
		this.action.call(null, this.keys[i]);
	}
};

UI.Stepper.prototype.setTo = function(key, doAction){
	for(var i = 0; i < this.keys.length; i++){
		if(this.keys[i] == key){
			this.setToIndex(i, doAction); 
			break;
		}
	}
};

UI.Stepper.prototype.next = function(){		
	if(this.nextContent){
		this.setToIndex(this.index + 1);
	}
};

UI.Stepper.prototype.prev = function(){
	if(this.previousContent){
		this.setToIndex(this.index - 1);
	}
};

UI.Stepper.prototype.cursorIsOver = function(){
	return (
		this.arrowLeft.cursorIsOver() ||
		this.arrowRight.cursorIsOver() ||
		this.currentContent.cursorIsOver &&
		this.currentContent.cursorIsOver()
	);
};

UI.Stepper.prototype.update = function(){
	if(this.cursorIsOver()){
		ui.layers.updateCursorOverlap(this);
	}
};

UI.Stepper.prototype.loadLabels = function(){
	this.content.forEach(function(c){
		c.setText(c.text, true);
	});
};

UI.Stepper.prototype.getCurrentKey = function(){
	return this.keys[this.index];
};

UI.Stepper.prototype.limitRange = function(left, right){

	if(left !== undefined){
		if(left < 0){
			left = 0;
		}
		this.limitLeft = left;
	}

	if(right !== undefined){
		if(right > this.content.length - 1){
			right = this.content.length - 1;
		}
		this.limitRight = right;
	}

	if(this.limitRight < this.limitLeft){
		this.disable();
	}
	else{
		if(this.index < this.limitLeft){
			this.setTo(this.limitLeft);
		}
		else if(this.index > this.limitRight){
			this.setTo(this.limitRight);
		}
		else{
			this.setTo(this.index);
		}
	}
};
