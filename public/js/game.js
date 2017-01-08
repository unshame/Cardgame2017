var land = null;
var cardsGroup = null;
var cards = {};
var screenWidth = window.innerWidth;
var screenHeight = window.innerHeight;
var game = new Phaser.Game(
	screenWidth, 
	screenHeight,  
	Phaser.WEBGL, 
	'cardgame', 
	{ preload: preload, create: EurecaClientSetup, update: update, render: render }
);

var onScreenChange = function() {
	screenWidth = window.innerWidth;
	screenHeight = window.innerHeight;
	game.scale.setGameSize(screenWidth, screenHeight)
	land.width = screenWidth;
	land.height =  screenHeight;
}
window.addEventListener("resize",onScreenChange);
window.addEventListener("orientationchange",onScreenChange);

function create () 
{
	game.world.setBounds(0, 
						 0, 
						 screenWidth, 
						 screenHeight);
	game.stage.disableVisibilityChange  = true;
	
	//Ground
	if(!land)
		land = game.add.tileSprite(0, 0, screenWidth, screenHeight, 'table8x');

	//Players will go here
	if(!cardsGroup)
		cardsGroup = game.add.group();

	game.canvas.oncontextmenu = function (e) { e.preventDefault(); }
}


function update () {
	for(var ci in cards){
		if(!cards.hasOwnProperty(ci))
			continue;
		var c = cards[ci];
		if(c.clickState == 'PICKED_UP'){
			c.setPosition(game.input.activePointer.x, game.input.activePointer.y)
		}
		cards[ci].update();
	}
}

function render () {
}