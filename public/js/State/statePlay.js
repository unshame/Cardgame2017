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

window.statePlay = new State('play', {

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
		game.fixPause();

		cardControl.updateDebug();
		fieldManager.updateDebug();
		cardManager.updateDebug();		
		game.updateDebug();
	},

	/**
	* Выполняется после того, как игра обработала изменение размера экрана.
	* Обновляет размер и позицию всех модулей.
	* @memberof statePlay
	*/
	postResize: function(){

		background.updateSize();

		fieldManager.resizeFields();

		ui.updatePosition();

		cardEmitter.restart();

		document.getElementById('loading').style.display = 'none';
	},

	shutdown: function(){ 
		cardEmitter.stop();
		fieldManager.resetNetwork();
		playerManager.reset();
		ui.rope.stop();
		ui.actionButtons.getByName('action').disable();
	}
});
