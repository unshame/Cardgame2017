/**
* Основное состояние игры.  
* Предоставляет движку функции, которые выполняются при загрузке, создании
* и обновлении игрового цикла.  
* Добавляется в `game.state`.  
* @namespace statePlay
* @property {string} key='play' Название состояния
* @see  {@link http://phaser.io/docs/2.6.2/Phaser.State.html|Phaser.State}
* @see  {@link http://phaser.io/docs/2.6.2/Phaser.StateManager.html|Phaser.StateManager}
*/

window.statePlay = {

	key: 'play',

	/**
	* Выполняется после соединения с сервером.
	* Убирает загрузочный экран.
	* @memberof statePlay
	*/
	create: function(){
		console.log('Game ready');
		ui.layers.loadLabels();
		document.getElementById('loading').style.display = 'none';
		cardManager.emitterStart(0, 50, 10, 2000, 20, 1);
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
		if(game.stage.disableVisibilityChange && game.paused && !game.pausedByViewChange){
			game.paused = false;
			if(game.inDebugMode)
				console.log('Game: unpaused forced');
		}

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
			cardManager.emitterStart();

		document.getElementById('loading').style.display = 'none';
	}
};
