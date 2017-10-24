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
	* @type {UI.Layers}
	*/
	this.layers = new UI.Layers();
};

/**
* Инициализирует интерфейс, создавая все элементы интерфейса
* и добавляя их в менеджер слоев.
*/
UI.prototype.initialize = function(){

	/**
	* Курсор.
	* @type {UI.Cursor}
	*/
	this.cursor = new UI.Cursor('cursor_orange');

	/**
	* Фон.
	* @type {UI.Background}
	*/
	this.background = new UI.Background();	

	/**
	* Лого игры.
	* @type {Phaser.Image}
	*/
	this.logo = new UI.Logo(function(){
		return {x: game.screenWidth/2, y: game.screenHeight/2 - 225};
	}, 0.75, 'logo');

	/**
	* Таймер хода.
	* @type {UI.Rope}
	*/
	this.rope = new UI.Rope();

	/**
	* Фид системных сообщений.
	* @type {MessageFeed}
	*/
	this.feed = new MessageFeed(game);

	/**
	* Фид важных сообщений.
	* @type {MessageFeed.AnnounceFeed}
	*/
	this.announcer = new MessageFeed.AnnounceFeed(game);	

	/**
	* Фид событий.
	* @type {MessageFeed.EventFeed}
	*/
	this.eventFeed = new MessageFeed.EventFeed(game);	

	this.eventFeed.zIndexBelowCards = 3;
	this.eventFeed.zIndexAboveCards = 7;
	
	/**
	* Менеджер модальных меню.
	* @type {UI.ModalManager}
	*/
	this.modalManager = new UI.ModalManager();

	this.popupManager = new UI.PopupManager();

	this.credits = new UI.Credits(creditsText, game.state.change.bind(game.state, 'menu'));
	
	this._createButtons();

	this.menus = this._createMenus();

	this.layers.addExistingLayers([
		[this.background, 0],
		// this.actionButtons, 1
		[fieldManager, 2],
		[this.rope, 3],
		// this.eventFeed, 3 (zIndexBelowCards)
		[cardManager, 4],
		[cardEmitter, 5],
		// this.menus.main, 6
		// this.menus.broswer, 6
		[this.logo, 6],
		[this.credits, 6],
		[this.feed, 7],
		[this.eventFeed, this.eventFeed.zIndexAboveCards],
		[this.announcer, 8],
		// игровые меню, -6
		[this.modalManager, -5],
		// модальные меню, -4
		// this.cornerButtons, -3
		[this.popupManager, -2],
		[this.cursor, -1]
	]);

	this.layers.hideLayer(this.actionButtons, true);

	this.layers.positionLayers();

	this.activateHotkeys();
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

UI.prototype.setDebugButtonText = function(name, text, on){
	ui.menus.debug.getByName(name).label.setText(text + ': ' + (on ? 'on' : 'off'), true);
};

UI.prototype.activateHotkeys = function(){
	var esc = game.input.keyboard.addKey(Phaser.Keyboard.ESC);
	esc.onDown.add(function(){
		if(this.modalManager.openModals.length){
			this.modalManager.closeModal();
		}
		else if(game.state.currentSync == 'credits'){
			game.state.change('menu');
		}
		else {
			this.modalManager.openModal('options');
		}
	}, this);

	function sendButtonAction(){
		var button = actionHandler.actionButton;
		if(game.state.currentSync == 'play' && button && button.serverAction){
			connection.server.sendButtonAction(button.serverAction);
		}
	}

	var enter = game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
	enter.onDown.add(sendButtonAction, this);

	var space = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
	space.onDown.add(sendButtonAction, this);
};

UI.prototype.toggleDebugButtons = function(){
	this.debugButtons.visible = !this.debugButtons.visible;
	this.debugButtons.forEach(function(b){
		if(this.debugButtons.visible){
			b.show();
		}
		else{
			b.hide();
		}
	}, this);
	gameOptions.set('debug_buttons', this.debugButtons.visible);
	gameOptions.save();
}


//@include:UIMenus
//@include:UIButtons

//@include:Menu

//@include:PopupManager
//@include:Layers
//@include:Background

//@include:Button
//@include:Stepper
//@include:Text
//@include:Checkbox
//@include:InputField

//@include:Rope
//@include:Logo
//@include:Cursor
//@include:ModalManager
//@include:Credits
