//ХВОСТ КАРТЫ

//Смещает хвост относительно базы карты
CardControl.prototype.trailShift = function(x, y){
	this.trail.position.x += x;
	this.trail.position.y += y;
};

//Ресетит хвост карты
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
	this.trail.interval = 20;	//Свойство используется модулем, а не движком
	this.trail.maxParticles = Math.ceil(this.trail.lifespan / this.trail.interval);
	this.trail.position = {x: 0, y: 0};
	this.trailDefaultBase.add(this.trail);
};

//Применяет скин к партиклям хвоста
CardControl.prototype.trailApplySkin = function(){
	this.trail.forEach(function(p){
		p.loadTexture(skinManager.skin.trailName);
	}, this);
};

//Создает хвост карты при движении
CardControl.prototype._trailSpawnParticle = function(curTime){

	var	delta = curTime - this.lastParticleTime;
	if(this.lastParticleTime && delta < this.trail.interval)
		return;

	//Прибавляем интервал к последнему моменту спавна, чтобы кол-во партиклей соответствовало прошедшему времени
	//Для оптимизации ограничиваем разницу во времени
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

//Обновление хвоста карты
CardControl.prototype._updateTrail = function(){
	if(this.trail.countLiving() && this.trail.parent != this.trailDefaultBase){
		
		this.trail.forEachAlive(function(p){
			p.alpha = p.lifespan / this.trail.lifespan;
		}, this);
	}
	if(this.trialShouldReappend && !this.trailResetTimer && this.card){
		this.trialReappend();
		this.trialShouldReappend = false;
	}
};

CardControl.prototype.trialReappend = function(){
	this.card.base.addAt(this.trail, 0);
	this.trail._frames = this.card.suit;
	this.trail.minParticleSpeed.setTo(-skinManager.skin.width, -skinManager.skin.height);
	this.trail.maxParticleSpeed.setTo(skinManager.skin.width, skinManager.skin.height);
	this.lastParticleTime = game.time.time;
};

//ТАЙМЕР РЕСЕТА ХВОСТА

CardControl.prototype._setTrailResetTimer = function(){
	this._resetTrailResetTimer();
	this.trailResetTimer = setTimeout(this.trailReset.bind(this), this.trail.lifespan);
};

CardControl.prototype._resetTrailResetTimer = function(){
	if(this.trailResetTimer){
		clearTimeout(this.trailResetTimer);
		this.trailResetTimer = null;
	}
};

