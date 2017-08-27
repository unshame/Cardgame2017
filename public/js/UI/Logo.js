/**
* Лого игры.
* @class
* @param {object|function} position Позиция лого в виде объекта или функции,
*                                   возвращающей объект вида `{x, y}`;                                  
* @param {number}          scale    Максимальный масштаб лого (будет уменьшен, если лого не влезает в экран).
* @param {string}          texture  Название текстуры лого.
* @param {string}          [name]   Имя лого в {@link UI.Layers}.
*/
UI.Logo = function(position, scale, texture, name){
	Phaser.Image.call(this, game, 0, 0, texture);
	this.name = name || 'logo';
	this.defaultPosition = position;
	this.defaultScale = scale;
	this.fader = null;
	this.anchor.set(0.5, 0.5);
	this.updatePosition();	
};

extend(UI.Logo, Phaser.Image);

/**
* Обновляет позицию и масштаб лого.
*/
UI.Logo.prototype.updatePosition = function(){
	var position = this.defaultPosition;	
	var width = this.width/this.scale.x;
	var scale = this.defaultScale;

	if(scale * width > game.screenWidth){
		scale = game.screenWidth/width;
	}
	this.scale.set(scale, scale);

	if(typeof position == 'function'){
		position = position(this.width, this.height);
	}
	this.x = position.x;
	this.y = position.y;
};

/** Плавно показывает лого */
UI.Logo.prototype.fadeIn = function(){
	if(this.fader){
		this.fader.stop();
	}
	this.visible = true;
	this.fader = game.add.tween(this);
	this.fader.to({alpha: 1}, 200);
	this.fader.onComplete.addOnce(function(){
		this.fader = null;
	}, this);
	this.fader.start();
};

/** Плавно прячет лого */
UI.Logo.prototype.fadeOut = function(){
	if(this.fader){
		this.fader.stop();
	}
	this.fader = game.add.tween(this);
	this.fader.to({alpha: 0}, 200);
	this.fader.onComplete.addOnce(function(){
		this.visible = false;
		this.fader = null;
	}, this);
	this.fader.start();
};