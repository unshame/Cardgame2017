UI.Text = function(options){
	this.options = mergeOptions(this.getDefaultOptions(), options);
	Phaser.Text.call(this, game, 0, 0, this.options.text);
	this.name = this.options.name;
	this.align = 'center';
	this.font = this.options.font;
	this.fontSize = this.options.fontSize;
	this.fontWeight = this.options.fontWeight;
	this.setShadow(1, 1, 'rgba(0,0,0,0.5)', 1);
	this.fill = this.options.textColor;

	this.fixedWidth = this.options.fixedWidth;
	this.fixedHeight = this.options.fixedHeight;

	if(this.options.hoverText && Phaser.Device.desktop){
		UI.PopupComponent.call(
			this,
			this,
			this.options.hoverPlacement,
			this.options.hoverText
		);
	}
	
	if(this.options.group){
		this.options.group.add(this);
	}
	else{
		game.add.existing(this);
	}
};

extend(UI.Text, Phaser.Text, [UI.PopupComponent]);

 UI.Text.prototype.getDefaultOptions = function(){
	return {
		position: {
			x: 0,
			y: 0
		},
		text: null,
		name: null,
		textColor: 'black',
		font: 'Exo',
		fontSize: 26,
		group: null,
		hoverText: null,
		hoverPlacement: 'top',
		fixedWidth: undefined,
		fixedHeight: undefined
	};
};

UI.Text.prototype.show = function(){
	this.visible = true;
};
UI.Text.prototype.hide = function(){
	this.visible = false;
};
UI.Text.prototype.updatePosition = function(position){
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
	this.y = position.y;
};

UI.Text.prototype.enable = function(){};
UI.Text.prototype.disable = function(){};

UI.Text.prototype.setTextBounds = function(x, y, width, height, alignH, alignV){
	if(typeof alignH == 'string'){
		this.boundsAlignH = alignH;
	}
	if(typeof alignV == 'string'){
		this.boundsAlignV = alignV;
	}
	supercall(UI.Text).setTextBounds.call(this, x, y, width, height);

	this.wordWrap = true;
	this.wordWrapWidth = width;

	this.fixedWidth = width;
	this.fixedHeight = height;

	return this;
};

UI.Text.limitWidth = function(textDisplay, text, width){
	textDisplay.setText(text);
	if(text.length && textDisplay.width > width){
		textDisplay.setText(text + '...');
		while(textDisplay.width > width && text.length > 3){
			text = text.slice(0, -1);
			textDisplay.setText(text + '...');
		}
	}
	textDisplay.setText(textDisplay.text, true);
};