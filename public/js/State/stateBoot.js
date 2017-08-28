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

	loadAllColors(key1, key2, path1, path2, width, height, frames){
		this.colors.forEach(function(color){
			if(width || width === 0){
				game.load.spritesheet(key1 + '_' + color + '_' + key2, path1 + color + '_' + path2, width, height, frames);
			}
			else{				
				game.load.image(key1 + '_' + color + '_' + key2, path1 + color + '_' + path2);
			}

		});
	},

	/**
	* Загружает ассеты.
	* @memberof stateBoot
	*/
	preload: function(){

		console.log('Preloading');

		// Цвета элементов интерфейса
		this.colors = ['grey', 'orange', 'red', 'blue', 'yellow', 'green'];

		// Лого
		game.load.image('logo', 'assets/logo.png');

		// Фоны
		game.load.image('vignette', 'assets/vignette.png');

		game.load.image('wood_light', 'assets/backgrounds/wood_light.png');
		game.load.image('wood_dark', 'assets/backgrounds/wood_dark.png');
		game.load.image('green', 'assets/backgrounds/green.png');
		game.load.image('black', 'assets/backgrounds/black.png');
		game.load.image('assault', 'assets/backgrounds/assault.png');
		game.load.image('brown', 'assets/backgrounds/brown.png');
		game.load.image('blue', 'assets/backgrounds/blue.png');

		// Для тестов
		game.load.image('testParticle', 'assets/test_particle.png');

		// Углы меню
		this.loadAllColors('panel', 'corners', 'assets/panels/', 'corners.png');

		// Кнопки
		game.load.spritesheet('button_red_wide', 'assets/buttons/red_wide.png', 190, 50, 4);
		game.load.spritesheet('button_grey_wide', 'assets/buttons/grey_wide.png', 190, 50, 4);
		game.load.spritesheet('button_grey_small', 'assets/buttons/grey_small.png', 49, 49, 4);
		game.load.spritesheet('button_orange_wide', 'assets/buttons/orange_wide.png', 190, 50, 4);
		game.load.spritesheet('button_orange_big', 'assets/buttons/orange_big.png', 190, 80, 4);
		game.load.spritesheet('button_orange_small', 'assets/buttons/orange_small.png', 49, 49, 4);

		this.loadAllColors('button', 'circle', 'assets/buttons/', 'circle.png');
		this.loadAllColors('button', 'radial', 'assets/buttons/', 'radial.png', 40, 38, 2);
		this.loadAllColors('button', 'checkbox', 'assets/buttons/', 'checkbox.png', 40, 38, 2);
		this.loadAllColors('button', 'arrow', 'assets/buttons/', 'arrow.png', 40, 38, 2);

		// Иконки кнопок
		this.colors.push('white');
		this.loadAllColors('icon', 'cross', 'assets/icons/', 'cross.png');
		this.loadAllColors('icon', 'checkmark', 'assets/icons/', 'checkmark.png');

		game.load.spritesheet('icon_fullscreen', 'assets/icons/fullscreen.png', 30, 30, 2);
		game.load.image('icon_menu', 'assets/icons/menu.png');

		// Курсоры
		game.load.spritesheet('cursor_orange', 'assets/cursors/orange.png', 128, 128, 3);

		// Фоны полей
		game.load.image('lock', 'assets/icons/lock.png');
		game.load.image('unlock', 'assets/icons/unlock.png');
		game.load.image('skull', 'assets/icons/skull.png');

		// Поля ввода
		game.load.image('field_wide', 'assets/fields/wide.png');
		

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
