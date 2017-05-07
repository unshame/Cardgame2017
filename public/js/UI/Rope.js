/**
 * Конструктор фитиля-таймера
 * @class
 */
var Rope = function(){
	var pixel = ui.newPixel();
	Phaser.Sprite.call(this, game, 0, 0, pixel.generateTexture());
	this.tint = ui.colors.orange;
	this.width = 30;
	this.height = 0;
	this.y = game.screenHeight;
	this.anchor.setTo(0, 1);
	this.name = 'rope';
	game.add.existing(this);

	this.startTime = 0;
	this.duration = 0;
	this.isBurning = false;
	this.maxHeight = game.screenHeight;

};

Rope.prototype = Object.create(Phaser.Sprite.prototype);
Rope.prototype.constructor = Rope;

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
		this.height = left/this.duration * this.maxHeight;
		if(left <= 5000 && this.tint != ui.colors.red)
			this.tint = ui.colors.red;
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
	this.startTime = start ? (now + start) : now; 
	this.duration = duration;
	this.height = this.maxHeight;
};

//Останавливает таймер
Rope.prototype.stop = function(){
	this.isBurning = false;
	this.height = 0;
	this.startTime = 0;
	this.duration = 0;
	this.tint = '0xFF8300';
};

Rope.prototype.updatePosition = function(){
	this.rope.maxHeight = this.rope.y = game.screenHeight;
};