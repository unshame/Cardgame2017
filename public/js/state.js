window.playState = new Phaser.State();

playState.preload = function(){
	console.log('preloading')
	//Фон
	app.load.image('wood_light', 'assets/backgrounds/wood_light.png');
	app.load.image('wood_dark', 'assets/backgrounds/wood_dark.png');
	app.load.image('green', 'assets/backgrounds/green.png');
	app.load.image('black', 'assets/backgrounds/black.png');
	app.load.image('assault', 'assets/backgrounds/assault.png');
	app.load.image('brown', 'assets/backgrounds/brown.png');
	app.load.image('blue', 'assets/backgrounds/blue.png');

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
	console.log('setting up')
	app.client = EurecaClientSetup(app);
}

playState.update = function(){
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
	console.log('updating')
}

app.state.add('Play', playState, true)