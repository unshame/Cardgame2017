/*
* Конструктор карт
*/

var debugSpotValidity = true;

Card = function (options) {

	//Options
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

	//Id
	this.id = this.options.id;

	//Sprite
	this.sprite = game.add.sprite(0, 0, 'cardsModern');
	this.sprite.inputEnabled = true;
	this.sprite.events.onInputDown.add(this.mouseDown, this);
	this.sprite.events.onInputUp.add(this.mouseUp, this);
	this.sprite.anchor.set(0.5, 0.5);

	//Классический скин карт
	//this.sprite = game.add.sprite(x, y, 'cardsClassic');
	//this.sprite.scale.setTo(0.5, 0.5);	

	//Glow
	this.glow = game.add.sprite(0, 0, 'glow');
	this.glow.anchor.set(0.5, 0.5);
	this.glow.tint = 0xFFFF0A;
	this.glowDelayRange = 500;
	this.glow.visible = false;

	this.glowOff = game.add.tween(this.glow);
	this.glowOff.to({alpha: 0.25}, 1500, Phaser.Easing.Linear.None, false, Math.floor(Math.random()*this.glowDelayRange));

	this.glowOn = game.add.tween(this.glow);
	this.glowOn.to({alpha: 0.75}, 1500, Phaser.Easing.Linear.None, false, Math.floor(Math.random()*this.glowDelayRange));

	this.glowOn.onComplete.add(function(){
		if(this.glow.visible)
			this.glowOff.start();
	},this)
	this.glowOff.onComplete.add(function(){
		if(this.glow.visible)
			this.glowOn.start();
	},this)

	//Base
	this.base = game.add.group();
	this.base.add(this.glow);
	this.base.add(this.sprite);
	cardsGroup.add(this.base);  

	//Value
	this.setValue(this.options.suit, this.options.value);
};

Card.prototype.setValue = function(suit, value){
	if(suit === null || suit === undefined){
		this.sprite.frame =  55;		
		this.suit = null;
		this.value = 0;
		this.isPlayable = false;
		this.sprite.input.useHandCursor = false;
		if(this.glow.visible)
			this.glow.visible = false;
	}
	else{
		this.sprite.frame =  suit*13+value-2;
		this.suit = suit;
		this.value = value;
		this.isPlayable = true;
		this.sprite.input.useHandCursor = true;
		if(!this.glow.visible){
			this.glow.visible = true;
			this.glowOff.start();
		}
		cardsGroup.bringToTop(this.base);
		if(controller.card){
			cardsGroup.bringToTop(controller.card.base);
		}
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
