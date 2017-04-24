/*
 * Конструктор фитиля-таймера
 */
var Rope = function(){
	var pixel = game.newPixel();

	this.sprite = game.add.sprite(0, 0, pixel.generateTexture());
	this.sprite.tint = game.colors.orange;
	this.sprite.width = 30;
	this.sprite.height = 0;
	this.sprite.y = game.screenHeight;
	this.sprite.anchor.setTo(0, 1);
	this.startTime = 0;
	this.duration = 0;
	this.isBurning = false;
	this.maxHeight = game.screenHeight;
};

//Обновляет прогресс таймера
Rope.prototype.update = function(){
	var now = new Date().getTime(),
		isBurning = false;
	if(!this.isBurning && this.startTime && this.startTime < now)
		isBurning = true;

	else if(!this.isBurning)
		return;
	var endTime = this.duration + this.startTime,
		left = endTime - now;
	if(left <= 0){
		this.stop();
	}
	else{
		var percentage = left/this.duration;
		this.sprite.height = left/this.duration * this.maxHeight;
		if(percentage < 0.25 && this.sprite.tint != game.colors.red)
			this.sprite.tint = game.colors.red;
	}
};

//Запускает таймер
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
};

//Останавливает таймер
Rope.prototype.stop = function(){
	this.isBurning = false;
	this.sprite.height = 0;
	this.startTime = 0;
	this.duration = 0;
	this.sprite.tint = '0xFF8300';
};

