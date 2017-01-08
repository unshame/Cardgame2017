var land = null;
var cardsGroup = null;
unclickMe = null;
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

	var button = game.add.button(12, 12, 'button_grey_wide', function(){
		debugSpotValidity = !debugSpotValidity;
		if(!debugSpotValidity){
			button.setFrames(1, 2, 0, 2);
			for(var ci in cards){
				if(cards.hasOwnProperty(ci)){
					var c = cards[ci];
					c.trail.position = {x: 0, y: 0};
				}
			}
			cardsGroup.align(Math.floor(screenWidth / 170), -1, 170, 220, Phaser.CENTER);
		}
		else{
			button.setFrames(1, 0, 2, 0);
		}
	}, this, 1, 0, 2);
	var style = { font: '18px Verdana', fill: '#000', align: 'center' };
	var buttonText = game.add.text(button.centerX, button.centerY, 'Toggle snap to grid', style);
	buttonText.anchor.set(0.5, 0.5)
}


function update () {
	for(var ci in cards){
		if(!cards.hasOwnProperty(ci))
			continue;
		cards[ci].update();
	}

	//Возвращаем перетаскиваемую карту на место по правому клику
	if(game.input.activePointer.rightButton.isDown && unclickMe && unclickMe.dragState == 'DRAGGED'){
		unclickMe.dragState = 'RESTED';
		unclickMe.clickState = 'PUT_DOWN';
		unclickMe.dragStop();
		unclickMe = null;
	}
}

function render () {
}