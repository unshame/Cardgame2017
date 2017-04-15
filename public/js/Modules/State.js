window.playState = new Phaser.State();

playState.preload = function(){
	var app = this.game;
	//Фон
	app.load.image('wood_light', 'assets/backgrounds/wood_light.png');
	app.load.image('wood_dark', 'assets/backgrounds/wood_dark.png');
	app.load.image('green', 'assets/backgrounds/green.png');
	app.load.image('black', 'assets/backgrounds/black.png');
	app.load.image('assault', 'assets/backgrounds/assault.png');
	app.load.image('brown', 'assets/backgrounds/brown.png');
	app.load.image('blue', 'assets/backgrounds/blue.png');

	// Для меню
	app.load.image('menu','assets/backgrounds/menu.png');
	app.load.image('menu_blue','assets/backgrounds/menu_blue.jpg');
	app.load.image('menu_gray','assets/backgrounds/menu_gray.gif');

	//Для тестов
	app.load.image('testParticle', 'assets/test_particle.png');

	//Кнопки
	app.load.spritesheet('button_grey_wide', 'assets/buttons/grey_wide.png', 190, 49, 3);

	//Скины
	window.skinManager = new SkinManager('modern');
	skinManager.addSkin({name: 'modern'});
	var options = {
		width: 390,
		height: 570,
		name: 'familiar',
		numOfFrames: 52,
		cardbackPossibleFrames: [51],
		cardbackFrame: 51,
		glowHeight: 238,
		scaleX: 0.5,
		scaleY: 0.5,
		trumpOffset: 90
	}
	skinManager.addSkin(options);
	options = {
		width: 150,
		height: 218,
		name: 'classic',
		numOfFrames: 53,
		cardbackPossibleFrames: [52],
		cardbackFrame: 52,
		trumpOffset: 32,
		trailWidth: 55,
		trailHeight: 55/*,
		scaleX: 0.9,
		scaleY: 0.9*/
	}
	skinManager.addSkin(options);
}

playState.create = function(){
	var app = this.game;
	app.client = EurecaClientSetup(this.createApp, this);
}

playState.createApp = function(){
	var app = this.game;
	if(app.created)
		return;

	$('#loading').animate({opacity: 0}, 2000, function(){
		$('#loading').hide();
	})

	app.created = true;
	//app.world.setBounds(0, 0, app.screenWidth, app.screenHeight);
	//app.stage.disableVisibilityChange  = true;
	

	app.background = app.add.tileSprite(0, 0, app.screenWidth, app.screenHeight, 'blue');
	

	
	
	game.cardsGroup = app.add.group();
	controller = new Controller(false);
	game.rope = new Rope();
	game.skipButton = new Button(app.screenWidth - skinManager.skin.width - 120, app.screenHeight - skinManager.skin.height - 120, function(){sendRealAction('SKIP')}, 'Skip');
	game.takeButton = new Button(app.screenWidth - skinManager.skin.width - 120, app.screenHeight - skinManager.skin.height - 120, function(){sendRealAction('TAKE')}, 'Take');
	game.skipButton.hide();
	game.takeButton.hide();
	game.menu = new Menu(app.screenWidth/2,app.screenHeight/2);
	game.menu.addButton(function(){	},'SinglePlayer');
	game.menu.addButton(function(){console.log('sup');},'Multiplayer');
	game.menu.addButton(function(){console.log('lel');},'Options');
	app.canvas.oncontextmenu = function (e) { e.preventDefault(); }
	game.testButton = new Button(
		50,
		50, function(){
			game.menu.toggle();
		},
		'Menu'
	)

	
	/*app.onPause.add(function(){console.log('paused')});
	app.onResume.add(function(){console.log('unpaused')});
	app.onBlur.add(function(){console.log('blured')});
	app.onFocus.add(function(){console.log('focused')});*/

}


playState.update = function(){
	var app = this.game;
	if(!app.created)
		return;

	if(controller)
		controller.update();

	if(game.rope)
		game.rope.update();

	for(var ci in game.cards){
		if(!game.cards.hasOwnProperty(ci))
			continue;
		game.cards[ci].update();
	}
}


playState.render = function(){
	var app = this.game;
	if(!app.created)
		return;

	controller && controller.updateDebug();
	spotManager && spotManager.updateDebug();

	for(var ci in game.cards){
		if(!game.cards.hasOwnProperty(ci))
			continue;
		game.cards[ci].updateDebug();
	}
}

playState.loadUpdate = function(){
	var app = this.game;
}

