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

    this.setValue(this.suit, this.value);

    //this.sprite = game.add.sprite(x, y, 'cardsClassic');
    //this.sprite.frame = Math.floor(Math.random()*52)
    //this.sprite.scale.setTo(0.5, 0.5);    

    this.id = this.options.id;

    this.bundle = game.add.group();
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
    if(suit === null || suit === undefined)
        this.sprite.frame =  65
    else
        this.sprite.frame =  suit*13+value-2;
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

    if(this.easeOut){
        this.easeOut.stop();
        this.easeOut = null;
    }

    cardsGroup.bringToTop(this.bundle);
    if(!this.isReturning){
        this.lastPosition = {
            x: this.sprite.x,
            y: this.sprite.y
        }
    }
}

Card.prototype.dragStop = function(){

    if(this.clickState == 'PICKED_UP')
        return;

    this.isReturning = true;

    if(this.easeOut){
        this.easeOut.stop();
        this.easeOut = null;
    }

    this.easeOut = game.add.tween(this.sprite);
    var dest = new Phaser.Point(this.lastPosition.x, this.lastPosition.y);

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
