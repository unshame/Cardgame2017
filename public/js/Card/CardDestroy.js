Card.prototype._destroyFinally = Phaser.Group.prototype.destroy;

/**
* Полностью удаляет карту из игры с анимацией.
* @param {number}  [delay=0] задержка перед удалением
* @param {boolean} [now]     убирает анимацию удаления и игнорирует задержку
*/
Card.prototype.destroy = function(delay, now) {
	if(delay === undefined || now){
		delay = 0;
	}

	var time = 1000,
		alphaTween = this.game.add.tween(this.sprite),
		scaleTween = this.game.add.tween(this.sprite.scale);

	this._destroyPending = true;
	
	if(cardControl.card == this){
		cardControl.reset('card destroyed');
	}
	delete cardManager.cards[this.id];
	this.setDraggability(false);
	this.setPlayability(false);
	this.setHighlight(false);
	if(this.mover){
		this.mover.stop();
	}
	if(this._rotator){
		this._rotator.stop();
	}
	if(this._flipper){
		this._flipper.stop();
	}
	if(this.field){
		this.field.removeCards([this]);
	}

	if(this.game.paused || now){
		this._destroyNow();
	}
	else{
		alphaTween.to({alpha: 0}, time/this.game.speed, Phaser.Easing.Linear.None, true, delay/this.game.speed);
		scaleTween.to({x: 0.6, y: 0.6}, time/this.game.speed, Phaser.Easing.Linear.None, true, delay/this.game.speed);
		alphaTween.onComplete.addOnce(this._destroyNow, this);
	}
};

/**
* Удаляет карту из игры сразу.
*/
Card.prototype._destroyNow = function() {
	if(cardControl.card == this){
		cardControl.reset('card destroyed');
	}
	if(ui.cursor.overlappingElement == this){
		ui.cursor.overlappingElement = null;
	}
	this.sprite.destroy();
	this.glow.destroy();
	this.removeAll();
	this._destroyFinally();
};
