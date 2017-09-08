/**
* Конструктор фитиля-таймера.
* @class
* @extends {Phaser.Sprite}
*/
UI.Rope = function(){
	this._bitmapData = game.make.bitmapData();
	Phaser.Sprite.call(this, game, 0, 0, this._bitmapData);
	this.name = 'rope';

	this.lineWidth = 10;
	this.endAngle = 0;
	this.startAngle = 0;
	this.center = null;
	this.bitmapHeight = 0;
	this.radius = 0;

	this.startTime = 0;
	this.duration = 0;
	this.burning = false;
	this.maxHeight = game.screenHeight;
	this.showTime = 15000;
	this.warnTime = 5000;

	this.colorNormal = ui.colors.orange;
	this.colorWarn = ui.colors.red;

	this.burning = false;
};

extend(UI.Rope, Phaser.Sprite);

UI.Rope.prototype.initialize = function(field){
	this.field = field;
	var lineWidth = this.lineWidth;
	var offset = lineWidth/2 + field.style.border/2;
	var center = {
		x: game.screenWidth/2,
		y: field.circleCenter.y + offset
	};
	var radius = center.y - offset;
	var height = game.screenHeight - field.y + offset;

	var y = center.y - height - offset;
	var x = Math.sqrt(radius*radius - y*y);
	if(center.x - x < 0){
		x = center.x;
		y = Math.sqrt(radius*radius - x*x);
	}
	this.endAngle = -Math.atan2(y, x);
	this.startAngle = -Math.atan2(y, -x);
	this.center = center;
	this.bitmapHeight = height;
	this.radius = radius;

	this.x = 0;
	this.y = field.y - offset;
};

UI.Rope.prototype.draw = function(startAngle, endAngle, color){
	var circle = this._bitmapData;
	var center = this.center;
	var ctx = circle.ctx;
	circle.clear();		
	circle.resize(game.screenWidth, this.bitmapHeight);
	ctx.beginPath();
	ctx.arc(center.x, center.y, this.radius, startAngle, endAngle);
	ctx.lineWidth = this.lineWidth;
	ctx.strokeStyle = numberToHexColor(color);
	ctx.globalAlpha = 0.75;
	ctx.lineCap = "round";
	ctx.stroke();
	circle.update();
};

/**
* Запускает таймер.
* @param {number} duration время таймера
* @param {number} start    через сколько времени начинать отсчет
*/
UI.Rope.prototype.start = function(duration, start){
	if(!duration || isNaN(duration)){
		return;
	}

	if(this.burning){
		this.stop();
	}

	var now = Date.now();
	this.burning = true;
	this.startTime = start ? (now + start) : now; 
	this.duration = duration;
};

/**
* Обновляет прогресс таймера.
*/
UI.Rope.prototype.update = function(){
	var now = Date.now();
	var burning = false;
	if(!this.burning && this.startTime && this.startTime < now){
		burning = true;
	}
	else if(!this.burning){
		return;
	}
	var endTime = this.startTime + this.duration;
	var left = endTime - now;
	var color = this.colorNormal;
	if(left <= 0){
		this.stop();
	}
	else if(left <= this.showTime){
		this.visible = true;
		
		if(left <= this.warnTime){
			color = this.colorWarn;
		}
		var dif = this.startAngle - this.endAngle;
		this.draw(this.startAngle, this.endAngle + dif*(1 - left/this.showTime), color);
	}
	else{
		this.visible = false;
	}
};

/**
* Останавливает таймер.
*/
UI.Rope.prototype.stop = function(){
	this.burning = false;
	this.startTime = 0;
	this.duration = 0;
	this._bitmapData.clear();
	this._bitmapData.update();
};

UI.Rope.prototype.deinitialize = function(){
	this.stop();
	this.field = null;
};

/**
* Обновляет позицию таймера.
*/
UI.Rope.prototype.updatePosition = function(){
	if(this.field){
		this.initialize(this.field);
	}
};
