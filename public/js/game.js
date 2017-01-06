var cardsGroup;
var cards = {};
var screenWidth = window.innerWidth;
var screenHeight = window.innerHeight;
var game = new Phaser.Game(
	screenWidth, 
	screenHeight, 
    //!Phaser.Device.Desktop ? Phaser.CANVAS : Phaser.WEBGL, 
	Phaser.WEBGL, 
	'phaser-example', 
	{ preload: preload, create: EurecaClientSetup, update: update, render: render }
);

var onScreenChange = function() {
	
}
window.addEventListener("resize",onScreenChange);
window.addEventListener("orientationchange",onScreenChange);



function handleInput(player)
{

}

function create () 
{
    game.world.setBounds(0, 
                         0, 
                         screenWidth, 
                         screenHeight);
    game.stage.disableVisibilityChange  = true;
    
    //Ground
    land = game.add.tileSprite(0, 0, screenWidth, screenHeight, 'table8x');
    land.fixedToCamera = true;

    //Players will go here
    cardsGroup = game.add.group();

    if(game.renderType!=2){
	    game.scale.pageAlignHorizontally = true;
	    game.scale.pageAlignVertically = true;
	    game.scale.setScreenSize(true);
    } 

    //Camera
    //game.camera.follow(baseSprite);
}


function update () {
    /*for(var ci in cards){
        if(!cards.hasOwnProperty(ci))
            continue;

        var c = cards[ci];
        c.text.x = Math.floor(c.sprite.x);
        c.text.y = Math.floor(c.sprite.y - c.sprite.height / 2 - 20);
    }*/
}

function render () {
}