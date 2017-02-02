window.appManager = {
	background: null,
	screenWidth: window.innerWidth,
	screenHeight: window.innerHeight
};


//Assets
function preload () {
	app.load.image('wood', 'assets/retina_wood.png');
	app.load.image('table', 'assets/pool_table.png');
	app.load.image('black', 'assets/tactile_noise.png');
	app.load.image('assault', 'assets/assault.png');
	app.load.image('particle', 'assets/particle.png');
	app.load.image('spot', 'assets/spot.png');
	app.load.spritesheet('button_grey_wide', 'assets/buttons/grey_wide.png', 190, 49, 3);

	window.skinManager = new SkinManager('modern');
	skinManager.addSkin({name: 'modern'});
	var options = {
		width: 390,
		height: 570,
		name: 'familiar',
		sheetPath: 'assets/cards/familiar.png',
		numOfFrames: 52,
		cardbackPossibleFrames: [51],
		cardbackFrame: 51,
		scaleX: 0.5,
		scaleY: 0.5,
		trumpOffset: 90
	}
	skinManager.addSkin(options);
	options = {
		width: 150,
		height: 218,
		name: 'classic',
		sheetPath: 'assets/cards/classic.png',
		numOfFrames: 53,
		cardbackPossibleFrames: [52],
		cardbackFrame: 52,
		trumpOffset: 32/*,
		scaleX: 0.9,
		scaleY: 0.9*/
	}
	skinManager.addSkin(options);
}