/**
* Конструктор фитиля-таймера.
* @class
* @extends {Phaser.Sprite}
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
	this.burning = false;
	this.maxHeight = game.screenHeight;

};

extend(Rope, Phaser.Sprite);

/**
* Обновляет прогресс таймера.
*/
Rope.prototype.update = function(){
	var now = Date.now(),
		burning = false;
	if(!this.burning && this.startTime && this.startTime < now){
		burning = true;
	}

	else if(!this.burning){
		return;
	}
	var endTime = this.duration + this.startTime,
		left = endTime - now;
	if(left <= 0){
		this.stop();
	}
	else{
		this.height = left/this.duration* this.maxHeight;
		if(left <= 5000 && this.tint != ui.colors.red){
			this.tint = ui.colors.red;
		}
	}
};

/**
* Запускает таймер.
* @param {number} duration время таймера
* @param {number} start    через сколько времени начинать отсчет
*/
Rope.prototype.start = function(duration, start){
	if(!duration || isNaN(duration)){
		return false;
	}

	if(this.burning){
		this.stop();
	}

	var now = Date.now();
	this.burning = true;
	this.startTime = start ? (now + start) : now; 
	this.duration = duration;
	this.height = this.maxHeight;
};

/**
* Останавливает таймер.
*/
Rope.prototype.stop = function(){
	this.burning = false;
	this.height = 0;
	this.startTime = 0;
	this.duration = 0;
	this.tint = ui.colors.orange;
};

/**
* Обновляет позицию таймера.
*/
Rope.prototype.updatePosition = function(){
	this.maxHeight = this.y = game.screenHeight;
};