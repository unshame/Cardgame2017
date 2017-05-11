//СВЕЧЕНИЕ

/**
* Запускает свечение.
* @param  {number} minGlow    минимальная прозрачность свечения
* @param  {number} maxGlow    максимальная прозрачность свечения
* @param  {number} speed      время анимации между minGlow и maxGlow
* @param  {number} [delayRange=0] максимальное значение задержки начала свечения
* @param  {number} [color=ui.colors.white]     цвет свечения
* @private
*/
Card.prototype._glowStart = function(minGlow, maxGlow, speed, delayRange, color){
	
	this._glowReset();

	this.glow.tint = color || ui.colors.white;

	if(game.paused)
		return;

	this.glowDecreaser = game.add.tween(this.glow);
	this.glowDecreaser.to(
		{alpha: minGlow}, 
		speed/game.speed, 
		Phaser.Easing.Linear.None, 
		false, 
		Math.floor(Math.random()*(delayRange/game.speed || 0))
	);

	this.glowIncreaser = game.add.tween(this.glow);
	this.glowIncreaser.to(
		{alpha: maxGlow},
		speed/game.speed, 
		Phaser.Easing.Linear.None, 
		false, 
		Math.floor(Math.random()*(delayRange/game.speed || 0))
	);

	this.glowIncreaser.onComplete.add(function(){
		if(this.glow.visible && this.glowDecreaser)
			this.glowDecreaser.start();
	},this);
	this.glowDecreaser.onComplete.add(function(){
		if(this.glow.visible && this.glowIncreaser)
			this.glowIncreaser.start();
	},this);
	this.glowDecreaser.start();
};

/**
* Останавливает свечение.
* @private
*/
Card.prototype._glowStop = function(){
	if(this.glowIncreaser){
		this.glowIncreaser.stop();
		this.glowIncreaser = null;
	}
	if(this.glowDecreaser){
		this.glowDecreaser.stop();
		this.glowDecreaser = null;
	}
	if(this.glow.visible){
		this.glow.kill();
	}
};

/**
* Останавливает и восстанавливает свечение.
* @private
*/
Card.prototype._glowReset = function(){
	this._glowStop();
	this.glow.reset();
	this._glowUpdatePosition();
};

/**
* Обновляет позицию свечения.
* @private
*/
Card.prototype._glowUpdatePosition = function(){
	this.glow.x = this.sprite.x;
	this.glow.y = this.sprite.y;
	this.glow.scale.setTo(this.sprite.scale.x, this.sprite.scale.y);
	this.glow.angle = this.sprite.angle;
};
