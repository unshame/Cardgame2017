/**
* Состояние процесса игры.
* Обновляет все игровые элементы.  
* Синхронное состояние.
* @namespace statePlay
* @property {string} key='play' Название состояния.
* @see {@link State}
* @see {@link StateManager}
*/

/* exported statePlay */
var statePlay = new State('play', {

	/**
	* Обновляет состояние элементов игры, которые не обновляются игрой автоматически.
	* @memberof statePlay
	*/
	update: function(){
		cardControl.update();
		cardManager.update();
	},

	/**
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
	* Обновляет размер и позицию всех элементов игры.
	* @memberof statePlay
	*/
	postResize: function(){
		ui.background.updateSize();
		fieldManager.resizeFields();
		ui.updatePosition();
		cardEmitter.restart();
		feed.shiftMessages();
		eventFeed.shiftMessages();
		announcer.shiftMessages();
		document.getElementById('loading').style.display = 'none';
	},

	/**
	* Применяет текущий скин ко всем элементам игры
	* @memberof statePlay
	*/
	applySkin: function(){
		cardManager.applySkin();
		cardEmitter.applySkin();
		cardControl.trailApplySkin();
		fieldManager.applySkin();
		actionHandler.highlightPossibleActions();
		ui.background.setTexture(skinManager.skin.background);
	},

	/**
	* Исправляет элементы игры, которые могли перестать обновляться,
	* когда игра была поставлена на паузу.
	* @memberof statePlay
	*/
	resumed: function(){
		actionHandler.highlightPossibleActions();
		fieldManager.rotateCards();
		fieldManager.zAlignCards();
		cardManager.forceApplyValues();
	},

	/**
	* Показывает кнопку действия.
	* @memberof statePlay
	*/
	create: function(){
		ui.actionButtons.getByName('action').show();
		ui.actionButtons.getByName('action').disable();
	},

	/**
	* Ресетит все игровые модули по окончанию игры, прячет кнопку действия.
	* @memberof statePlay
	*/
	shutdown: function(){ 
		gameSeq.finish();
		eventFeed.clear();
		announcer.clear();
		cardControl.reset();
		cardManager.reset();
		cardEmitter.stop();
		fieldManager.resetNetwork();
		playerManager.reset();
		ui.rope.stop();
		ui.actionButtons.getByName('action').disable();
		ui.actionButtons.getByName('action').hide();
	}
});
