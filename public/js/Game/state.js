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

	game.load.spritesheet('cursor_yellow', 'assets/cursors/yellow.png', 128, 128, 3);
	game.load.spritesheet('cursor_orange', 'assets/cursors/orange.png', 128, 128, 3);

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
		scaleX: 0.4,
		scaleY: 0.4,
		trumpOffset: 90
	};
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
		trailHeight: 55,
		scaleX: 0.9,
		scaleY: 0.9
	};
	skinManager.addSkin(options);
};

playState.create = function(){
	game.client = EurecaClientSetup(game.initialize, game);
};


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
};


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
};

playState.loadUpdate = function(){
	
};

