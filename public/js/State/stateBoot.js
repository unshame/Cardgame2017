/**
* Состояние игры, отвечающее за загрузку.
* Загружает ассеты и создает соединение с сервером.  
* Асинхронное состояние.
* @namespace stateBoot
* @see {@link State}
* @see {@link StateManager}
* @property {string} key='boot' Название состояния.
*/

/* exported stateBoot */
var stateBoot = new State('boot', {

	/**
	* Инициализирует показ процесса загрузки.
	* @memberof stateBoot
	*/
	init: function(){

		console.log('Starting up');		

		this.loadCounter = 0;

		this.loadtextDOM = document.getElementById('loading-text');
		var loading = document.getElementById('loading');
		loading.style.backgroundImage = 'url("assets/loading.gif")';
	},

	/**
	* Загружает ассеты.
	* @memberof stateBoot
	*/
	preload: function(){

		console.log('Preloading');

		game.load.image('logo', 'assets/logo.png');

		// Фон
		game.load.image('wood_light', 'assets/backgrounds/wood_light.png');
		game.load.image('wood_dark', 'assets/backgrounds/wood_dark.png');
		game.load.image('green', 'assets/backgrounds/green.png');
		game.load.image('black', 'assets/backgrounds/black.png');
		game.load.image('assault', 'assets/backgrounds/assault.png');
		game.load.image('brown', 'assets/backgrounds/brown.png');
		game.load.image('blue', 'assets/backgrounds/blue.png');

		// Для меню
		game.load.image('panel_grey_corners','assets/panels/grey_corners.png');
		game.load.image('panel_orange_corners','assets/panels/orange_corners.png');
		game.load.image('panel_blue_corners','assets/panels/blue_corners.png');
		game.load.image('panel_yellow_corners','assets/panels/yellow_corners.png');
		game.load.image('panel_green_corners','assets/panels/green_corners.png');

		// Для тестов
		game.load.image('testParticle', 'assets/test_particle.png');

		game.load.image('lock', 'assets/lock.png');
		game.load.image('unlock', 'assets/unlock.png');
		game.load.image('skull', 'assets/skull.png');

		// Кнопки
		game.load.spritesheet('button_red_wide', 'assets/buttons/red_wide.png', 190, 50, 4);
		game.load.spritesheet('button_grey_wide', 'assets/buttons/grey_wide.png', 190, 50, 4);
		game.load.spritesheet('button_grey_small', 'assets/buttons/grey_small.png', 49, 49, 4);
		game.load.spritesheet('button_orange_wide', 'assets/buttons/orange_wide.png', 190, 50, 4);
		game.load.spritesheet('button_orange_small', 'assets/buttons/orange_small.png', 49, 49, 4);

		game.load.spritesheet('icon_fullscreen', 'assets/buttons/icon_fullscreen.png', 30, 30, 2);
		game.load.image('icon_menu', 'assets/buttons/icon_menu.png');

		game.load.spritesheet('cursor_yellow', 'assets/cursors/yellow.png', 128, 128, 3);
		game.load.spritesheet('cursor_orange', 'assets/cursors/orange.png', 128, 128, 3);

		/**
		* Google WebFont Loader  
		*  
		* > Web Font Loader gives you added control when using linked fonts via @font-face.
		* It provides a common interface to loading fonts regardless of the source, then
		* adds a standard set of events you may use to control the loading experience.
		* The Web Font Loader is able to load fonts from Google Fonts, Typekit, Fonts.com,
		* and Fontdeck, as well as self-hosted web fonts.
		* @external WebFont
		* @see  {@link https://github.com/typekit/webfontloader}
		*/
		game.load.script('webfont', '//ajax.googleapis.com/ajax/libs/webfont/1.4.7/webfont.js');

		skinManager.addSkins(skins);
	},

	/**
	* Инициализирует игру и соединение с сервером.
	* @memberof stateBoot
	*/
	create: function(){
		console.log('Initializing');
		game.initialize();
	},

	/** 
	* Убирает загрузочный текст и экран. 
	* @memberof stateBoot 
	*/ 
	shutdown: function(){ 
		console.log('Connection ready');
		ui.layers.loadLabels();
		this.loadtextDOM.innerHTML = ''; 
		document.getElementById('loading').style.display = 'none';
		console.log('Game ready');
	},

	/**
	* Обновляет загрузочный текст.
	* @param {string} text загрузочный текст
	* @memberof stateBoot
	*/
	updateLoadText: function(text){
		if(this.loadCounter > 30){
			this.loadCounter = 0;
		}
		for(var i = 0; i < this.loadCounter; i++){
			text += '.';
		}
		this.loadtextDOM.innerHTML = text;
		this.loadCounter++;
	},

	/**
	* Выводит текст загрузки.
	* @memberof stateBoot
	*/
	loadUpdate: function(){
		this.updateLoadText('loading assets');
	},

	/**
	* Выводит текст загрузки.
	* @memberof stateBoot
	*/
	update: function(){
		this.updateLoadText('connecting to server');
	}
});
