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
    
    this.input = {};

    //Sprites
    this.sprite = game.add.sprite(0, 0, 'cardsModern');

    this.sprite.inputEnabled = true;
    this.sprite.input.enableDrag(false, true);
    this.sprite.events.onDragStart.add(this.dragStart, this);
    this.sprite.events.onDragStop.add(this.dragStop, this);
    this.sprite.anchor.set(0.5, 0.5);

    this.glow = game.add.sprite(0, 0, 'glow');
    this.glow.anchor.set(0.5, 0.5);
    this.glow.tint = Math.random() * 0xffffff;;

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

    this.setValue(this.options.suit, this.options.value);

    //this.sprite = game.add.sprite(x, y, 'cardsClassic');
    //this.sprite.frame = Math.floor(Math.random()*52)
    //this.sprite.scale.setTo(0.5, 0.5);

    

    this.id = this.options.id;

    this.bundle = game.add.group();
    this.bundle.add(this.glow);
    this.bundle.add(this.sprite);
    cardsGroup.add(this.bundle);  
    cardsGroup.align(Math.floor(screenWidth / (this.sprite.width + 20)), -1, this.sprite.width + 20, this.sprite.height + 20);
    cardsGroup.bringToTop(this.bundle);

    if(this.options.suit || this.options.suit === 0)
        this.glowOff.start()
    else
        this.glow.visible = false;
        
};

Card.prototype.setValue = function(suit, value){
    if(suit === null || suit === undefined)
        this.sprite.frame =  65
    else
        this.sprite.frame =  suit*14-suit+value-2;
}

Card.prototype.setPosition = function(x, y){
    this.sprite.x = x;
    this.sprite.y = y;
}

Card.prototype.dragStart = function(p,x,y){
    cardsGroup.bringToTop(this.bundle);
    this.lastPosition = {
        x: this.sprite.x,
        y: this.sprite.y
    };
}

Card.prototype.dragStop = function(){
    var easeOut = game.add.tween(this.sprite);
    var dest = new Phaser.Point(this.lastPosition.x, this.lastPosition.y);
    easeOut.to(dest, 200, Phaser.Easing.Quadratic.Out);
    this.sprite.inputEnabled = false;
    easeOut.onComplete.addOnce(() => {this.sprite.inputEnabled = true}, this);
    easeOut.start();
}

Card.prototype.kill = function() {
    this.glow.kill();
    this.sprite.kill();  

}

Card.prototype.update = function() {
    this.glow.x = this.sprite.x ;
    this.glow.y = this.sprite.y ;
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
    this.emitter.width = screenWidth
    this.emitter.height = screenHeight

    game.world.bringToTop(this.emitter)
}
throwCards.prototype.stop = function(){
    if(this.emitter.on){
        this.emitter.destroy();
    }
}
