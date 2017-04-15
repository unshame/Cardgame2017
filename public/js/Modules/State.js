window.playState = new Phaser.State();

playState.preload = function(){
	//Фон
	game.load.image('wood_light', 'assets/backgrounds/wood_light.png');
	game.load.image('wood_dark', 'assets/backgrounds/wood_dark.png');
	game.load.image('green', 'assets/backgrounds/green.png');
	game.load.image('black', 'assets/backgrounds/black.png');
	game.load.image('assault', 'assets/backgrounds/assault.png');
	game.load.image('brown', 'assets/backgrounds/brown.png');
	game.load.image('blue', 'assets/backgrounds/blue.png');

	// Для меню
	game.load.image('menu','assets/backgrounds/menu.png');
	game.load.image('menu_blue','assets/backgrounds/menu_blue.jpg');
	game.load.image('menu_gray','assets/backgrounds/menu_gray.gif');

	//Для тестов
	game.load.image('testParticle', 'assets/test_particle.png');

	//Кнопки
	game.load.spritesheet('button_grey_wide', 'assets/buttons/grey_wide.png', 190, 49, 3);

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
	game.client = EurecaClientSetup(this.createApp, this);
}

playState.createApp = function(){
	if(game.created)
		return;

	$('#loading').animate({opacity: 0}, 2000, function(){
		$('#loading').hide();
	})

	game.created = true;
	//game.world.setBounds(0, 0, game.screenWidth, game.screenHeight);
	//game.stage.disableVisibilityChange  = true;
	

	game.background = game.add.tileSprite(0, 0, game.screenWidth, game.screenHeight, 'blue');
	

	
	
	game.cardsGroup = game.add.group();
	controller = new Controller(false);
	game.rope = new Rope();
	game.skipButton = new Button(game.screenWidth/2 - skinManager.skin.width/2, game.screenHeight - skinManager.skin.height - 120, function(){sendRealAction('SKIP')}, 'Skip');
	game.takeButton = new Button(game.screenWidth/2 - skinManager.skin.width/2, game.screenHeight - skinManager.skin.height - 120, function(){sendRealAction('TAKE')}, 'Take');
	game.skipButton.hide();
	game.takeButton.hide();
	game.menu = new Menu(game.screenWidth/2,game.screenHeight/2);
	game.menu.addButton(function(){	},'SinglePlayer');
	game.menu.addButton(function(){console.log('sup');},'Multiplayer');
	game.menu.addButton(function(){console.log('lel');},'Options');
	game.canvas.oncontextmenu = function (e) { e.preventDefault(); }
/*	game.testButton = new Button(
		50,
		50, function(){
			game.menu.toggle();
		},
		'Menu'
	)*/

	
	/*game.onPause.add(function(){console.log('paused')});
	game.onResume.add(function(){console.log('unpaused')});
	game.onBlur.add(function(){console.log('blured')});
	game.onFocus.add(function(){console.log('focused')});*/

}


playState.update = function(){
	if(!game.created)
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
	if(!game.created)
		return;

	controller && controller.updateDebug();
	fieldManager && fieldManager.updateDebug();

	for(var ci in game.cards){
		if(!game.cards.hasOwnProperty(ci))
			continue;
		game.cards[ci].updateDebug();
	}
}

playState.loadUpdate = function(){
	
}

