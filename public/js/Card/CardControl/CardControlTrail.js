// ХВОСТ КАРТЫ

/**
* Смещает хвост относительно базы карты
* @param {number} x Смещение по оси x.
* @param {number} y Смещение по оси y.
*/
CardControl.prototype.trailShift = function(x, y){
	this.trail.position.x += x;
	this.trail.position.y += y;
};

/**
* Ресетит хвост карты
* @param  {boolean} soft делает партикли прозрачными, вместо того, чтобы убивать их
*/
CardControl.prototype.trailReset = function(soft){
	this._resetTrailResetTimer();
	this.trail.forEachAlive(function(p){
		if(soft)
			p.alpha = 0;
		else{
			p.kill();
		}
	}, this);
	this.trail.gravity = 0;
	this.trail.lifespan = 600;
	this.trail.alpha = 0.6;
	this.trail.interval = 20;	// Свойство используется модулем, а не движком
	this.trail.maxParticles = Math.ceil(this.trail.lifespan / this.trail.interval);
	this.trail.position = {x: 0, y: 0};
	this.trailDefaultBase.add(this.trail);
};

/** Применяет скин к партиклям хвоста. */
CardControl.prototype.trailApplySkin = function(){
	this.trail.forEach(function(p){
		p.loadTexture(skinManager.skin.trailName);
	}, this);
};

/**
* Создает хвост карты при движении.
* @private
*/
CardControl.prototype._trailSpawnParticle = function(){

	var	delta = Date.now() - this.lastParticleTime;
	if(this.lastParticleTime && delta < this.trail.interval)
		return;

	// Прибавляем интервал к последнему моменту спавна, чтобы кол-во партиклей соответствовало прошедшему времени
	// Для оптимизации ограничиваем разницу во времени
	if(delta > this.trail.interval*10)
		this.lastParticleTime += this.trail.interval*10;
	else
		this.lastParticleTime += this.trail.interval;

	var distance = this.card.sprite.position.distance({
		x: this.trail.emitX + this.trail.position.x, 
		y: this.trail.emitY + this.trail.position.y
	}, true);
	if(distance < this.cardMoveThreshold){
		this.trail.width = skinManager.skin.width - 35;
		this.trail.height = skinManager.skin.height - 35;
	}
	else{
		this.trail.width = this.trail.height = 0;
	}
	this.trail.emitX = this.card.sprite.x - this.trail.position.x;
	this.trail.emitY = this.card.sprite.y - this.trail.position.y;
	this.trail.emitParticle();
};

/**
* Обновление хвоста карты.
* @private
*/
CardControl.prototype._updateTrail = function(){
	if(this.trail.countLiving() && this.trail.parent != this.trailDefaultBase){
		
		this.trail.forEachAlive(function(p){
			p.alpha = p.lifespan / this.trail.lifespan;
		}, this);
	}
	if(this._trailShouldReappend && !this.trailResetTimer && this.card){
		this._trailReappend();
		this._trailShouldReappend = false;
	}
};

/**
* Прикрепляет хвост к текущей карте.
* @private
*/
CardControl.prototype._trailReappend = function(){
	this.card.addAt(this.trail, 0);
	this.trail._frames = this.card.suit;
	this.trail.minParticleSpeed.setTo(-skinManager.skin.width, -skinManager.skin.height);
	this.trail.maxParticleSpeed.setTo(skinManager.skin.width, skinManager.skin.height);
	this.lastParticleTime = Date.now();
};

// ТАЙМЕР РЕСЕТА ХВОСТА

/**
* Устанавливает таймер ресета хвоста.
* @private
*/
CardControl.prototype._setTrailResetTimer = function(){
	this._resetTrailResetTimer();
	this.trailResetTimer = setTimeout(this.trailReset.bind(this), this.trail.lifespan);
};

/**
* Ресетит таймер ресета хвоста.
* @private
*/
CardControl.prototype._resetTrailResetTimer = function(){
	if(this.trailResetTimer){
		clearTimeout(this.trailResetTimer);
		this.trailResetTimer = null;
	}
};

