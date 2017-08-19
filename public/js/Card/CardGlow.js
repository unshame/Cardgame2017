// СВЕЧЕНИЕ

/**
* Запускает свечение.
* @param {number} minGlow                 минимальная прозрачность свечения
* @param {number} maxGlow                 максимальная прозрачность свечения
* @param {number} speed                   время анимации между minGlow и maxGlow
* @param {number} [delayRange=0]          максимальное значение задержки начала свечения
* @param {number} [color=ui.colors.white] цвет свечения
*/
Card.prototype._glowStart = function(minGlow, maxGlow, speed, delayRange, color){
	
	this._glowReset();

	if(color === undefined){
		color = ui.colors.white;
	}

	this.glow.tint = color;

	if(this.game.paused){
		return;
	}

	this._glowDecreaser = this.game.add.tween(this.glow);
	this._glowDecreaser.to(
		{alpha: minGlow}, 
		speed/this.game.speed, 
		Phaser.Easing.Linear.None, 
		false, 
		Math.floor(Math.random()*(delayRange/this.game.speed || 0))
	);

	this._glowIncreaser = this.game.add.tween(this.glow);
	this._glowIncreaser.to(
		{alpha: maxGlow},
		speed/this.game.speed, 
		Phaser.Easing.Linear.None, 
		false, 
		Math.floor(Math.random()*(delayRange/this.game.speed || 0))
	);

	this._glowIncreaser.onComplete.add(function(){
		if(this.glow.visible && this._glowDecreaser){
			this._glowDecreaser.start();
		}
	},this);
	this._glowDecreaser.onComplete.add(function(){
		if(this.glow.visible && this._glowIncreaser){
			this._glowIncreaser.start();
		}
	},this);
	this._glowDecreaser.start();
};

/**
* Останавливает свечение.
*/
Card.prototype._glowStop = function(){
	if(this._glowIncreaser){
		this._glowIncreaser.stop();
		this._glowIncreaser = null;
	}
	if(this._glowDecreaser){
		this._glowDecreaser.stop();
		this._glowDecreaser = null;
	}
	if(this.glow.visible){
		this.glow.kill();
	}
};

/**
* Останавливает и восстанавливает свечение.
*/
Card.prototype._glowReset = function(){
	this._glowStop();
	this.glow.reset();
	this._glowUpdatePosition();
};

/**
* Обновляет позицию свечения.
*/
Card.prototype._glowUpdatePosition = function(){
	this.glow.x = this.sprite.x;
	this.glow.y = this.sprite.y;
	this.glow.scale.setTo(this.sprite.scale.x, this.sprite.scale.y);
	this.glow.angle = this.sprite.angle;
};
