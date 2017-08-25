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
		game.state.change('queue');
		connection.proxy.quickQueueUpClient();
	}, 'quickGame','Quick Game');

	this.menus.main.addButton(function(){
	}, 'custom','Create Game');

	this.menus.main.addButton(function(){
	}, 'join','Join Game');

	// Опции
	this.menus.main.addButton(function(){
		ui.modalManager.openModal('options');
	}, 'options','Options');

	this.menus.main.addButton(function(){
		game.state.change('credits');
	}, 'credits','Credits');



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


	this.menus.endGame.addButton(function(){
		connection.proxy.recieveCompleteAction({type: 'ACCEPT'});
		this.fadeOut();
	}, 'rematch','Rematch');

	this.menus.endGame.addButton(function(){
		connection.proxy.recieveCompleteAction({type: 'DECLINE'});
		this.fadeOut();
	}, 'quit_game','Quit');


	this.menus.queue.addButton(function(){
		connection.server.disconnect();
	}, 'leave_queue','Leave Queue');


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
		fontSize: 60,
		group: this.actionButtons
	});


	////////////////////
	// УГЛОВЫЕ КНОПКИ //
	////////////////////	
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