var Rope = function(){
	var pixel = app.newPixel();

	this.sprite = app.add.sprite(0, 0, pixel.generateTexture());
	this.sprite.tint = '0xFF8300';
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
		var percentage = left/this.duration;
		this.sprite.height = left/this.duration * this.maxHeight;
		if(percentage < 0.25 && this.sprite.tint != '0xC93F3F')
			this.sprite.tint = '0xC93F3F';
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
	this.sprite.tint = '0xFF8300';
}

