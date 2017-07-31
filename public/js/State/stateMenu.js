window.stateMenu = new State('menu', {

	create: function(){
		cardEmitter.start(0, 50, 10, 2000, 20, 1);
		ui.testMenu.show();
		ui.logo.visible = true;
	},

	render: function(){
		game.fixPause();
		game.updateDebug();
	},

	postResize: function(){

		background.updateSize();

		fieldManager.resizeFields();

		ui.updatePosition();

		cardEmitter.restart();

		document.getElementById('loading').style.display = 'none';
	},

	shutdown: function(){
		cardEmitter.stop();
		ui.testMenu.hide();
		ui.logo.visible = false;
	}
});
