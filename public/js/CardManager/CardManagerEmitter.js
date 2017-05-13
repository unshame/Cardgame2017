//Party time
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

	this.emitter.minParticleSpeed = {x: -sway*game.speed, y: minSpeed*game.speed};
	this.emitter.maxParticleSpeed = {x: sway*game.speed, y: maxSpeed*game.speed};
	this.emitter.minRotation = -rotation;
	this.emitter.maxRotation = rotation;
	this.emitter.x = game.world.centerX;
	this.emitter.width = game.screenWidth;
	function solveQuadtraticEq(a, b, c) {
		return Math.abs((-1* b + Math.sqrt(Math.pow(b, 2) - (4* a* c))) / (2* a));
	}
	
	var lifespan = solveQuadtraticEq(this.emitter.gravity/2, minSpeed, -(game.screenHeight + skinManager.skin.height*2))*1000;
	if(interval === false)
		interval = lifespan/this.emitter.maxParticles;
	this.emitter.interval = interval;
	this.emitter.start(false, lifespan, interval, undefined, undefined);

	game.world.setChildIndex(this.emitter, game.world.children.length - 3);
};

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

CardManager.prototype.emitterRestart = function(){
	if(!this.emitter.on)
		return;
	this.emitterStop();
	this.emitter.on = true;
};