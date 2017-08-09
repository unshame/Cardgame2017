/**
* Менеджер интерфейса.
* Создает и обновляет позиции всех элементов интерфейса: кнопки, курсор и таймер.
* Создает менеджер слоев интерфейса {@link UILayers} и добавляет элементы интерфейса, 
* а также существующие группы в него:
* `fieldManager.fieldsGroup` `cardManager.cardsGroup` `cardEmitter`.
* Также, переключает полноэкранный режим {@link UI#toggleFullScreen}.
* @class
*/

var UI = function(){

	this.actionButtons = null;
	this.cornerButtons = null;

	this.cursor = null;

	this.background = null;

	this.colors = {
		orange: 0xFF8300,
		green: 0x68C655,
		red: 0xC93F3F,
		white: 0xFeFeFe,
		lightGray: 0xC6C6C6,
		lightBlue: 0x0072C4
	};

	/*
	* Менеджер "слоев" элементов интерфейса
	* @type {UILayers}
	*/
	this.layers = new UILayers();
};

UI.prototype.initialize = function(){

	/**
	* Фон
	* @type {Background}
	*/
	this.background = new Background();	

	this.logo = game.add.image(game.screenWidth/2, game.screenHeight/2 - 200, 'logo');
	this.logo.anchor.set(0.5, 0.5);
	this.logo.scale.set(0.75, 0.75);
	this.layers.addExistingLayer(this.logo, 6);

	// Таймер хода
	this.rope = this.layers.addExistingLayer(new Rope(), -4);
	
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
		color: ui.colors.white,
		texture: 'menu_blue',
		elementColor: 'grey',
		textColor: 'black',
		name: 'optMenu'
	});
	
	// Кнопки
	this.addButtons();

	/**
	* Курсор
	* @type {Cursor}
	*/
	this.cursor = this.layers.addExistingLayer(new Cursor('cursor_orange'), -1);

	this.layers.addExistingLayer(fieldManager.fieldsGroup, 2);
	this.layers.addExistingLayer(cardManager.cardsGroup, 3);
	this.layers.addExistingLayer(cardEmitter, 4);
	this.layers.addExistingLayer(feed, 7);
	this.layers.addExistingLayer(announcer, 8);

	this.layers.positionLayers();
};

UI.prototype.addButtons = function(){
	this.actionButtons = this.layers.addLayer(1, 'actionButtons', true);
	this.cornerButtons = this.layers.addLayer(-3, 'cornerButtons', true);

	// ГЛАВНОЕ МЕНЮ
	// Поиск игры
	this.testMenu.addButton(function(){
		game.state.change('play');
		connection.proxy.queueUp();
	}, 'queueUp','Queue Up');

	// Опции
	this.testMenu.addButton(function(){
		ui.optMenu.show();
	}, 'options','Options');

	// МЕНЮ ОПЦИЙ
	// Отключение от игры
	this.optMenu.addButton(function(){
		connection.server.disconnect();
		this.hide();
	}, 'disconnect','Disconnect');

	this.optMenu.addButton(function(){
		var mover = game.add.tween(this.elementsByName['CHS']);
		mover.to({			
			x: 0,
			y: 0,
			alpha:0
		}, 1000);
		mover.start();
	},'lel','NOTHING');	

	this.optMenu.addButton( function(){
		var mover = game.add.tween(this.elementsByName['CHS']);
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
			connection.server.sendRealAction(actionHandler.realAction);
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
			ui.optMenu.toggle();
		},
		icon: 'menu',
		color: 'orange',
		name: 'options',
		size: 'small',
		group: this.cornerButtons
	});

	this.actionButtons.getByName('action').hide();
};

UI.prototype.updatePosition = function(){
	this.rope.updatePosition();
	this.layers.positionElements();

	this.testMenu.update();
	this.optMenu.update();

	this.logo.position = new Phaser.Point(game.screenWidth/2, game.screenHeight/2 - 200);
};

// Возвращает phaser пиксель для превращения в текстуру
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
//@include:Cursor