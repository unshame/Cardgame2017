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

	this.disabledAlpha = 0.5;

	if(!this.previousContent){
		this.arrowLeft.alpha = this.disabledAlpha;
		this.arrowLeft.disable();
	}
	if(!this.nextContent){
		this.arrowRight.alpha = this.disabledAlpha;
		this.arrowRight.disable();
	}

	UI.ButtonBase.setStateFrames(this.arrowLeft, 0);
	UI.ButtonBase.setStateFrames(this.arrowRight, 1);

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
	if(i < 0 || i >= this.content.length){
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

	this.nextContent = this.content[i + 1] || null;
	this.previousContent = this.content[i - 1] || null;

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
		c.setText(c.text);
	})
};
