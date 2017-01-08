var debugSpotValidity = true;

Card = function (options) {
	this.options = {
		id:null,
		game:game,
		value:0,
		suit:null
	};
	for(o in options){
		if(options.hasOwnProperty(o))
			this.options[o] = options[o];
	}

	this.suit = this.options.suit;
	this.value = this.options.value;

	this.clickState = 'PUT_DOWN'

	//Sprites
	this.sprite = game.add.sprite(0, 0, 'cardsModern');

	this.sprite.inputEnabled = true;
	this.sprite.input.enableDrag(false);
	this.sprite.events.onInputDown.add(this.mouseDown, this);
	this.sprite.events.onInputUp.add(this.mouseUp, this);
	this.sprite.events.onDragStart.add(this.dragStart, this);
	this.sprite.events.onDragStop.add(this.dragStop, this);
	this.sprite.anchor.set(0.5, 0.5);

	this.glow = game.add.sprite(0, 0, 'glow');
	this.glow.anchor.set(0.5, 0.5);
	//this.glow.tint = Math.random() * 0xffffff;
	this.glow.tint = 0xFFFF0A;

	this.glowOff = game.add.tween(this.glow);
	this.glowOff.to({alpha: 0.25}, 1500, Phaser.Easing.Linear.None);

	this.glowOn = game.add.tween(this.glow);
	this.glowOn.to({alpha: 0.75}, 1500, Phaser.Easing.Linear.None);

	this.glowOn.onComplete.add(() => {
		if(this.glow.visible)
			this.glowOff.start();
	},this)
	this.glowOff.onComplete.add(() => {
		if(this.glow.visible)
			this.glowOn.start();
	},this)

	this.trail = game.add.emitter(this.sprite.centerX, this.sprite.centerY);
	this.trail.maxParticles = 30;
	this.trail.gravity = 0;
	this.trail.lifespan = 600;
	this.trail.minParticleSpeed.setTo(-this.sprite.width, -this.sprite.height);
	this.trail.maxParticleSpeed.setTo(this.sprite.width, this.sprite.height);

	this.setValue(this.suit, this.value);

	//this.sprite = game.add.sprite(x, y, 'cardsClassic');
	//this.sprite.frame = Math.floor(Math.random()*52)
	//this.sprite.scale.setTo(0.5, 0.5);	

	this.id = this.options.id;

	this.base = game.add.group();
	this.base.add(this.trail);
	this.base.add(this.glow);
	this.base.add(this.sprite);
	cardsGroup.add(this.base);  
	cardsGroup.bringToTop(this.base);

	if(this.suit || this.suit === 0)
		this.glowOff.start()
	else
		this.glow.visible = false;	
};

Card.prototype.setValue = function(suit, value){
	if(suit === null || suit === undefined){
		this.sprite.frame =  55;
		this.trail.makeParticles('suits', [1,2,3,4]);
		this.suit = null;
		this.value = 0;
	}
	else{
		this.sprite.frame =  suit*13+value-2;
		this.trail.makeParticles('suits', suit);
		this.suit = suit;
		this.value = value;
	}
}

Card.prototype.setPosition = function(x, y){
	this.sprite.x = x - this.base.x;
	this.sprite.y = y - this.base.y;
}

Card.prototype.setRelativePosition = function(x, y){
	this.sprite.x = x;
	this.sprite.y = y;
}

Card.prototype.setBase = function(x, y){
	this.trail.position.x -= x - this.base.x; 
	this.trail.position.y -= y - this.base.y; 
	this.base.x = x;
	this.base.y = y;
}

Card.prototype.mouseDown = function(){
	if(this.clickState != 'PICKED_UP'){
		this.clickState = this.clickedInbound() ? 'CLICKED' : 'PUT_DOWN';
	}
}

Card.prototype.mouseUp = function(){
	if(this.clickState == 'PICKED_UP'){
		this.clickState = 'PUT_DOWN';
		this.dragStop();
	}
	else if(this.clickState == 'CLICKED'){
		
		if(this.clickedInbound()){
			if(this.returner){
				this.returner.stop();
				this.returner = null;
			}
			this.shiftPosition = new Phaser.Point(
				game.input.activePointer.x - this.base.x - this.sprite.x,
				game.input.activePointer.y - this.base.y - this.sprite.y
			);
			this.resetTrail();
			this.shiftDuration = 100;
			this.shiftTime = new Date().getTime() + this.shiftDuration;
			cardsGroup.bringToTop(this.base);
			this.clickState = 'PICKED_UP';
		}
		else{
			this.clickState = 'PUT_DOWN';
		}
	}
}

Card.prototype.dragStart = function(){

	if(this.clickState == 'PICKED_UP')
		return;

	this.dragState = 'DRAGGED';

	this.resetTrail();

	if(this.returner){
		this.returner.stop();
		this.returner = null;
	}

	cardsGroup.bringToTop(this.base);
}

Card.prototype.dragStop = function(){

	if(this.clickState == 'PICKED_UP')
		return;

	this.dragState = 'RESTED';

	if(this.validSpot()){
		this.setBase(this.base.x + this.sprite.x, this.base.y + this.sprite.y);
		this.setRelativePosition(0, 0)
	}
	else{
		this.isReturning = true;

		if(this.returner){
			this.returner.stop();
			this.returner = null;
		}

		this.returner = game.add.tween(this.sprite);
		var dest = new Phaser.Point(0, 0);

		this.returner.to(dest, 200, Phaser.Easing.Quadratic.Out);
		this.returner.onComplete.addOnce(() => {
			this.isReturning = false;
		}, this);

		this.returner.start();
	}
}

Card.prototype.clickedInbound = function(){
	var cond = 
		game.input.activePointer.button == Phaser.Mouse.LEFT_BUTTON &&
		game.input.activePointer.x >= this.base.x - this.base.width / 2 &&
		game.input.activePointer.x <= this.base.x + this.base.width / 2 &&
		game.input.activePointer.y >= this.base.y - this.base.height / 2 &&
		game.input.activePointer.y <= this.base.y + this.base.height / 2
	return cond
}

Card.prototype.validSpot = function(){
	return debugSpotValidity;
}

Card.prototype.spawnTrail = function(){
	var curTime = new Date().getTime();
	if(this.lastParticleTime && curTime - this.lastParticleTime < 20)
		return;

	this.lastParticleTime = curTime;

	var distance = this.sprite.position.distance(new Phaser.Point(this.trail.emitX, this.trail.emitY), true);
	if(distance < 2){
		this.trail.width = this.sprite.width - 35;
		this.trail.height = this.sprite.height - 35;
	}
	else{
		this.trail.width = this.trail.height = 0;
	}
	this.trail.emitX = this.sprite.x;
	this.trail.emitY = this.sprite.y;
	this.trail.emitParticle();
	this.trail.forEachAlive((p) => {
		p.alpha = p.lifespan / this.trail.lifespan * 0.6;
	})
}

Card.prototype.resetTrail = function(){
	this.trail.forEachAlive((p) => {
		p.alpha = 0;
	})
	this.trail.position = {x: 0, y: 0};
}

Card.prototype.kill = function() {
	this.trail.on = false;
	this.trail.destroy();
	this.glow.kill();
	this.sprite.kill();  

}

Card.prototype.update = function() {
	if(this.clickState == 'PICKED_UP'){
		var sTime, sP, mP;
		sTime = this.shiftTime - new Date().getTime();
		if(sTime > 0){
			sP = new Phaser.Point(
				Math.round(this.shiftPosition.x / this.shiftDuration * sTime), 
				Math.round(this.shiftPosition.y / this.shiftDuration * sTime)
			);
		}
		else{
			sP = new Phaser.Point(0, 0);
		}
		mP = new Phaser.Point(game.input.activePointer.x - this.base.x, game.input.activePointer.y - this.base.y);
		this.setRelativePosition(mP.x - sP.x, mP.y - sP.y);
	}
	if(this.clickState == 'PICKED_UP' || this.dragState == 'DRAGGED' || this.isReturning){
		this.spawnTrail();
	}
	this.glow.x = this.sprite.x;
	this.glow.y = this.sprite.y;
};

//party time
var throwCards = function(){

	this.emitter = game.add.emitter(game.world.centerX, 200, 200);

	var frames = [];
	for(var i = 0; i < 52; i++){
		frames.push(i)
	}
	this.emitter.makeParticles('cardsModern', frames);

	this.emitter.start(false, 5000, 20);
	this.emitter.width = screenWidth;
	this.emitter.height = screenHeight;

	game.world.bringToTop(this.emitter)
}
throwCards.prototype.stop = function(){
	if(this.emitter.on){
		this.emitter.destroy();
	}
}
