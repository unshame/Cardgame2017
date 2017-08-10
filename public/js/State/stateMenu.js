/**
* Состояние игры, отвечающее за отображение главного меню игры.  
* Синхронное состояние.
* @namespace stateMenu
* @property {string} key='menu' Название состояния.
* @see {@link State}
* @see {@link StateManager}
*/

/* exported stateMenu */
var stateMenu = new State('menu', {

	/**
	* Выводит дебаг информацию.
	* @memberof stateMenu
	*/
	render: function(){
		game.fixPause();
		game.updateDebug();
	},

	/**
	* Обновляет размер и позицию всех элементов игры.
	* @memberof stateMenu
	*/
	postResize: function(){
		ui.background.updateSize();
		fieldManager.resizeFields();
		ui.updatePosition();
		cardEmitter.restart();
		feed.shiftMessages();
		document.getElementById('loading').style.display = 'none';
	},

	/**
	* Применяет текущий скин ко всем элементам игры
	* @memberof stateMenu
	*/
	applySkin: function(){
		cardEmitter.applySkin();
		ui.background.setTexture(skinManager.skin.background);
	},

	/**
	* Включает эмиттер карт, показывает главное меню и лого.
	* @memberof stateMenu
	*/
	create: function(){
		cardEmitter.start(0, 50, 10, 2000, 20, 1);
		ui.testMenu.show();
		ui.logo.visible = true;
	},

	/**
	* Отключает эмиттер карт, прячет главное меню и лого.
	* @memberof stateMenu
	*/
	shutdown: function(){
		cardEmitter.stop();
		ui.testMenu.hide();
		ui.logo.visible = false;
	}
});
