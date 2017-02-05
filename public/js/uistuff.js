var Rope = function(){
	var pixel = app.make.graphics(0, 0);
	pixel.beginFill(0xFF8300);
	pixel.drawRect(0, 0, 1, 1);
	pixel.endFill();

	this.sprite = app.add.sprite(0, 0, pixel.generateTexture());
	this.sprite.width = 30;
	this.sprite.height = 0;
	this.sprite.y = app.screenHeight;
	this.sprite.anchor.setTo(0, 1);
	this.startTime = 0;
	this.duration = 0;
	this.isBurning = false;
	this.maxHeight = app.screenHeight;
}

Rope.prototype.update = function(){
	var now = new Date().getTime();
	if(!this.isBurning && this.startTime && this.startTime < now)
		isBurning = true;

	else if(!this.isBurning)
		return;
	var endTime = this.duration + this.startTime
	var left = endTime - now;
	if(left <= 0){
		this.stop();
	}
	else{
		this.sprite.height = left/this.duration * this.maxHeight;
	}
}

Rope.prototype.start = function(duration, start){
	if(!duration || isNaN(duration))
		return false;

	if(this.isBurning)
		this.stop();

	var now = new Date().getTime();
	this.isBurning = true;
	this.startTime = start && now + start || now; 
	this.duration = duration;
	this.sprite.height = this.maxHeight;
}

Rope.prototype.stop = function(){
	this.isBurning = false;
	this.sprite.height = 0;
	this.startTime = 0;
	this.duration = 0;
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