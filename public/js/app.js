var App = function(){

	window.game = {
		cards: {},
		cardsGroup: null,
		rope: null
	};
	window.spotManager = new SpotManager();
	window.skinManager = null;
	window.controller = null;
	window.addEventListener('resize', this.updateAppDimensions.bind(this));
	window.addEventListener('orientationchange', this.updateAppDimensions.bind(this));

	this.screenWidth = window.innerWidth;
	this.screenHeight = window.innerHeight;
	this.background = null;

	Phaser.Game.call(
		this,
		this.screenWidth, 
		this.screenHeight,  
		Phaser.Canvas, 
		'cardgame'
	);
}

App.prototype = Object.create(Phaser.Game.prototype);
App.prototype.constructor = App;

App.prototype.createApp = function(){
	console.log('creating')
	if(this.created)
		return;

	$('#loading').animate({opacity: 0}, 2000, function(){
		$('#loading').hide();
	})

	this.created = true;
	//this.world.setBounds(0, 0, this.screenWidth, this.screenHeight);
	//this.stage.disableVisibilityChange  = true;
	

	this.background = this.add.tileSprite(0, 0, this.screenWidth, this.screenHeight, 'blue');

	game.cardsGroup = this.add.group();

	controller = new Controller(false);

	game.rope = new Rope();

	game.skipButton = new Button(this.screenWidth - skinManager.skin.width - 120, this.screenHeight - skinManager.skin.height - 120, function(){sendRealAction('SKIP')}, 'Skip');
	game.takeButton = new Button(this.screenWidth - skinManager.skin.width - 120, this.screenHeight - skinManager.skin.height - 120, function(){sendRealAction('TAKE')}, 'Take');
	game.skipButton.hide();
	game.takeButton.hide();
	this.canvas.oncontextmenu = function (e) { e.preventDefault(); }
	/*this.onPause.add(function(){console.log('paused')});
	this.onResume.add(function(){console.log('unpaused')});
	this.onBlur.add(function(){console.log('blured')});
	this.onFocus.add(function(){console.log('focused')});*/
}

App.prototype.updateAppDimensions = function(){
	this.screenWidth = window.innerWidth;
	this.screenHeight = window.innerHeight;
	if(this.created){
		this.scale.setGameSize(this.screenWidth, this.screenHeight)
		this.background.width = this.screenWidth;
		this.background.height =  this.screenHeight;
		spotManager.resizeSpots();
		game.rope.maxHeight = game.rope.sprite.y = this.screenHeight;
		game.skipButton.reposition(this.screenWidth - skinManager.skin.width - 120, this.screenHeight - skinManager.skin.height - 120);
		game.takeButton.reposition(this.screenWidth - skinManager.skin.width - 120, this.screenHeight - skinManager.skin.height - 120);
	}
}

window.app = new App();