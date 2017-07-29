
var Menu = function(x, y, z){
	var pixel = ui.newPixel();
	this.background = game.add.sprite(0, 0, pixel.generateTexture());
	this.base = game.add.group();
	this.options = {};
	this.options.x = x;
	this.options.y = y;
	this.margin = 50;
	this.opened = true;

	this.base.add(this.background);
	this.buttons = [];

	ui.layers.addExistingLayer(this.base, z, true);
};

Menu.prototype.addButton = function (action, name, text) {
	var button = new Button({
		color: 'grey',
		size: 'wide',
		action: action,
		text: text,
		name: name,
		context: this,
		group: this.base
	});

	this.buttons.push(button);
	this.update();
};

Menu.prototype.resize = function(){
	var width = 0,
		height = 0;

	for (var i = 0; i < this.buttons.length; i++) {
		var button = this.buttons[i];
		height += button.height;
		if(i < this.buttons.length - 1)
			height += this.margin;
		if(width < button.width)
			width = button.width;
	}

	this.background.width = width + this.margin*2;
	this.background.height = height + this.margin*2;
};

Menu.prototype.updatePosition = function(){
	this.base.x = this.options.x - this.background.width/2;
	this.base.y = this.options.y - this.background.height/2;
	for (var i = 0; i < this.buttons.length; i++) {
		var button = this.buttons[i];
		var y = 0;
		for (var k = 0; k < i; k++) {
			y += this.buttons[k].height + this.margin;
		}
		button.updatePosition({x: this.base.width/2 - button.width/2, y: y + this.margin});
	}
};

Menu.prototype.update = function(){
	this.resize();
	this.updatePosition();
	if(!this.opened)
		this.hide();
};

Menu.prototype.hide = function(){
	this.opened = false;
	this.background.visible = false;
	for (var i = 0; i < this.buttons.length; i++) {
		this.buttons[i].hide();
	}
};

Menu.prototype.reset = function(){
	this.opened = true;
	this.background.visible = true;
	for (var i = 0; i < this.buttons.length; i++) {
		this.buttons[i].show();
	}
};
Menu.prototype.toggle = function(){
	if(this.opened)
		this.hide();
	else
		this.reset();
};