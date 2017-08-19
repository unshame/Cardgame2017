// ДЕБАГ

// Рисует дебаг хвоста
CardControl.prototype.updateDebug = function(){
	if(!this.inDebugMode){
		return;
	}

	// База хвоста
	if(!this.debugBase){
		this.debugBase = new Phaser.Rectangle() ;
	}
	var width = this.card && skinManager.skin.width || this.debugBase.width || 0;
	var height = this.card && skinManager.skin.height || this.debugBase.height || 0;
	var x = this.trail.parent.x;
	var y = this.trail.parent.y;
	this.debugBase.x = x - width/2;
	this.debugBase.y = y - height/2;
	this.debugBase.width = width;
	this.debugBase.height = height;
	game.debug.geom( this.debugBase, 'rgba(255,0,0,0.6)' ) ;

	// Визуализация максимальной скорости хвоста
	if(!this.debugSpeed){
		this.debugSpeed = new Phaser.Circle();
	}
	width = this.trail.width || 5;
	height = this.trail.height || 5;
	var diameter = game.math.distance(
		0,
		0,
		this.trail.maxParticleSpeed.x,
		this.trail.maxParticleSpeed.y
	) ;
	this.debugSpeed.x = this.trail.parent.x + this.trail.position.x + this.trail.emitX;
	this.debugSpeed.y = this.trail.parent.y + this.trail.position.y + this.trail.emitY;
	this.debugSpeed.diameter = diameter + (width + height)/2;
	game.debug.geom( this.debugSpeed, 'rgba(255,255,0,0.2)' ) ;

	// Позиция спавна последнего партикля хвоста
	if(!this.debugSpawn){
		this.debugSpawn = new Phaser.Rectangle() ;
	}
	this.debugSpawn.x = this.trail.parent.x + this.trail.position.x + this.trail.emitX - width/2;
	this.debugSpawn.y = this.trail.parent.y + this.trail.position.y + this.trail.emitY - height/2;
	this.debugSpawn.width = width;
	this.debugSpawn.height = height;
	game.debug.geom( this.debugSpawn, 'rgba(0,0,255,0.3)' ) ;

	if(this.pointer){
		game.debug.pointer(this.pointer);
	}
};

// Переключает дебаг
CardControl.prototype.toggleDebugMode = function(){
	this.inDebugMode = !this.inDebugMode;
	options.set('debug_control', this.inDebugMode);
	options.save();
	if(!this.inDebugMode){
		console.log('Card control: Debug mode OFF');
		game.debug.reset();
	}
	else{
		console.log('Card control: Debug mode ON');
	}
};
