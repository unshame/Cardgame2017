//Тестовый модуль игры и приложения
//В будущем будет разделен на AppManager и GameManager

window.gameManager = {
	cards: {},
	cardsGroup: null
};
window.controller = null;
window.spotManager = new SpotManager();

window.game = new Phaser.Game(
	app.screenWidth, 
	app.screenHeight,  
	Phaser.Canvas, 
	'cardgame', 
	{ preload: preload, create: EurecaClientSetup, update: update, render: render }
);

var debugSpotValidity = false;

var onScreenChange = function() {
	app.screenWidth = window.innerWidth;
	app.screenHeight = window.innerHeight;
	game.scale.setGameSize(app.screenWidth, app.screenHeight)
	app.background.width = app.screenWidth;
	app.background.height =  app.screenHeight;

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
	spotManager && spotManager.updateDebug();

	for(var ci in gameManager.cards){
		if(!gameManager.cards.hasOwnProperty(ci))
			continue;
		gameManager.cards[ci].updateDebug();
	}
}