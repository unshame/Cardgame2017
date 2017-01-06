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

    //Alive status
    this.alive = true;



    //Sprites
    this.sprite = game.add.sprite(0, 0, 'cardsModern');

    this.sprite.inputEnabled = true;
    this.sprite.input.enableDrag();

    this.setValue(this.options.suit, this.options.value);

    //this.style = { font: "16px Arial", fill: "#fff", wordWrap: true, wordWrapWidth: this.sprite.width, align: "center" };
    //this.text = game.add.text(0, 0, this.options.suit !== null && this.options.suit !== undefined && (cardValueToString(this.options.value, 'RU') + ' ' + getSuitStrings('RU')[this.options.suit]) || '??', this.style);
    //this.text.anchor.set(0.5);



    //this.sprite = game.add.sprite(x, y, 'cardsClassic');
    //this.sprite.frame = Math.floor(Math.random()*52)
    //this.sprite.scale.setTo(0.5, 0.5);

    this.sprite.anchor.set(0.5, 0.5);

    this.id = this.options.id;

    cardsGroup.add(this.sprite);  
    game.world.bringToTop(cardsGroup)
    game.world.bringToTop(this.sprite);
    cardsGroup.align(Math.floor(screenWidth / this.sprite.width), -1, this.sprite.width, this.sprite.height);

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

Card.prototype.kill = function() {
    //console.log('killed')
    this.alive = false;
    this.sprite.kill();        
}

Card.prototype.update = function() {
};