/* exported stateCredits */
var stateCredits = new State('credits', {

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
		//cardManager.applySkin();
		ui.updatePositions();
		document.getElementById('loading').style.display = 'none';
	},

	/**
	* Применяет текущий скин ко всем элементам игры
	* @memberof stateMenu
	*/
	applySkin: function(){
		//cardManager.applySkin();
		ui.updatePositions();
		ui.applySkin();
	},

	/**
	* Включает эмиттер карт, показывает главное меню и лого.
	* @memberof stateMenu
	*/
	create: function(){
		ui.cornerButtons.getByName('to_main_menu').show();
		ui.credits.start();
	},

	/**
	* Отключает эмиттер карт, прячет главное меню и лого.
	* @memberof stateMenu
	*/
	shutdown: function(){
		cardEmitter.applySkin();
		ui.cornerButtons.getByName('to_main_menu').hide();
		ui.credits.stop();
	}
});
