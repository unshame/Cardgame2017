UI.InputField = function(options){
	this.options = mergeOptions(this.getDefaultOptions(), options);

	this.defaultPosition = this.options.position;

	var padding = this.options.padding;
	var inputFieldOptions = {
		padding: padding,
		width: this.options.width - padding*2,
		height: this.options.height - padding*2,
		font: this.options.font,
		placeHolder: this.options.placeHolder,
		max: this.options.maxChars,
		fill: this.options.textColor
	};

	PhaserInput.InputField.call(this, game, 0, 0, inputFieldOptions);

	this.name = this.options.name;

	this.loadTexture('field_' + this.options.size);

	if(this.options.group){
		this.options.group.add(this);
	}
	else{
		game.add.existing(this);
	}

	this.input.useHandCursor = false;

	this.fixedWidth = this.options.fixedWidth;
	this.fixedHeight = this.options.fixedHeight;

	if(this.fixedWidth === null){
		this.fixedWidth = this.options.width;
	}
	if(this.fixedHeight === null){
		this.fixedHeight = this.options.height;
	}

	this.updatePosition();
};

extend(UI.InputField, PhaserInput.InputField);

UI.InputField.prototype.getDefaultOptions = function(){
	return {
		position: {
			x: 0,
			y: 0
		},
		size: 'wide',
		width: 190,
		height: 49,
		padding: 8,
		margin: 2,
		font: '26px Exo',
		textColor: 'black',
		name: null,
		placeHolder: null,
		maxChars: undefined,
		group: null,
		fixedWidth: null,
		fixedHeight: null
	};
};

UI.InputField.prototype.updatePosition = function(position){
	if(position){
		this.defaultPosition = position;
	}
	else{
		position = this.defaultPosition;
	}
	if(typeof position == 'function'){
		position = position.call(this, this.width, this.height);
	}
	this.x = position.x;
	this.y = position.y + this.options.margin;
};

UI.InputField.prototype.show = function(){
	this.visible = true;
};
UI.InputField.prototype.hide = function(){
	this.visible = false;
};
UI.InputField.prototype.enable = function(){
	this.inputEnabled = true;
};
UI.InputField.prototype.disable = function(){
	this.inputEnabled = false;
};

UI.InputField.prototype.cursorIsOver = function(){
	if(!this.visible){
		return false;
	}

	var gx = this.parent ? this.parent.worldPosition.x : 0,
		gy = this.parent ? this.parent.worldPosition.y : 0;

	return Phaser.Rectangle.containsRaw(
		gx + this.x,
		gy + this.y,
		this.options.width,
		this.options.height,
		game.input.x,
		game.input.y
	);
};

UI.InputField.prototype.update = function(){
	supercall(UI.InputField).update.call(this);
	if(this.cursorIsOver()){
		ui.layers.updateCursorOverlap(this);
	}
};

UI.InputField.prototype.getText = function(){
	return this.text.text;
};

