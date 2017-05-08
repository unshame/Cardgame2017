/**
 * Состояние игры, отвечающее за загрузку.
 * Загружает ассеты и создает соединение с сервером.  
 * Добавляется в `game.state`.  
 * @namespace stateBoot
 */

window.stateBoot = {

	/**
	 * Выполняется до загрузки игры и загружает ассеты.
	 * @memberof stateBoot
	 */
	preload: function(){
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

		/**
		 * Менеджер скинов
		 * @type {SkinManager}
		 * @global
		 */
		window.skinManager = new SkinManager('modern');
		skinManager.addSkins(window.skins);
	},

	/**
	 * Выполняется в первую очередь, инициализирует показ процесса загрузки.
	 * @memberof stateBoot
	 */
	init: function(){

		/**
		 * Счетчик тиков загрузки ассетов.
		 * @member preloadCounter
		 * @memberof stateBoot
		 */
		this.preloadCounter = 0;

		/**
		 * Счетчик тиков подключения к серверу.
		 * @member loadCounter
		 * @memberof stateBoot
		 */
		this.loadCounter = 0;

		/**
		 * Контейнер с текстом загрузки.
		 * @member loadtextDOM
		 * @memberof stateBoot
		 */
		this.loadtextDOM = document.getElementById('loading-text');
	},

	/**
	 * Выполняется во время загрузки ассетов.
	 * Выводит текст загрузки.
	 * @memberof stateBoot
	 */
	loadUpdate: function(){
		this.updateLoadText('loading assets', 'preloadCounter');
	},

	/**
	 * Выполняется во время соединения с сервером.
	 * Выводит текст загрузки.
	 * @memberof stateBoot
	 */
	update: function(){
		this.updateLoadText('connecting to server', 'loadCounter');
	},

	/**
	 * Обновляет загрузочный текст.
	 * @memberof stateBoot
	 * @param  {string} text       загрузочный текст
	 * @param  {string} counterKey название счетчика загрузки
	 */
	updateLoadText: function(text, counterKey){
		if(this[counterKey] > 30)
			this[counterKey] = 0;
		for(var i = 0; i < this[counterKey]; i++){
			text += '.';
		}
		this.loadtextDOM.innerHTML = text;
		this[counterKey]++;
	},

	/**
	 * Выполняется после загрузки ассетов, инициализирует соединение с сервером.
	 * @memberof stateBoot
	 */
	create: function(){
		/**
		 * Менеджер соединения с сервером
		 * @type {ConnectionManager}
		 * @global
		 */
		window.connection = new ConnectionManager();
	},

	/**
	 * Выполняется после того, как игра обработала изменение размера экрана.
	 * @memberof stateBoot
	 */
	postResize: function(){

	},

	/**
	 * Выполняется по окончании загрузки и подключения к серверу.
	 * Убирает загрузочный текст.
	 * @memberof stateBoot
	 */
	shutdown: function(){
		this.loadtextDOM.innerHTML = '';
	}
};
