var stateQueue = new State('queue', {

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
		ui.updatePositions();
		cardEmitter.restart(true);
		document.getElementById('loading').style.display = 'none';
	},

	/**
	* Применяет текущий скин ко всем элементам игры
	* @memberof stateMenu
	*/
	applySkin: function(){
		ui.updatePositions();
		cardEmitter.applySkin();
		ui.background.setTexture(skinManager.skin.background);
	},

	/**
	* Включает эмиттер карт, показывает главное меню и лого.
	* @memberof stateMenu
	*/
	create: function(lastState){
		//ui.menus.options.showElement('disconnect');
		ui.menus.queue.fadeIn();
		if(lastState != 'menu'){
			cardEmitter.start(10, 50, 10, 2000, 20, 1);
		}
	},

	/**
	* Отключает эмиттер карт, прячет главное меню и лого.
	* @memberof stateMenu
	*/
	shutdown: function(nextState){
		//ui.menus.options.hideElement('disconnect');
		ui.menus.queue.fadeOut();
		ui.eventFeed.clear();
		if(nextState != 'menu'){
			cardEmitter.stop();
		}
	}
});
