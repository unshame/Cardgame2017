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
		lightBlue: 0x0072C4
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
		return {x: game.screenWidth/2, y: game.screenHeight/2 - 200};
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

	this._createMenus();
	this._createButtons();

	this.layers.addExistingLayers([
		[this.background, 0],
		// this.actionButtons, 1
		[fieldManager, 2],
		[cardManager, 3],
		[cardEmitter, 4],
		// this.menus.main, 5
		[this.logo, 5],
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

/** 
* Создает меню.
*/
UI.prototype._createMenus = function(){
	this.menus = {
		main: new Menu({
			position: function(){
				return {
					x:game.screenWidth/2,
					y:game.screenHeight/2 + 150
				};
			}, 
			z: 5,
			alpha: 0.95,
			name: 'menu_main',
			texture: 'black'
		}),
		options: new Menu({
			position: function(){
				return {
					x:game.screenWidth/2,
					y:game.screenHeight/2
				};
			}, 
			z: -3,
			base: true,
			color: this.colors.white,
			texture: 'menu_blue',
			elementColor: 'grey',
			textColor: 'black',
			name: 'menu_options'
		}),
		debug: new Menu({
			position: function(){
				return {
					x:game.screenWidth/2,
					y:game.screenHeight/2
				};
			}, 
			z: -3,
			color: this.colors.white,
			texture: 'menu_blue',
			elementColor: 'grey',
			textColor: 'black',
			name: 'menu_debug'
		})
	};
	this.modalManager.makeModal([
		this.menus.options,
		this.menus.debug
	]);
};

/** 
* Создает кнопки.
*/
UI.prototype._createButtons = function(){
	/**
	* Кнопки игровых действий.
	* @type {Phaser.Group}
	*/
	this.actionButtons = this.layers.addLayer(1, 'actionButtons');

	/**
	* Угловые кнопки.
	* @type {Phaser.Group}
	*/
	this.cornerButtons = this.layers.addLayer(-2, 'cornerButtons');


	////////////////////
	/// ГЛАВНОЕ МЕНЮ ///
	////////////////////
	// Поиск игры
	this.menus.main.addButton(function(){
		game.state.change('play');
		connection.proxy.quickQueueUpClient();
	}, 'queueUp','Queue Up');

	// Опции
	this.menus.main.addButton(function(){
		ui.modalManager.openModal('options');
	}, 'options','Options');


	////////////////////
	//// МЕНЮ ОПЦИЙ ////
	////////////////////
	// Отключение от игры
	this.menus.options.addButton(function(){
		connection.server.disconnect();
		ui.modalManager.closeModal();
	}, 'disconnect','Disconnect');

	this.menus.options.hideElement('disconnect');

	// Смена фона
	this.menus.options.addButton(function(button, pointer){
		ui.background.nextTexture();
	},'background','Background');

	// Смена скина
	this.menus.options.addButton(function(button, pointer){
		if(pointer.isMouse && pointer.button !== 0){
			skinManager.setSkin('uno');
		}
		else if(skinManager.skin.name == 'modern'){
			skinManager.setSkin('classic');
		}
		else{
			skinManager.setSkin('modern');
		}

	},'CHS','Change skin');

	var renderer = options.get('system_renderer');
	this.menus.options.addButton( function(){
		options.set('system_renderer', renderer === Phaser.WEBGL ? Phaser.CANVAS : Phaser.WEBGL);
		options.save();
		location.href = location.href;
	}, 'renderer',(renderer === Phaser.WEBGL ? 'Canvas' : 'WebGL'));
	
	this.menus.options.addButton(function(){
		options.restoreAllDefaults();
		options.save();
		location.href = location.href;
	}, 'restore','Restore');

	this.menus.options.addButton(function(){
		ui.modalManager.openModal('debug');
	}, 'debug','Debug');

	// Закрыть меню
	this.menus.options.addButton( function(){
		ui.modalManager.closeModal();
	}, 'close','Close');


	////////////////////
	/// ДЕБАГ МЕНЮ //
	////////////////////

	this.menus.debug.addButton(function(){
		game.toggleAllDebugModes();
	}, 'all','All');

	this.menus.debug.addButton(function(){
		game.toggleDebugMode();
	}, 'game','Game');

	this.menus.debug.addButton(function(){
		connection.inDebugMode = !connection.inDebugMode;
	}, 'connection','Connection');

	this.menus.debug.addButton(function(){
		game.scale.toggleDebugMode();
	}, 'grid','Grid');

	this.menus.debug.addButton(function(){
		cardControl.toggleDebugMode();
	}, 'ctrl','Control');

	this.menus.debug.addButton(function(){
		fieldManager.toggleDebugMode();
	}, 'fields','Fields');

	this.menus.debug.addButton(function(){
		cardManager.toggleDebugMode();
	}, 'cards','Cards');

	this.menus.debug.addButton(function(){
		ui.modalManager.closeModal();
	}, 'back','Back');


	////////////////////
	// УГЛОВЫЕ КНОПКИ //
	////////////////////	
	// Действие
	new Button({
		position: function(width, height){
			return {
				x: game.screenWidth/2 - width/2,
				y: game.scale.cellAt(
					0,
					game.scale.numRows - game.scale.density - 1,
					0,
					5
				).y
			};
		},
		action: function(){
			connection.server.sendButtonAction(actionHandler.buttonAction);
		},
		text: 'Take',
		color: 'orange',
		name: 'action',
		size: 'wide',
		textColor: 'white',
		group: this.actionButtons
	});

	// На весь экран
	new Button({
		position: function(width, height){
			return {
				x: game.screenWidth - 15 - width,
				y: 15
			};
		},
		action: game.scale.toggleFullScreen,
		icon: 'fullscreen',
		context: game.scale,
		color: 'orange',
		name: 'fullscreen',
		size: 'small',
		group: this.cornerButtons
	});

	// Открытие меню
	new Button({
		position: function(width, height){
			return {
				x: game.screenWidth - 15 - width,
				y: game.screenHeight - 15 - height
			};
		},
		action: ui.modalManager.toggleModals.bind(ui.modalManager, 'options'),
		icon: 'menu',
		color: 'orange',
		name: 'options',
		size: 'small',
		group: this.cornerButtons
	});

	// Дебаг
	new Button({
		position: function(width, height){
			return {
				x: game.screenWidth - 30 - width*2,
				y: game.screenHeight - 15 - height
			};
		},
		action: ui.modalManager.toggleModals.bind(ui.modalManager, 'debug'),
		text: 'D',
		context: game,
		color: 'orange',
		name: 'debug',
		size: 'small',
		textColor: 'white',
		group: this.cornerButtons
	});
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

//@include:UILayers
//@include:Background
//@include:Button
//@include:Rope
//@include:Menu
//@include:Logo
//@include:Cursor
//@include:ModalManager
