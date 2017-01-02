
var character,
    headSprite;

Character = function (options) {
    this.options = {
        id:null,
        game:game
    };
    for(o in options)
        this.options[o] = options[o];
    
    this.input = {};

    //Alive status
    this.alive = true;

    var x = Math.round(Math.random()*screenWidth);
    var y = Math.round(Math.random()*screenHeight);

    //Sprites

    this.headSprite = game.add.sprite(x, y, 'cardback');
    this.headSprite.animations.add('move');
    this.headSprite.anchor.set(0.5, 0.5);

    //Applying player ID
    this.id = this.options.id;

    //Put players behind the HUD
    playersGroup.add(this.headSprite);  
    playersGroup.sendToBack(playersGroup)
    playersGroup.sendToBack(this.headSprite);

};

Character.prototype.kill = function() {
    //console.log('killed')
    this.alive = false;
    this.headSprite.kill();        
}

Character.prototype.update = function() {
};