/**
* Менеджер интерфейса.  
* Создает и обновляет позиции всех элементов интерфейса: кнопки, курсор, таймер и т.д.  
* Создает менеджер слоев интерфейса {@link UI#layers} и добавляет элементы интерфейса, 
* а также существующие группы в него.
* @class
*/

var UI = function(){

	this.actionButtons = null;
	this.cornerButtons = null;

	this.cursor = null;
	this.background = null;
	this.logo = null;
	this.rope = null;

	this.feed = null;
	this.eventFeed = null;
	this.announcer = null;

	this.modalManager = null;
	this.menus = null;

	/**
	* Заранее заданные цвета для использования в игровых элементах.
	* @type {Object}
	*/
	this.colors = {
		orange: 0xFF8300,
		green: 0x68C655,
		red: 0xC93F3F,
		white: 0xFeFeFe,
		lightGray: 0xC6C6C6,
		lightBlue: 0x0072C4,
		menu: {
			grey: {
				outer: '#999999',
				inner: '#FFFFFF',
				background: '#EEEEEE'
			},
			orange: {
				outer: '#CD5D12',
				inner: '#FA8132',
				background: '#E86A17'
			},
			green: {
				outer: '#5FB13A',
				inner: '#88E060',
				background: '#73CD4B'
			},
			yellow: {
				outer: '#CDA400',
				inner: '#FFD948',
				background: '#FFCC00'
			},
			blue: {
				outer: '#1989B8',
				inner: '#35BAF3',
				background: '#1EA7E1'
			},
			red: {
				outer: '#E00505',
				inner: '#FF2F2F',
				background: '#F91E1E'				
			}
		}
	};

	/**
	* Менеджер "слоев" элементов интерфейса.
	* @type {UILayers}
	*/
	this.layers = new UILayers();
};

/**
* Инициализирует интерфейс, создавая все элементы интерфейса
* и добавляя их в менеджер слоев.
*/
UI.prototype.initialize = function(){

	/**
	* Курсор.
	* @type {Cursor}
	*/
	this.cursor = new Cursor('cursor_orange');

	/**
	* Фон.
	* @type {Background}
	*/
	this.background = new Background();	

	/**
	* Лого игры.
	* @type {Phaser.Image}
	*/
	this.logo = new Logo(function(){
		return {x: game.screenWidth/2, y: game.screenHeight/2 - 225};
	}, 0.75, 'logo');

	/**
	* Таймер хода.
	* @type {Rope}
	*/
	this.rope = new Rope();

	/**
	* Фид системных сообщений.
	* @type {MessageFeed}
	*/
	this.feed = new MessageFeed(game);

	/**
	* Фид важных сообщений.
	* @type {AnnouncementFeed}
	*/
	this.announcer = new AnnouncementFeed(game);	

	/**
	* Фид событий.
	* @type {EventFeed}
	*/
	this.eventFeed = new EventFeed(game);	
	
	/**
	* Менеджер модальных меню.
	* @type {ModalManager}
	*/
	this.modalManager = new ModalManager();

	this.credits = new Credits(creditsText, game.state.change.bind(game.state, 'menu'));

	this.menus = this._createMenus();
	this.menus.options.hideElement('disconnect');
	this.modalManager.makeModal([
		this.menus.options,
		this.menus.debug
	]);
	this._createButtons();

	this.layers.addExistingLayers([
		[this.background, 0],
		// this.actionButtons, 1
		[fieldManager, 2],
		[cardManager, 3],
		[cardEmitter, 4],
		// this.menus.main, 5
		[this.logo, 5],
		[this.credits, 5],
		[this.feed, 6],
		[this.eventFeed, 6],
		[this.announcer, 7],
		[this.rope, 7],
		[this.modalManager, -4],
		// модальные меню, -3
		// this.cornerButtons, -2
		[this.cursor, -1]
	]);

	this.layers.hideLayer(this.actionButtons, true);

	this.layers.positionLayers();
};

/** Обновляет позиции всех элементов UI. */
UI.prototype.updatePositions = function(){
	this.layers.positionElements();
};

/** Возвращает phaser пиксель для превращения в текстуру. */
UI.prototype.newPixel = function(){
	var pixel = game.make.graphics(0, 0);
	pixel.beginFill(ui.colors.white);
	pixel.drawRect(0, 0, 1, 1);
	pixel.endFill();
	return pixel;
};

//@include:UIMenus
//@include:UIButtons

//@include:UILayers
//@include:Background
//@include:Button
//@include:Rope
//@include:Menu
//@include:Logo
//@include:Cursor
//@include:ModalManager
//@include:Credits
