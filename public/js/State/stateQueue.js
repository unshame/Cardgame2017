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
		//ui.menus.options.showElement('concede');
		if(lastState != 'menu'){
			cardEmitter.start(10, 50, 10, 2000, 20, 1);
		}
		this.dotCounter = 1;
		this.lastDot = 0;
	},

	/**
	* Отключает эмиттер карт, прячет главное меню и лого.
	* @memberof stateMenu
	*/
	shutdown: function(nextState){
		//ui.menus.options.hideElement('concede');
		ui.menus.queue.fadeOut();
		ui.eventFeed.clear();
		if(nextState != 'menu'){
			cardEmitter.stop();
		}
	},

	update: function(){
		var len = ui.eventFeed.length
		var textElement = ui.eventFeed.children[len - 1];
		var now = Date.now();
		if(textElement && now - this.lastDot > 500){
			if(len > 1){
				ui.eventFeed.removeMessage(ui.eventFeed.children[len - 2]);
			}
			if(this.dotCounter > 3){
				this.dotCounter = 1;
			}
			var dots = '';
			var stod = '';
			var i = this.dotCounter;
			while(i--){
				dots += '.';
				stod = '.' + stod;
			}
			var text = dots + (textElement.savedText || textElement.text) + dots;
			if(!textElement.savedText){
				textElement.savedText = textElement.text;
			}
			textElement.setText(text);
			this.dotCounter++;
			this.lastDot = now;
		}
	}
});
