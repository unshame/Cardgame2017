UI.Image = function(options){
	this.options = mergeOptions(this.getDefaultOptions(), options);
	Phaser.Image.call(this, game, 0, 0, this.options.texture, this.options.frame);
	this.name = this.options.name;
	this.scale.setTo(this.options.scale, this.options.scale);

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

extend(UI.Image, Phaser.Image, [UI.PopupComponent]);

 UI.Image.prototype.getDefaultOptions = function(){
	return {
		position: {
			x: 0,
			y: 0
		},
		texture: null,
		frame: undefined,
		scale: 1,
		name: null,
		group: null,
		hoverText: null,
		hoverPlacement: 'top',
		fixedWidth: undefined,
		fixedHeight: undefined
	};
};

UI.Image.prototype.show = function(){
	this.visible = true;
};
UI.Image.prototype.hide = function(){
	this.visible = false;
};
UI.Image.prototype.updatePosition = function(position){
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

UI.Image.prototype.enable = function(){};
UI.Image.prototype.disable = function(){};
