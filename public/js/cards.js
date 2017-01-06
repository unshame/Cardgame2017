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

    this.setValue(this.options.suit, this.options.value);

    //this.style = { font: "16px Arial", fill: "#fff", wordWrap: true, wordWrapWidth: this.sprite.width, align: "center" };
    //this.text = game.add.text(0, 0, this.options.suit !== null && this.options.suit !== undefined && (cardValueToString(this.options.value, 'RU') + ' ' + getSuitStrings('RU')[this.options.suit]) || '??', this.style);
    //this.text.anchor.set(0.5);



    //this.sprite = game.add.sprite(x, y, 'cardsClassic');
    //this.sprite.frame = Math.floor(Math.random()*52)
    //this.sprite.scale.setTo(0.5, 0.5);

    this.sprite.anchor.set(0.5, 0.5);

    this.id = this.options.id;



    this.emitter = game.add.emitter(this.sprite.centerX, this.sprite.centerY, 200);
    this.emitter.minParticleSpeed.x = 0;
    this.emitter.minParticleSpeed.y = 0;
    this.emitter.maxParticleSpeed.x = 0;
    this.emitter.maxParticleSpeed.y = 100;
    this.emitter.gravity = -100;

    this.emitter.makeParticles('particle');

    this.emitter.width = this.sprite.width;
    this.emitter.height = this.sprite.height;

    this.bundle = game.add.group();
    this.bundle.add(this.emitter);
    this.bundle.add(this.sprite);
    cardsGroup.add(this.bundle);  
    cardsGroup.align(Math.floor(screenWidth / this.sprite.width), -1, this.sprite.width, this.sprite.height);
    cardsGroup.bringToTop(this.bundle);
    this.emitter.start(false, 1000, 1);
    if(!this.options.suit && this.options.suit != 0)
        this.emitter.on = false;
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
    this.emitter.on = false;
    this.sprite.kill();  

}

Card.prototype.update = function() {
    this.emitter.position.x = this.sprite.centerX;
    this.emitter.position.y = this.sprite.centerY;
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
