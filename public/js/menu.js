
var Menu = function(x,y){

	var pixel = app.newPixel();
	this.background = app.add.sprite(0, 0, pixel.generateTexture());
	this.base = app.add.group();
	this.options = {};
	this.options.x = x;
	this.options.y = y;
	this.margin = 50;
	this.opened = false;

	this.base.add(this.background);
	this.buttons = [];


}

Menu.prototype.addButton = function (action,text) {
	var button = new Button(0,0,action,text);

	this.buttons.push(button);
	this.base.add(button);
	this.base.add(button.text);
	this.update();
	if(!this.opened)
		this.hide();
}

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
}

Menu.prototype.reposition = function(){
	this.base.x = this.options.x - this.background.width/2;
	this.base.y = this.options.y - this.background.height/2;
	var x = 0;
	for (var i = 0; i < this.buttons.length; i++) {
		var button = this.buttons[i];
		var y = 0;
		for (var k = 0; k < i; k++) {
			y += this.buttons[k].height + this.margin;
		}
		button.reposition(this.base.width/2 - button.width/2, y + this.margin);
	}
}

Menu.prototype.update = function(){
	this.resize();
	this.reposition();
}

Menu.prototype.hide = function(){
	this.opened = false;
	this.background.kill();
	for (var i = 0; i < this.buttons.length; i++) {
		this.buttons[i].kill();
	}
}

Menu.prototype.reset = function(){
	this.opened = true;
	this.background.reset();
	for (var i = 0; i < this.buttons.length; i++) {
		this.buttons[i].reset();
	}
	this.update();
}


var Button = function(x, y, action, text){
	Phaser.Button.call(this, app, x, y, 'button_grey_wide', action, this, 1, 0, 2, 0);
	app.add.existing(this);
	this.style = { font: '18px Verdana', fill: '#000', align: 'center' };
	this.text = app.add.text(this.centerX, this.centerY, text, this.style);
	this.text.anchor.set(0.5, 0.5)
	

}

Button.prototype = Object.create(Phaser.Button.prototype);
Button.prototype.constructor = Button;

Button.prototype.hide = function(){
	this.visible = false;
	this.text.visible = false;
}

Button.prototype.show = function(){
	this.visible = true;
	this.text.visible = true;
}

Button.prototype.reposition = function(x, y){
	this.x = x;
	this.y = y;
	this.text.x = this.centerX;
	this.text.y = this.centerY;
}
Button.prototype.showSpot = function(){
	server.onConnect(conn);
}