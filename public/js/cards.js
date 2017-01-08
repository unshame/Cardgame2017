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

	this.moveEmitter = game.add.emitter(this.sprite.centerX, this.sprite.centerY);
	this.moveEmitter.maxParticles = 30;
	this.moveEmitter.gravity = 0;
	this.moveEmitter.lifespan = 600;
	this.moveEmitter.minParticleSpeed.setTo(-this.sprite.width, -this.sprite.height);
	this.moveEmitter.maxParticleSpeed.setTo(this.sprite.width, this.sprite.height);

	this.setValue(this.suit, this.value);

	//this.sprite = game.add.sprite(x, y, 'cardsClassic');
	//this.sprite.frame = Math.floor(Math.random()*52)
	//this.sprite.scale.setTo(0.5, 0.5);	

	this.id = this.options.id;

	this.bundle = game.add.group();
	this.bundle.add(this.moveEmitter);
	this.bundle.add(this.glow);
	this.bundle.add(this.sprite);
	cardsGroup.add(this.bundle);  
	cardsGroup.bringToTop(this.bundle);

	if(this.suit || this.suit === 0)
		this.glowOff.start()
	else
		this.glow.visible = false;	
};

Card.prototype.setValue = function(suit, value){
	if(suit === null || suit === undefined){
		this.sprite.frame =  55;
		this.moveEmitter.makeParticles('suits', [1,2,3,4]);
		this.suit = null;
		this.value = 0;
	}
	else{
		this.sprite.frame =  suit*13+value-2;
		this.moveEmitter.makeParticles('suits', suit);
		this.suit = suit;
		this.value = value;
	}
}

Card.prototype.setPosition = function(x, y){
	this.sprite.x = x - this.bundle.x;
	this.sprite.y = y - this.bundle.y;
}

Card.prototype.setRelativePosition = function(x, y){
	this.sprite.x = x;
	this.sprite.y = y;
}

Card.prototype.setBase = function(x, y){
	this.bundle.x = x;
	this.bundle.y = y;
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
			if(this.easeOut){
				this.easeOut.stop();
				this.easeOut = null;
			}
			this.shiftPosition = new Phaser.Point(
				game.input.activePointer.x - this.bundle.x - this.sprite.x,
				game.input.activePointer.y - this.bundle.y - this.sprite.y
			);
			this.shiftDuration = 100;
			this.shiftTime = new Date().getTime() + this.shiftDuration;
			cardsGroup.bringToTop(this.bundle);
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

	if(this.easeOut){
		this.easeOut.stop();
		this.easeOut = null;
	}

	cardsGroup.bringToTop(this.bundle);
}

Card.prototype.dragStop = function(){

	if(this.clickState == 'PICKED_UP')
		return;

	this.dragState = 'RESTED';

	this.isReturning = true;

	if(this.easeOut){
		this.easeOut.stop();
		this.easeOut = null;
	}

	this.easeOut = game.add.tween(this.sprite);
	var dest = new Phaser.Point(0, 0);

	this.easeOut.to(dest, 200, Phaser.Easing.Quadratic.Out);
	this.easeOut.onComplete.addOnce(() => {
		this.isReturning = false;
	}, this);

	this.easeOut.start();
}

Card.prototype.clickedInbound = function(){
	var cond = 
		game.input.activePointer.button == Phaser.Mouse.LEFT_BUTTON &&
		game.input.activePointer.x >= this.bundle.x - this.bundle.width / 2 &&
		game.input.activePointer.x <= this.bundle.x + this.bundle.width / 2 &&
		game.input.activePointer.y >= this.bundle.y - this.bundle.height / 2 &&
		game.input.activePointer.y <= this.bundle.y + this.bundle.height / 2
	return cond
}

Card.prototype.spawnTrail = function(){
	var curTime = new Date().getTime();
	if(this.lastParticleTime && curTime - this.lastParticleTime < 20)
		return;

	this.lastParticleTime = curTime;

	var distance = this.sprite.position.distance(new Phaser.Point(this.moveEmitter.emitX, this.moveEmitter.emitY), true);
	if(distance < 2){
		this.moveEmitter.width = this.sprite.width - 35;
		this.moveEmitter.height = this.sprite.height - 35;
	}
	else{
		this.moveEmitter.width = this.moveEmitter.height = 0;
	}
	this.moveEmitter.emitX = this.sprite.x;
	this.moveEmitter.emitY = this.sprite.y;
	this.moveEmitter.emitParticle();
	this.moveEmitter.forEachAlive((p) => {
		p.alpha = p.lifespan / this.moveEmitter.lifespan * 0.6;
	})
}

Card.prototype.kill = function() {
	this.moveEmitter.on = false;
	this.moveEmitter.destroy();
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
		mP = new Phaser.Point(game.input.activePointer.x - this.bundle.x, game.input.activePointer.y - this.bundle.y);
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
