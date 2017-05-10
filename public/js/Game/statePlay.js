/**
* Основное состояние игры.  
* Предоставляет движку функции, которые выполняются при загрузке, создании
* и обновлении игрового цикла.  
* Добавляется в `game.state`.  
* @namespace statePlay
* @see  {@link http://phaser.io/docs/2.6.2/Phaser.State.html|Phaser.State}
* @see  {@link http://phaser.io/docs/2.6.2/Phaser.StateManager.html|Phaser.StateManager}
*/

window.statePlay = {

	/**
	* Название состояния.
	* @default 'play'
	* @memberof statePlay
	*/
	key: 'play',

	/**
	* Выполняется после соединения с сервером, инициализирует игру.
	* @memberof statePlay
	*/
	create: function(){
		game.initialize();
	},

	/**
	* Выполняется каждый кадр игры между preUpdate и postUpdate элементов игры.
	* Обновляет состояние элементов игры, которые не обновляются игрой автоматически.
	* @memberof statePlay
	*/
	update: function(){
		cardControl.update();
		cardManager.update();
	},

	/**
	* Выполняется каждый кадр игры после рендера всех элементов игры.
	* Выводит дебаг информацию.
	* @memberof statePlay
	*/
	render: function(){
		if(game.stage.disableVisibilityChange && game.paused)
			game.paused = false;

		cardControl.updateDebug();
		fieldManager.updateDebug();
		cardManager.updateDebug();

		if(game.inDebugMode)
			game.debug.text(game.time.fps, 2, 14, "#00ff00");
	},

	/**
	* Выполняется после того, как игра обработала изменение размера экрана.
	* Обновляет размер и позицию всех модулей.
	* @memberof statePlay
	*/
	postResize: function(){
		game.scale.setGameSize(game.screenWidth, game.screenHeight);

		background.updateSize();

		grid.draw();

		fieldManager.resizeFields();

		ui.updatePosition();

		if(cardManager.emitter.on)
			cardManager.throwCardsStart();

		document.getElementById('loading').style.display = 'none';
	}
};
