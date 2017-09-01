/**
* Находится ли указатель над картой.
* @return {boolean}
*/
Card.prototype.cursorIsOver = function(){
	return Phaser.Rectangle.containsRaw(
		this.x + this.sprite.x - this.sprite.width/2,
		this.y + this.sprite.y - this.sprite.height/2,
		this.sprite.width,
		this.sprite.height,
		this.game.input.x,
		this.game.input.y
	) && this.draggable;
};

/**
* Вызывается при нажатии на карту.
* @param {Phaser.Sprite}  sprite  {@link Card#sprite}
* @param {Phaser.Pointer} pointer вызвавший ивент указатель
*/
Card.prototype._cursorDown = function(sprite, pointer){
	cardControl.cardClick(this, pointer);
};

/**
* Вызывается при окончании нажатия на карту.
* @param {Phaser.Sprite}  sprite  {@link Card#sprite}
* @param {Phaser.Pointer} pointer вызвавший ивент указатель
*/
Card.prototype._cursorUp = function(sprite, pointer){
	cardControl.cardUnclick(this, pointer);
};

/**
* Вызывается при наведении на карту.
* @param {Phaser.Sprite}  sprite  {@link Card#sprite}
* @param {Phaser.Pointer} pointer вызвавший ивент указатель
*/
Card.prototype._cursorOver = function(sprite, pointer){
	if(this.field){
		this.field.focusOnCard(this, pointer);
	}
	cardControl.pickNotifier.consider(this);
};

/**
* Вызывается когда указатель покидает спрайт карты.
* @param {Phaser.Sprite} sprite {@link Card#sprite}
*/
Card.prototype._cursorOut = function(sprite){
	if(this.field){
		this.field.focusOffCard(this);
	}
	cardControl.pickNotifier.reject(this);
};