//Тестовый модуль игры и приложения
//В будущем будет разделен на AppManager и GameManager

window.gameManager = {
	cards: {},
	cardsGroup: null
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
	app.scale.setGameSize(appManager.screenWidth, appManager.screenHeight)
	appManager.background.width = appManager.screenWidth;
	appManager.background.height =  appManager.screenHeight;

}
window.addEventListener('resize',onScreenChange);
window.addEventListener('orientationchange',onScreenChange);

function create () 
{
	if(!app.created){
		app.world.setBounds(0, 0, appManager.screenWidth, appManager.screenHeight);
		//app.stage.disableVisibilityChange  = true;
		app.created = true;
	}
	
	if(!appManager.background)
		appManager.background = app.add.tileSprite(0, 0, appManager.screenWidth, appManager.screenHeight, 'assault');

	if(!gameManager.cardsGroup)
		gameManager.cardsGroup = app.add.group();

	if(!controller)
		controller = new Controller(false);

	app.canvas.oncontextmenu = function (e) { e.preventDefault(); }
}


function update () {
	if(!app.created)
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