//Assets
function preload () {
	game.load.image('table', 'assets/table.png');
	game.load.image('table4x', 'assets/table4x.png');
	game.load.image('table8x', 'assets/table8x.png');
	game.load.image('particle', 'assets/particle.png');
	game.load.image('spot', 'assets/spot.png');
	game.load.spritesheet('button_grey_wide', 'assets/buttons/grey_wide.png', 190, 49, 3);

	sm = new SkinManager('cardsClassic');
	sm.addSkin({name: 'modernCards'});
	var options = {
		width: 390,
		height: 750,
		name: 'cardsFamiliar',
		sheetPath: 'assets/cards/familiar.png',
		numOfFrames: 52,
		cardbackPossibleFrames: [51],
		cardbackFrame: 51,
		scaleX: 0.5,
		scaleY: 0.5,
		trumpOffset: 35
	}
	sm.addSkin(options);
	options = {
		width: 150,
		height: 218,
		name: 'cardsClassic',
		sheetPath: 'assets/cards/classic.png',
		numOfFrames: 53,
		cardbackPossibleFrames: [52],
		cardbackFrame: 52,
		trumpOffset: 32
	}
	sm.addSkin(options);
}