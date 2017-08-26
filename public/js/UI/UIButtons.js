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

	// Действие
	new Button({
		position: function(width, height){
			return {
				x: game.screenWidth/2 - width/2,
				y: game.scale.cellAt(
					0,
					game.scale.numRows - game.scale.density - 2,
					0,
					20
				).y
			};
		},
		action: function(){
			connection.server.sendButtonAction(actionHandler.buttonAction);
		},
		text: 'Take',
		color: 'orange',
		name: 'action',
		size: 'big',
		textColor: 'white',
		fontSize: 50,
		mobileClickProtect: true,
		group: this.actionButtons
	});


	// УГЛОВЫЕ КНОПКИ
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

	new Button({
		position: function(width, height){
			return {
				x: 15,
				y: game.screenHeight - 15 - height
			};
		},
		action: game.state.change.bind(game.state, 'menu'),
		text: '<',
		textColor: 'white',
		color: 'orange',
		name: 'to_main_menu',
		size: 'small',
		group: this.cornerButtons
	}).hide();

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

	// Завершение последовательности
	new Button({
		position: function(width, height){
			return {
				x: game.screenWidth - 45 - width*3,
				y: game.screenHeight - 15 - height
			};
		},
		action: actionHandler.sequencer.finish.bind(actionHandler.sequencer, false),
		text: 'S',
		context: game,
		color: 'orange',
		name: 'debug',
		size: 'small',
		textColor: 'white',
		group: this.cornerButtons
	});
};