//ЗНАЧЕНИЯ

/**
* Задает значения для установки в будущем.
* Отсутствие suit означает, что карта лежит рубашкой вверх.
* @param  {(number|null)} [suit=null]  - масть карты
* @param  {number} [value=0] - значение карты
*/
Card.prototype.presetValue = function(suit, value){
	if(suit === undefined)
		suit = null;

	if(
		(suit === null && this.suit === null) ||
		(suit == this.suit && value == this.value)
	)
		return;

	if(suit === null){
		this.suit = null;
		this.value = 0;
	}
	else{
		this.suit = suit;
		this.value = value;
	}
	this._valueChanged = true;
};

/** 
* Устанавливает заданные ранее значения и переворачивает карту.
*/
Card.prototype.applyValue = function(){
	if(!this._valueChanged)
		return;

	this._valueChanged = false;

	if(this._flipper){
		this._flipper.stop();
		this._flipper = null;
	}

	if(game.paused){
		this.setValue(this.suit, this.value, false);
		return;
	}

	this._flipper = game.add.tween(this.sprite.scale);
	this._flipper.to({x: 0}, (this.flipTime/game.speed)/2);
	this._flipper.to({x: this.skin.scale}, (this.flipTime/game.speed)/2);

	if(this.suit === null){
		this._flipper.onChildComplete.addOnce(function(){
			this.sprite.frame = this.skin.cardbackFrame;
		}, this);
		this.setDraggability(false);
	}
	else{
		this._flipper.onChildComplete.addOnce(function(){
			this.sprite.frame =  this.skin.firstValueFrame + this.suit*13 + this.value - 2;
		}, this);
	}
	this._flipper.start();
};

/**
* Устанавливает значение карты сразу, с анимацией или без.
* Отсутствие suit означает, что карта лежит рубашкой вверх.
* @param  {(number|null)} [suit=null]  - масть карты
* @param  {number} [value=0] - значение карты
* @param {boolean} [animate=true] - анимировать ли переворот карты
*/
Card.prototype.setValue = function(suit, value, animate){

	if(suit === undefined)
		suit = null;

	if(animate === undefined)
		animate = true;

	if(animate && !game.paused){
		this.presetValue(suit, value);
		this.applyValue();
	}
	else if(suit === null){
		this.suit = null;
		this.value = 0;
		this.sprite.frame = this.skin.cardbackFrame;
	}
	else{
		this.suit = suit;
		this.value = value;
		this.sprite.frame =  this.skin.firstValueFrame + this.suit*13 + this.value - 2;
	}		
};

/**
* Устанавливает перетаскиваемость карты.
* @param {boolean} draggable - значение перетаскиваемости
*/
Card.prototype.setDraggability = function(draggable){	
	this.draggable = draggable;
};

/**
* Устанавливает, можно ли ходить этой картой.
* @param {boolean} playable - играбильность карты
* @param {number} [tint=ui.colors.orange] - цвет свечения карты
*/
Card.prototype.setPlayability = function(playable, tint){
	if(this.highlighted)
		this.highlighted = false;

	if(playable){
		this._glowStart(0.25, 0.75, 1500, 500, tint || ui.colors.orange);
	}
	else{
		this._glowStop();
	}
	this.playable = playable;
};

Card.prototype.setHighlight = function(highlighted, tint){
	if(this.playable)
		this.playable = false;

	if(highlighted){
		this._glowStart(0.5, 0.75, 1500, 0, tint || ui.colors.orange);
	}
	else{
		this._glowStop();
	}
	this.highlighted = highlighted;
};
