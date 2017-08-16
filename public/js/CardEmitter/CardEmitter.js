/**
* Эмиттер карт.
* @class
* @extends {Phaser.Particles.Arcade.Emitter}
*/
var CardEmitter = function(){

	/**
	* Время пропадания партиклей эмиттера, когда он остановлен.
	* @private
	* @type {Number}
	*/
	this.fadeTime = 500;

	/**
	* Смещение партиклей в сторону
	* @private
	* @type {Number}
	*/
	this.sway = 0;

	/**
	* Интервал спавна партиклей.
	* @private
	* @type {Number}
	*/
	this.interval = 0;

	/**
	* Интервал до того, как к нему были применены ограничения.
	* @type {Number}
	* @private
	*/
	this._preferedInterval = 0;

	/**
	* Скорость игры при последнем запуске эмиттера.
	* @type {number}
	* @private
	*/
	this._cachedGameSpeed = game.speed;

	/**
	* Максимальное количество частиц эмиттера.
	* Для применения максимума используется {@link CardEmitter#makeMaxParticles}
	* @type {Number}
	*/
	this.maxParticles = 50;

	Phaser.Particles.Arcade.Emitter.call(this, game, game.world.centerX, -skinManager.skin.height, this.maxParticles);
	this.name = 'cardEmitter';

	this.makeMaxParicles();
};

extend(CardEmitter, Phaser.Particles.Arcade.Emitter);

/**
* Приводит кол-во партиклей эмиттера к заданному значению, по необходимости удаляя и добавляя партикли.
* Перезапускает эмиттер.
* @param {number} [max=CardEmitter#maxParticles] во партиклей.
*/
CardEmitter.prototype.makeMaxParicles = function(max){
	if(typeof max != 'number' || isNaN(max)){
		max = this.maxParticles;
	}
	else{
		this.maxParticles = max;
	}

	var	current = this.children.length;
	if(max < current){
		if(this.on){
			setTimeout(this.removeBetween.bind(this, max, current - 1), this.fadeTime/game.speed);
		}
		else{
			this.removeBetween(max, current - 1);
		}
	}
	else if(max > current){
		var frames = [];
		for(var i = skinManager.skin.firstValueFrame; i < skinManager.skin.firstValueFrame + 52; i++){
			frames.push(i);
		}
		this.makeParticles(skinManager.skin.sheetName, frames, max - current);
	}

	this.restart();
};

CardEmitter.prototype._start = Phaser.Particles.Arcade.Emitter.prototype.start;

/**
* Запускает эмиттер карт. Предварительно останавливает эмиттер, если он уже запущен.  
* Не указанные параметры остаются с предыдущего запуска.
* @param {number}           [minSpeed] минимальная вертикальная скорость партиклей
* @param {number}           [maxSpeed] максимальная вертикальная скорость партиклей
* @param {number}           [sway]     максимальная скорость по горизонтали
* @param {(number|boolean)} [interval] Интервал между спавном партиклей.
*                                      `false` рассчитывает интервал на основе времени жизни и максимального кол-ва партиклей.
* @param {number}           [rotation] максимальная скорость поворота партиклей
* @param {number}           [gravity]  вертикальное ускорение партиклей
*/
CardEmitter.prototype.start = function(minSpeed, maxSpeed, sway, interval, rotation, gravity){

	this.stop();

	if(minSpeed === undefined){
		minSpeed = this.minParticleSpeed.y/this._cachedGameSpeed;
	}
	if(maxSpeed === undefined){
		maxSpeed = this.maxParticleSpeed.y/this._cachedGameSpeed;
	}
	if(sway === undefined){
		sway = this.sway;
	}
	else{
		this.sway = sway;
	}
	if(rotation === undefined){
		rotation = this.maxRotation;
	}
	if(gravity !== undefined){
		this.gravity = gravity * game.speed;
	}
	else{
		this.gravity = this.gravity / this._cachedGameSpeed * game.speed;
	}
	if(interval === undefined){
		interval = this._preferedInterval;
	}
	else{
		this._preferedInterval = interval;
	}

	this.minParticleSpeed = {x: -sway * game.speed, y: minSpeed * game.speed};
	this.maxParticleSpeed = {x: sway * game.speed, y: maxSpeed * game.speed};

	this.minRotation = -rotation;
	this.maxRotation = rotation;

	this.x = game.world.centerX;
	this.width = game.screenWidth;

	// Вычисляем длину жизни частиц из уравнения движения 
	// x(t) = x0 + vt + (at^2)/2
	// a/2 * t^2 + vt + x0 = 0
	function solveQuadEq(a, b, c) {
		return Math.abs((-1 * b + Math.sqrt(Math.pow(b, 2) - (4 * a * c))) / (2 * a));
	}	
	var lifespan = solveQuadEq(this.gravity / 2, minSpeed * game.speed, - (game.screenHeight + skinManager.skin.height * 2)) * 1000;

	// Ограничиваем минимальный интервал
	var minInterval = lifespan/this.maxParticles;
	if(interval === false || interval < minInterval){
		interval = minInterval;
	}
	this.interval = interval;
	this._cachedGameSpeed = game.speed;
	this._start(false, lifespan, interval, undefined, undefined);
};

/**
* Останавливает эмиттер карт.
*/
CardEmitter.prototype.stop = function(){
	if(!this.on)
		return;
	this.on = false;
	this.forEachAlive(function(p){
		if(p.visible){
			var tween = game.add.tween(p);
			tween.to({alpha: 0}, this.fadeTime/game.speed);
			tween.start();
			tween.onComplete.addOnce(function(){
				this.visible = false;
			}, p);
		}
	}, this);
};

/**
* Перезапускает эмиттер карт с текущими настройками если он запущен.
* @param  {boolean} [noFadeOut] отключает фейд существующих партиклей
*/
CardEmitter.prototype.restart = function(noFadeOut){
	if(this.on){
		if(noFadeOut){
			this.on = false;
		}
		this.start();
	}
};

/**
* Применяет скин к эмиттеру.
*/
CardEmitter.prototype.applySkin = function(){
	this.minParticleScale = this.maxParticleScale = skinManager.skin.scale;
	if(this.on){
		this.restart();
		setTimeout(this._applySkinToEmitter.bind(this), this.fadeTime/game.speed);
	}
	else{
		this._applySkinToEmitter(this);
	}
};

/** 
* Применяет скин к эмиттеру карт.
* @private
*/
CardEmitter.prototype._applySkinToEmitter = function(){
	this.forEach(function(p){
		p.loadTexture(skinManager.skin.sheetName);
	}, this);
};
