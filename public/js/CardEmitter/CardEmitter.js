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

	Phaser.Particles.Arcade.Emitter.call(this, game, game.world.centerX, -skinManager.skin.height, 100);
	this.name = 'partyEmitter';
	var frames = [];
	for(var i = 0; i < 52; i++){
		frames.push(i);
	}
	this.makeParticles(skinManager.skin.sheetName, frames);

	this._start = Phaser.Particles.Arcade.Emitter.prototype.start.bind(this);
};

CardEmitter.prototype = Object.create(Phaser.Particles.Arcade.Emitter.prototype);
CardEmitter.prototype.constructor = CardEmitter;

/**
* Запускает эмиттер карт. Предварительно останавливает эмиттер, если он уже запущен.  
* Не указанные параметры остаются с предыдущего запуска.
* @param  {number} [minSpeed] минимальная вертикальная скорость партиклей
* @param  {number} [maxSpeed] максимальная вертикальная скорость партиклей
* @param  {number} [sway]     максимальная скорость по горизонтали
* @param  {(number|boolean)} [interval] Интервал между спавном партиклей.
* `false` рассчитывает интервал на основе времени жизни и максимального кол-ва партиклей.
* @param  {number} [rotation] максимальная скорость поворота партиклей
* @param  {number} [gravity]  вертикальное ускорение партиклей
*/
CardEmitter.prototype.start = function(minSpeed, maxSpeed, sway, interval, rotation, gravity){

	this.stop();

	if(minSpeed === undefined)
		minSpeed = this.minParticleSpeed.y;
	if(maxSpeed === undefined)
		maxSpeed = this.maxParticleSpeed.y;
	if(sway === undefined)
		sway = this.sway;
	else
		this.sway = sway;
	if(rotation === undefined)
		rotation = this.maxRotation;
	if(gravity !== undefined)
		this.gravity = gravity;
	if(interval === undefined)
		interval = this.interval;

	this.minParticleSpeed = {x: -sway * game.speed, y: minSpeed * game.speed};
	this.maxParticleSpeed = {x: sway * game.speed, y: maxSpeed * game.speed};
	this.minRotation = -rotation;
	this.maxRotation = rotation;
	this.x = game.world.centerX;
	this.width = game.screenWidth;
	function solveQuadEq(a, b, c) {
		return Math.abs((-1 * b + Math.sqrt(Math.pow(b, 2) - (4 * a * c))) / (2 * a));
	}
	
	var lifespan = solveQuadEq(this.gravity / 2, minSpeed * game.speed, - (game.screenHeight + skinManager.skin.height * 2)) * 1000;
	if(interval === false)
		interval = lifespan/this.maxParticles;
	this.interval = interval;
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
* Перезапускает эмиттер карт с текущими настройками.
*/
CardEmitter.prototype.restart = function(){
	if(!this.on)
		return;
	this.stop();
	this.on = true;
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
