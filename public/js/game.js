var land = null;
var sm = null;
var cardsGroup = null;
var cards = {};
var spot, botSpot, deck, discard, field;
var controller = null;
var button = null;
var screenWidth = window.innerWidth;
var screenHeight = window.innerHeight;
var game = new Phaser.Game(
	screenWidth, 
	screenHeight,  
	Phaser.Canvas, 
	'cardgame', 
	{ preload: preload, create: EurecaClientSetup, update: update, render: render }
);

var onScreenChange = function() {
	screenWidth = window.innerWidth;
	screenHeight = window.innerHeight;
	game.scale.setGameSize(screenWidth, screenHeight)
	land.width = screenWidth;
	land.height =  screenHeight;
	botSpot.resize(screenWidth - 200, null, true);
	deck.setBase(null, screenHeight - 250, true);
	discard.setBase(screenWidth - 250, screenHeight - 250, true);
	field.resize(screenWidth - 200, null, true);
	spot.setBase(null, screenHeight - 250);
	spot.resize(screenWidth - 700, null, true);

}
window.addEventListener('resize',onScreenChange);
window.addEventListener('orientationchange',onScreenChange);

function create () 
{
	if(!game.created){
		game.world.setBounds(0, 0, screenWidth, screenHeight);
		//game.stage.disableVisibilityChange  = true;
		game.created = true;
	}
	
	if(!land)
		land = game.add.tileSprite(0, 0, screenWidth, screenHeight, 'table8x');

	if(!cardsGroup)
		cardsGroup = game.add.group();

	if(!spot){
		spot = new Spot({
			x:350,
			y:screenHeight - 250,
			width:screenWidth - 700,
			texture: 'spot',
			type: 'HAND',
			id: 'player'
		});
	}

	if(!botSpot){
		botSpot = new Spot({
			x:100,
			y:100,
			width:screenWidth - 200,
			texture: 'spot',
			sorting:false,
			focusable:false,
			type: 'HAND',
			id: 'bots'
		});
	}

	if(!field){
		field = new Spot({
			x:100,
			y:400,
			width:screenWidth - 200,
			texture: 'spot',
			focusable:false,
			sorting:false,
			type: 'FIELD',
			id: 'field'
		});
	}

	if(!deck){
		deck = new Spot({
			x:100,
			y:screenHeight - 250,
			height: 190,
			focusable:false,
			spacing: false,
			texture: 'spot',
			sorting: false,
			type: 'DECK',
			id: 'deck',
			direction: 'vertical'
		});
	}

	if(!discard){
		discard = new Spot({
			x:screenWidth - 250,
			y:screenHeight - 250,
			height: 190,
			align:'right',
			focusable:false,
			spacing: false,
			texture: 'spot',
			sorting: false,
			type: 'DISCARD_PILE',
			id: 'discard',
			direction: 'vertical'
		});
	}

	if(!controller)
		controller = new Controller(false);

	game.canvas.oncontextmenu = function (e) { e.preventDefault(); }

	if(!button){
		button = game.add.button(12, 12, 'button_grey_wide', function(){
			debugSpotValidity = !debugSpotValidity;
			if(!debugSpotValidity){
				button.setFrames(1, 2, 0, 2);
				controller.cardResetTrail(true);
				//cardsGroup.align(Math.floor(screenWidth / 170), -1, 170, 220, Phaser.CENTER);
				//spot.placeCards(null, true);
			}
			else{
				button.setFrames(1, 0, 2, 0);
			}
		}, this, 1, 0, 2);
		var style = { font: '18px Verdana', fill: '#000', align: 'center' };
		var buttonText = game.add.text(button.centerX, button.centerY, 'Toggle snap to grid', style);
		buttonText.anchor.set(0.5, 0.5)
	}
}


function update () {
	if(!game.created)
		return;

	if(controller)
		controller.update();

	for(var ci in cards){
		if(!cards.hasOwnProperty(ci))
			continue;
		cards[ci].update();
	}
}


function render () {
	if(!game.created)
		return;

	controller && controller.updateDebug();
	spot && spot.updateDebug();
	deck && deck.updateDebug();
	field && field.updateDebug();
	botSpot && botSpot.updateDebug();
	discard && discard.updateDebug();
}