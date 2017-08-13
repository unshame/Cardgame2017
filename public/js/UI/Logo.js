/**
 * Лого игры.
 * @class
 * @param {object|function} position Позиция лого в виде объекта или функции,
 *                                   возвращающей объект вида `{x, y}`;                                  
 * @param {number} scale    Максимальный масштаб лого (будет уменьшен, если лого не влезает в экран).
 * @param {string} texture  Название текстуры лого.
 * @param {string} [name]   Имя лого в {@link UILayers}.
 */
var Logo = function(position, scale, texture, name){
	Phaser.Image.call(this, game, 0, 0, texture);
	this.name = name || 'logo';
	this.defaultPosition = position;
	this.defaultScale = scale;
	this.fader = null;
	this.anchor.set(0.5, 0.5);
	this.updatePosition();	
}

Logo.prototype = Object.create(Phaser.Image.prototype);
Logo.prototype.constructor = Logo;

/**
 * Обновляет позицию и масштаб лого.
 */
Logo.prototype.updatePosition = function(){
	var position = this.defaultPosition;	
	var width = this.width/this.scale.x;
	var height = this.height/this.scale.y;
	var scale = this.defaultScale;

	if(scale * width > game.screenWidth){
		scale = game.screenWidth/width
	}
	this.scale.set(scale, scale);

	if(typeof position == 'function'){
		position = position(this.width, this.height);
	}
	this.x = position.x;
	this.y = position.y;
}

/** Плавно показывает лого */
Logo.prototype.fadeIn = function(){
	if(this.fader){
		this.fader.stop();
	}
	this.visible = true;
	this.alpha = 0;
	this.fader = game.add.tween(this);
	this.fader.to({alpha: 1}, 200);
	this.fader.onComplete.addOnce(function(){
		this.fader = null;
	}, this);
	this.fader.start();
};

/** Плавно прячет лого */
Logo.prototype.fadeOut = function(){
	if(this.fader){
		this.fader.stop();
	}
	this.alpha = 1;
	this.fader = game.add.tween(this);
	this.fader.to({alpha: 0}, 200);
	this.fader.onComplete.addOnce(function(){
		this.visible = false;
		this.fader = null;
	}, this);
	this.fader.start();
};