window.stateMenu = new State('menu', {

	create: function(){
		cardManager.reset();
		cardEmitter.start(0, 50, 10, 2000, 20, 1);
		fieldManager.resetNetwork();
		ui.rope.stop();
		ui.actionButtons.getByName('action').disable();
		ui.testMenu.show();
	},

	update: function(){

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
	}
});
