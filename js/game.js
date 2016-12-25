var player, playersGroup;
var charactersList = {};
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
    land = game.add.tileSprite(0, 0, screenWidth, screenHeight, 'earth');
    land.fixedToCamera = true;

    //Players will go here
    playersGroup = game.add.group();

    //Creating local player
    var options = {
        id:myId,
        game:game
    }
    player = new Character(options);

    //Players list and shortcuts
    charactersList[myId] = player;
    headSprite = player.headSprite;

    if(game.renderType!=2){
	    game.scale.pageAlignHorizontally = true;
	    game.scale.pageAlignVertically = true;
	    game.scale.setScreenSize(true);
    } 

    //Camera
    //game.camera.follow(baseSprite);
}


function update () {
    //Don't update client if not ready
    if (!ready) 
        return;

    //Update players and projectiles
    for (var i in charactersList)
    {
		if (!charactersList[i]) continue;     

        if (charactersList[i].alive){
            charactersList[i].update();
        }
    };
}

function render () {
}