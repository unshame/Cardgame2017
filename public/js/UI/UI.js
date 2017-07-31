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

	// Таймер хода
	this.rope = this.layers.addExistingLayer(new Rope(), -4);
	function getScreenCenter(){
		return {
			x:game.screenWidth/2,
			y:game.screenHeight/2
		}
	}
	this.testMenu = new Menu(getScreenCenter, 5, 'testMenu');
	this.optMenu = new Menu(getScreenCenter, -2, 'optMenu');
	this.testMenu.show();
	
	// Кнопки
	this.addButtons();

	/**
	* Курсор
	* @type {Cursor}
	* @global
	*/
	this.cursor = this.layers.addExistingLayer(new Cursor('cursor_orange'), -1);

	this.layers.addExistingLayer(fieldManager.fieldsGroup, 2);
	this.layers.addExistingLayer(cardManager.cardsGroup, 3);
	this.layers.addExistingLayer(cardEmitter, 4);

	this.layers.positionLayers();
};

UI.prototype.addButtons = function(){
	this.actionButtons = this.layers.addLayer(1, 'actionButtons', true);
	this.cornerButtons = this.layers.addLayer(-3, 'cornerButtons', true);

	// Кнопки (временные)
	this.testMenu.addButton( function(){
			connection.proxy.queueUp();
			this.hide();
		},'lel','queueUp');
	this.testMenu.addButton( function(){
			this.hide();
			ui.optMenu.show();
		},'options','Options');
	this.optMenu.addButton( function(){
		var mover = game.add.tween(this.buttonsByName['CHS']);
		mover.to({			
			x: 0,
			y: 0,
			alpha:0
		}, 1000);
		mover.start();
	},'lel','NOTHING');	
	this.optMenu.addButton( function(){
		var mover = game.add.tween(this.buttonsByName['CHS']);
		mover.to({			
			x: 0,
			y: ui.optMenu.background.height,
			alpha:1
		}, 1000);
		mover.start();
	}, 'next','Next');
	this.optMenu.addButton( function(button, pointer){
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
	this.optMenu.addButton( function(){
		this.hide();
		ui.testMenu.show();
	}, 'Back','Back');
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
	new Button({
		position: function(width, height){
			return game.scale.cellAt(
				game.scale.numCols - game.scale.density*1.5 - 1,
				game.scale.numRows - game.scale.density - 1,
				-width/2,
				5
			);
		},
		action: game.toggleDebugMode,
		text: 'Debug',
		context: game,
		color: 'orange',
		name: 'debug',
		size: 'wide',
		textColor: 'white',
		group: this.actionButtons
	});

	new Button({
		position: function(width, height){
			return {
				x: game.screenWidth - 15 - width,
				y: 15
			};
		},
		action: this.toggleFullScreen,
		icon: 'fullscreen',
		context: this,
		color: 'orange',
		name: 'fullscreen',
		size: 'small',
		group: this.cornerButtons
	});
	new Button({
		position: function(width, height){
			return {
				x: game.screenWidth - 15 - width,
				y: game.screenHeight - 15 - height
			};
		},
		action: function(){
			
			if(!ui.optMenu.opened){
			ui.testMenu.hide();
			ui.optMenu.show();
			}
			else{
				ui.testMenu.show();
				ui.optMenu.hide();
			}
			
		},
		icon: 'menu',
		color: 'orange',
		name: 'options',
		size: 'small',
		group: this.cornerButtons
	});

	this.actionButtons.getByName('action').disable();
};

UI.prototype.updatePosition = function(){
	this.rope.updatePosition();
	this.layers.positionElements();
};

UI.prototype.toggleFullScreen = function(){
	game.shouldUpdateFast = true;
	if (game.scale.isFullScreen){
		this.cornerButtons.getByName('fullscreen').label.frame = 0;
		game.scale.stopFullScreen();
	}
	else{
		this.cornerButtons.getByName('fullscreen').label.frame = 1;
		game.scale.startFullScreen();
	}
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