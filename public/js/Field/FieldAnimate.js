/** 
* Запускает твин появления поля.
* @param {number} delay задержка до запуска твина
*/
Field.prototype.animateAppearance = function(delay){
	if(!this._entranceTween || this._entranceTween.isRunning){
		return;
	}
	var tweenData = this._entranceTween.timeline[0];
	tweenData.delay = delay || 0;
	this._entranceTween.start();
};

/** Создает твин анимации появления поля. */
Field.prototype.setupAnimatedAppearance = function(){
	if(!this.style.animateAppearance || game.paused){
		return;
	}
	if(game.paused){
		this.endAnimation();
		return;
	}

	if(this._entranceTween){
		this._entranceTween.stop();
	}

	this._entranceTween = game.add.tween(this.position);

	var position = {x: this.x, y: this.y};
	switch(this.style.animateAppearance){
		case 'left':
		this.x -= this.area.width;
		break;

		case 'right':
		this.x += this.area.width;
		break;

		case 'top':
		this.y -= this.area.height;
		break;

		case 'bottom':
		this.y += this.area.height;
		break;

		default:
		console.error('Field: invalid animateAppearance value', this.style.animateAppearance);
		return;
	}
	this._entranceTween.to(position, this.moveTime/game.speed, Phaser.Easing.Quadratic.Out);
	this._entranceTween.onComplete.addOnce(function(){
		this.endAnimation();
	}, this);

	this.placeCards();
};

/** Завершает твин появления поля. */
Field.prototype.endAnimation = function(){
	if(!this._entranceTween){
		return;
	}
	var tweenData = this._entranceTween.timeline[this._entranceTween.current];
	this.position = tweenData.vEnd;
	this._entranceTween.stop();
	this._entranceTween = null;
	this.placeCards();
};
