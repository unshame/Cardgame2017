//Тестовый модуль игры и приложения
//В будущем будет разделен на AppManager и GameManager

window.gameManager = {
	cards: {},
	cardsGroup: null,
	rope: null
};
window.controller = null;
window.spotManager = new SpotManager();

window.app = new Phaser.Game(
	appManager.screenWidth, 
	appManager.screenHeight,  
	Phaser.Canvas, 
	'cardgame', 
	{ preload: preload, create: EurecaClientSetup, update: update, render: render }
);

var debugSpotValidity = false;

var onScreenChange = function() {
	appManager.screenWidth = window.innerWidth;
	appManager.screenHeight = window.innerHeight;
	if(app.created){
		app.scale.setGameSize(appManager.screenWidth, appManager.screenHeight)
		appManager.background.width = appManager.screenWidth;
		appManager.background.height =  appManager.screenHeight;
		spotManager.resizeSpots();
		gameManager.rope.maxHeight = gameManager.rope.sprite.y = appManager.screenHeight;
		gameManager.skipButton.reposition(appManager.screenWidth - skinManager.skin.width - 120, appManager.screenHeight - skinManager.skin.height - 120);
		gameManager.takeButton.reposition(appManager.screenWidth - skinManager.skin.width - 120, appManager.screenHeight - skinManager.skin.height - 120);
	}
}
window.addEventListener('resize',onScreenChange);
window.addEventListener('orientationchange',onScreenChange);

function create () 
{
	if(app.created)
		return;

	app.created = true;
	app.world.setBounds(0, 0, appManager.screenWidth, appManager.screenHeight);
	//app.stage.disableVisibilityChange  = true;
	

	appManager.background = app.add.tileSprite(0, 0, appManager.screenWidth, appManager.screenHeight, 'blue');


	gameManager.cardsGroup = app.add.group();


	controller = new Controller(false);

	gameManager.rope = new Rope();

	gameManager.skipButton = new Button(appManager.screenWidth - skinManager.skin.width - 120, appManager.screenHeight - skinManager.skin.height - 120, function(){sendRealAction('SKIP')}, 'Skip');
	gameManager.takeButton = new Button(appManager.screenWidth - skinManager.skin.width - 120, appManager.screenHeight - skinManager.skin.height - 120, function(){sendRealAction('TAKE')}, 'Take');
	gameManager.skipButton.hide();
	gameManager.takeButton.hide();
	app.canvas.oncontextmenu = function (e) { e.preventDefault(); }
	/*app.onPause.add(function(){console.log('paused')});
	app.onResume.add(function(){console.log('unpaused')});
	app.onBlur.add(function(){console.log('blured')});
	app.onFocus.add(function(){console.log('focused')});*/
}


function update () {
	if(!app.created)
		return;

	if(controller)
		controller.update();

	if(gameManager.rope)
		gameManager.rope.update();

	for(var ci in gameManager.cards){
		if(!gameManager.cards.hasOwnProperty(ci))
			continue;
		gameManager.cards[ci].update();
	}
}


function render () {
	if(!app.created)
		return;

	controller && controller.updateDebug();
	spotManager && spotManager.updateDebug();

	for(var ci in gameManager.cards){
		if(!gameManager.cards.hasOwnProperty(ci))
			continue;
		gameManager.cards[ci].updateDebug();
	}
}