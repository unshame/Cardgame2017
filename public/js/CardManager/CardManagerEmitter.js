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
CardManager.prototype.emitterStart = function(minSpeed, maxSpeed, sway, interval, rotation, gravity){

	this.emitterStop();

	if(minSpeed === undefined)
		minSpeed = this.emitter.minParticleSpeed.y;
	if(maxSpeed === undefined)
		maxSpeed = this.emitter.maxParticleSpeed.y;
	if(sway === undefined)
		sway = this.emitter.sway;
	else
		this.emitter.sway = sway;
	if(rotation === undefined)
		rotation = this.emitter.maxRotation;
	if(gravity !== undefined)
		this.emitter.gravity = gravity;
	if(interval === undefined)
		interval = this.emitter.interval;

	this.emitter.minParticleSpeed = {x: -sway * game.speed, y: minSpeed * game.speed};
	this.emitter.maxParticleSpeed = {x: sway * game.speed, y: maxSpeed * game.speed};
	this.emitter.minRotation = -rotation;
	this.emitter.maxRotation = rotation;
	this.emitter.x = game.world.centerX;
	this.emitter.width = game.screenWidth;
	function solveQuadEq(a, b, c) {
		return Math.abs((-1 * b + Math.sqrt(Math.pow(b, 2) - (4 * a * c))) / (2 * a));
	}
	
	var lifespan = solveQuadEq(this.emitter.gravity / 2, minSpeed * game.speed, - (game.screenHeight + skinManager.skin.height * 2)) * 1000;
	if(interval === false)
		interval = lifespan/this.emitter.maxParticles;
	this.emitter.interval = interval;
	this.emitter.start(false, lifespan, interval, undefined, undefined);

	game.world.setChildIndex(this.emitter, game.world.children.length - 3);
};

/**
 * Останавливает эмиттер карт.
 */
CardManager.prototype.emitterStop = function(){
	if(this.emitter.on){
		this.emitter.on = false;
	}
	this.emitter.forEachAlive(function(p){
		if(p.visible){
			var tween = game.add.tween(p);
			tween.to({alpha: 0}, this.particleFadeTime);
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
CardManager.prototype.emitterRestart = function(){
	if(!this.emitter.on)
		return;
	this.emitterStop();
	this.emitter.on = true;
};