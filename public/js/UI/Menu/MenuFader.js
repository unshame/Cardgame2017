/** Плавно скрывает меню. */
Menu.prototype.fadeOut = function(){
	if(this._fading == -1){
		return;
	}

	this._stopFader();
	this._fading = -1;

	this.disable(true);

	this._fader = game.add.tween(this);
	this._fader.to({alpha: 0}, this.options.fadeTime);
	this._fader.onComplete.addOnce(function(){
		this._fading = 0;
		this._fader = null;
		this._hide();
	}, this);
	this._fader.start();
};

/** Плавно показывает меню. */
Menu.prototype.fadeIn = function(){
	if(this._fading == 1){
		return;
	}

	this._stopFader();
	this._fading = 1;

	this._show();
	this.alpha = 0;

	this._fader = game.add.tween(this);
	this._fader.to({alpha: 1}, this.options.fadeTime);
	this._fader.onComplete.addOnce(function(){
		this._fading = 0;
		this._fader = null;		
		this.enable();
	}, this);
	this._fader.start();
};

/** Плавно показывает или скрывает меню в зависимости от текущего состояния. */
Menu.prototype.fadeToggle = function(){
	switch(this._fading){
		case 0:
		if(this.visible){
			this.fadeOut();
		}
		else{
			this.fadeIn();
		}
		break;

		case 1:
		this.fadeOut();
		break;

		case -1:
		this.fadeIn();
		break;
	}
};

/**
* Останавливает анимацию меню.
* @private
*/
Menu.prototype._stopFader = function(){
	if(!this._fader){
		return;
	}
	this._fader.stop();
	this._fader = null;
	this._fading = 0;
};