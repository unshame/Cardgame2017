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
	//this.sprite.input.enableDrag(false);
	this.sprite.events.onInputDown.add(this.mouseDown, this);
	this.sprite.events.onInputUp.add(this.mouseUp, this);
	//this.sprite.events.onDragStart.add(this.dragStart, this);
	//this.sprite.events.onDragStop.add(this.dragStop, this);
	this.sprite.anchor.set(0.5, 0.5);

	this.glow = game.add.sprite(0, 0, 'glow');
	this.glow.anchor.set(0.5, 0.5);
	//this.glow.tint = Math.random() * 0xffffff;
	this.glow.tint = 0xFFFF0A;

	this.glowOff = game.add.tween(this.glow);
	this.glowOff.to({alpha: 0.25}, 1500, Phaser.Easing.Linear.None);

	this.glowOn = game.add.tween(this.glow);
	this.glowOn.to({alpha: 0.75}, 1500, Phaser.Easing.Linear.None);

	this.glowOn.onComplete.add(function(){
		if(this.glow.visible)
			this.glowOff.start();
	},this)
	this.glowOff.onComplete.add(function(){
		if(this.glow.visible)
			this.glowOn.start();
	},this)

	this.setValue(this.suit, this.value);

	//this.sprite = game.add.sprite(x, y, 'cardsClassic');
	//this.sprite.frame = Math.floor(Math.random()*52)
	//this.sprite.scale.setTo(0.5, 0.5);	

	this.id = this.options.id;

	this.base = game.add.group();
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
		this.suit = null;
		this.value = 0;
	}
	else{
		this.sprite.frame =  suit*13+value-2;
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
	this.base.x = x;
	this.base.y = y;
}

Card.prototype.mouseDown = function(sprite, pointer){
	controller.cardClick(this, pointer);
}

Card.prototype.mouseUp = function(sprite, pointer){
	controller.cardUnclick(this, pointer);
}

Card.prototype.kill = function() {
	this.glow.kill();
	this.sprite.kill();  
}

Card.prototype.update = function() {

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
