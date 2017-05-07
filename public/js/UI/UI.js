/**
 * Менеджер интерфейса.
 * Создает и обновляет позиции всех элементов интерфейса: кнопки, курсор и таймер.
 * Создает менеджер слоев интерфейса {@link UILayers} и добавляет элементы интерфейса, 
 * а также существующие группы в него:
 * `fieldManager.fieldsGroup` `cardManager.cardsGroup` `cardManager.emitter`.
 * Также, переключает полноэкранный режим {@link UI#toggleFullScreen}.
 *  
 * @class
 * @extends {Phaser.Group}
 */

var UI = function(){

	this.actionButtons = null;
	this.cornerButtons = null;

	this.cursor = null;

	this.colors = {
		orange: 0xFF8300,
		green: 0x68C655,
		red: 0xC93F3F,
		white: 0xFFFFFF
	};

	/*
	 * Менеджер "слоев" элементов интерфейса
	 * @type {UILayers}
	 */
	this.layers = new UILayers();
}

UI.prototype.initialize = function(){

	//Таймер хода
	this.rope = this.layers.addExistingLayer(new Rope(), -3);
	
	//Кнопки
	this.addButtons();

	/**
	 * Курсор
	 * @type {Cursor}
	 * @global
	 */
	this.cursor = this.layers.addExistingLayer(new Cursor('cursor_orange'), -1);

	this.layers.addExistingLayer(fieldManager.fieldsGroup, 2);
	this.layers.addExistingLayer(cardManager.cardsGroup, 3);
	this.layers.addExistingLayer(cardManager.emitter, 4);

	this.layers.positionLayers();
}

UI.prototype.addButtons = function(){
	this.actionButtons = this.layers.addLayer(1, 'actionButtons');
	this.cornerButtons = this.layers.addLayer(-2, 'cornerButtons');

	//Кнопки (временные)
	new Button({
		position: function(width, height){
			return {
				x: game.screenWidth/2 - width/2,
				y: game.screenHeight/2 - height/2
			};
		},
		action: function(){
			connection.proxy.queueUp();
			this.hide();
		},
		text: 'Queue Up',
		name: 'queueUp',
		color: 'grey',
		size: 'wide',
		textColor: 'black',
		group: this.actionButtons
	});
	new Button({
		position: function(width, height){
			return {
				x: game.screenWidth/2 - width/2,
				y: grid.at(
					0,
					grid.numRows - grid.density - 2,
					0,
					-height/2
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
			return grid.at(
				grid.numCols - grid.density*1.5 - 1,
				grid.numRows - grid.density - 2,
				-width/2,
				-height/2
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
		action: function(){console.log('menu');},
		icon: 'menu',
		color: 'orange',
		name: 'options',
		size: 'small',
		group: this.cornerButtons
	});

	this.actionButtons.getByName('action').disable();
}

UI.prototype.updatePosition = function(){
	this.rope.maxHeight = this.rope.y = this.screenHeight;
	this.layers.positionElements();
}

UI.prototype.toggleFullScreen = function(){
	if (game.scale.isFullScreen){
		this.cornerButtons.getByName('fullscreen').label.frame = 0;
		game.shouldUpdateFast = true;
	    game.scale.stopFullScreen();
	}
	else{
		this.cornerButtons.getByName('fullscreen').label.frame = 1;
		game.shouldUpdateFast = true;
	    game.scale.startFullScreen();
	}
};

//Возвращает phaser пиксель для превращения в текстуру
UI.prototype.newPixel = function(){
	var pixel = game.make.graphics(0, 0);
	pixel.beginFill(ui.colors.white);
	pixel.drawRect(0, 0, 1, 1);
	pixel.endFill();
	return pixel;
};