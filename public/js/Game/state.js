//Основное состояние игры
//Предоставляет движку функции, которые выполняются при загрузке, создании
//и обновлении игрового цикла 

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
	game.load.spritesheet('button_grey_wide', 'assets/buttons/grey_wide.png', 190, 49, 4);

	game.load.spritesheet('cursor_yellow', 'assets/cursors/yellow.png', 128, 128, 3);
	game.load.spritesheet('cursor_orange', 'assets/cursors/orange.png', 128, 128, 3);

    game.load.script('webfont', '//ajax.googleapis.com/ajax/libs/webfont/1.4.7/webfont.js');

	//Скины
	window.skinManager = new SkinManager('modern');
	skinManager.addSkins(window.skins);
};

playState.create = function(){
	game.client = EurecaClientSetup(game.initialize, game);
};

playState.update = function(){
	if(!game.created)
		return;

	cardControl.update();
	game.rope.update();
	cardManager.update();
	cursor.update();
};

playState.render = function(){
	if(!game.created)
		return;

	if(game.stage.disableVisibilityChange && game.paused)
		game.paused = false;

	cardControl.updateDebug();
	fieldManager.updateDebug();
	cardManager.updateDebug();
};

playState.loadUpdate = function(){
	
};

