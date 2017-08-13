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
	
	this._createMenus();
	this._createButtons();

	this.layers.addExistingLayers([
		[this.background, 0],
		// this.actionButtons, 1
		[fieldManager.fieldsGroup, 2],
		[cardManager.cardsGroup, 3],
		[cardEmitter, 4],
		// this.testMenu, 5
		[this.logo, 6],
		[this.feed, 7],
		[this.eventFeed, 8],
		[this.announcer, 9],
		[this.rope, -4],
		// this.cornerButtons, -3
		// this.optMenu, -2
		[this.cursor, -1]
	]);

	this.layers.hideLayer(this.actionButtons, true);

	this.layers.positionLayers();
};

/** 
 * Создает меню.
 * @private
 */
UI.prototype._createMenus = function(){
	this.testMenu = new Menu({
		position: function(){
			return {
				x:game.screenWidth/2,
				y:game.screenHeight/2 + 150
			};
		}, 
		z: 5,
		alpha: 0.95,
		name: 'testMenu',
		texture: 'black'
	});
	this.optMenu = new Menu({
		position: function(){
			return {
				x:game.screenWidth/2,
				y:game.screenHeight/2
			};
		}, 
		z: -2,
		color: this.colors.white,
		texture: 'menu_blue',
		elementColor: 'grey',
		textColor: 'black',
		name: 'optMenu'
	});
};

/** 
 * Создает кнопки.
 * @private
 */
UI.prototype._createButtons = function(){
	/**
	 * Кнопки игровых действий.
	 * @type {Phaser.Group}
	 */
	this.actionButtons = this.layers.addLayer(1, 'actionButtons', true);

	/**
	 * Угловые кнопки.
	 * @type {Phaser.Group}
	 */
	this.cornerButtons = this.layers.addLayer(-3, 'cornerButtons', true);

	// ГЛАВНОЕ МЕНЮ
	// Поиск игры
	this.testMenu.addButton(function(){
		game.state.change('play');
		connection.proxy.queueUp();
	}, 'queueUp','Queue Up');

	// Опции
	this.testMenu.addButton(function(){
		ui.optMenu.fadeIn();
	}, 'options','Options');

	// МЕНЮ ОПЦИЙ
	// Отключение от игры
	this.optMenu.addButton(function(){
		connection.server.disconnect();
		this.fadeOut();
	}, 'disconnect','Disconnect');

	this.optMenu.hideElement('disconnect');

	this.optMenu.addButton(function(){
		var mover = game.add.tween(this.getElementByName('CHS'));
		mover.to({			
			x: 0,
			y: 0,
			alpha:0
		}, 1000);
		mover.start();
	},'lel','NOTHING');	

	this.optMenu.addButton( function(){
		var mover = game.add.tween(this.getElementByName('CHS'));
		mover.to({			
			x: 0,
			y: ui.optMenu.background.height,
			alpha:1
		}, 1000);
		mover.start();
	}, 'next','Next');

	// Смена фона
	this.optMenu.addButton(function(button, pointer){
		ui.background.nextTexture();
	},'background','Background');

	// Смена скина
	this.optMenu.addButton(function(button, pointer){
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

	this.optMenu.addButton(game.toggleDebugMode, 'debug','Debug', game);

	// Закрыть меню
	this.optMenu.addButton( function(){
		this.hide();
	}, 'Back','Back');

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
		action: function(){
			ui.optMenu.fadeToggle();
		},
		icon: 'menu',
		color: 'orange',
		name: 'options',
		size: 'small',
		group: this.cornerButtons
	});

};

/** Обновляет позиции всех элементов UI. */
UI.prototype.updatePosition = function(){
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
