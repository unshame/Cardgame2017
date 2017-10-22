/** 
* Создает кнопки.
*/
UI.prototype._createButtons = function(){
	/**
	* Кнопки игровых действий.
	* @type {external:Phaser.Group}
	*/
	this.actionButtons = this.layers.addLayer(1, 'actionButtons');

	/**
	* Угловые кнопки.
	* @type {external:Phaser.Group}
	*/
	this.cornerButtons = this.layers.addLayer(-3, 'cornerButtons');

	/**
	* Кнопки дебага.
	* @type {external:Phaser.Group}
	*/
	this.debugButtons = this.layers.addLayer(-3, 'debugButtons');

	// Действие
	actionHandler.actionButton = new UI.ButtonAltStyles({
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
			connection.server.sendButtonAction(this.serverAction);
		},
		text: 'Take',
		color: 'orange',
		name: 'action',
		size: 'big',
		textColor: 'white',
		fontSize: 50,
		mobileClickProtect: true,
		group: this.actionButtons,
		styles: [
			{key: 'button_red_big'}
		]
	});


	// УГЛОВЫЕ КНОПКИ
	// На весь экран
	new UI.Button({
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
	new UI.Button({
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

	// Ввод имени
	new UI.Button({
		position: function(width, height){
			return {
				x: game.screenWidth - 15 - width,
				y: game.screenHeight - 30 - height*2
			};
		},
		action: ui.modalManager.toggleModals.bind(ui.modalManager, 'name'),
		icon: 'account',
		color: 'orange',
		name: 'name',
		size: 'small',
		group: this.cornerButtons
	}).hide();

	// Закрыть титры
	new UI.Button({
		position: function(width, height){
			return {
				x: 15,
				y: 15
			};
		},
		action: game.state.change.bind(game.state, 'menu'),
		icon: 'close',
		textColor: 'white',
		color: 'orange',
		name: 'to_main_menu',
		size: 'small',
		group: this.cornerButtons
	}).hide();

	// Дебаг
	new UI.Button({
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
		group: this.debugButtons
	});

	// Завершение последовательности
	new UI.Button({
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
		group: this.debugButtons
	});

	if(!gameOptions.get('debug_buttons')){
		this.toggleDebugButtons();
	}
};