//Тестовый модуль игры и приложения
//В будущем будет разделен на AppManager и GameManager

window.gameManager = {
	cards: {},
	cardsGroup: null
};
window.controller = null;

window.game = new Phaser.Game(
	app.screenWidth, 
	app.screenHeight,  
	Phaser.Canvas, 
	'cardgame', 
	{ preload: preload, create: EurecaClientSetup, update: update, render: render }
);

var spot, botSpot, deck, discard, field;

var debugSpotValidity = false;

var onScreenChange = function() {
	app.screenWidth = window.innerWidth;
	app.screenHeight = window.innerHeight;
	game.scale.setGameSize(app.screenWidth, app.screenHeight)
	app.background.width = app.screenWidth;
	app.background.height =  app.screenHeight;
	botSpot.resize(app.screenWidth - 200, null, true);
	deck.setBase(null, app.screenHeight - 250, true);
	discard.setBase(app.screenWidth - 250, app.screenHeight - 250, true);
	field.resize(app.screenWidth - 200, null, true);
	spot.setBase(null, app.screenHeight - 250);
	spot.resize(app.screenWidth - 700, null, true);

}
window.addEventListener('resize',onScreenChange);
window.addEventListener('orientationchange',onScreenChange);

function create () 
{
	if(!game.created){
		game.world.setBounds(0, 0, app.screenWidth, app.screenHeight);
		//game.stage.disableVisibilityChange  = true;
		game.created = true;
	}
	
	if(!app.background)
		app.background = game.add.tileSprite(0, 0, app.screenWidth, app.screenHeight, 'assault');

	if(!gameManager.cardsGroup)
		gameManager.cardsGroup = game.add.group();

	if(!spot){
		spot = new Spot({
			x:390,
			y:app.screenHeight - 250,
			width:app.screenWidth - 700,
			texture: 'spot',
			type: 'HAND',
			id: 'player'
		});
	}

	if(!botSpot){
		botSpot = new Spot({
			x:100,
			y:100,
			width:app.screenWidth - 200,
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
			width:app.screenWidth - 200,
			texture: 'spot',
			focusable:false,
			sorting:false,
			type: 'FIELD',
			id: 'FIELD'
		});
	}

	if(!deck){
		deck = new Spot({
			x:100,
			y:app.screenHeight - 250,
			minActiveSpace: 26,
			align: 'right',
			padding: 0,
			margin: 22,
			focusable:false,
			forcedSpace: 0.5,
			texture: 'spot',
			sorting: false,
			type: 'DECK',
			id: 'DECK',
			alignment: 'vertical',
			direction: 'backward',
			delayTime: 50
		});
	}

	if(!discard){
		discard = new Spot({
			x:app.screenWidth - 250,
			y:app.screenHeight - 250,
			padding:0,
			focusable:false,
			forcedSpace: 0.5,
			texture: 'spot',
			sorting: false,
			type: 'DISCARD_PILE',
			id: 'DISCARD_PILE'
		});
	}

	if(!controller)
		controller = new Controller(false);

	game.canvas.oncontextmenu = function (e) { e.preventDefault(); }
}


function update () {
	if(!game.created)
		return;

	if(controller)
		controller.update();

	for(var ci in gameManager.cards){
		if(!gameManager.cards.hasOwnProperty(ci))
			continue;
		gameManager.cards[ci].update();
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

	for(var ci in gameManager.cards){
		if(!gameManager.cards.hasOwnProperty(ci))
			continue;
		gameManager.cards[ci].updateDebug();
	}
}