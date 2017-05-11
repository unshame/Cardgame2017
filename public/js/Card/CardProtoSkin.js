//СКИН

/**
* Применяет текущий скин к карте.
*/
Card.prototype.applySkin = function(){
	this.sprite.loadTexture(this.skin.sheetName);
	this.glow.loadTexture(this.skin.glowSheetName);
	this.setScale(1);
	this.setValue(this.suit, this.value, false);
};

/**
* Меняет рубашку карт на текущую
*/
Card.prototype.applyCardback = function(){
	if(!this.suit && this.suit !== 0){
		this.sprite.frame = this.skin.cardbackFrame;
	}
};
