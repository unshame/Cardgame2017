//Assets
function preload () {
	game.load.image('table', 'assets/table.png');
	game.load.image('table4x', 'assets/table4x.png');
	game.load.image('table8x', 'assets/table8x.png');
	game.load.image('particle', 'assets/particle.png');
	game.load.image('spot', 'assets/spot.png');
	game.load.spritesheet('cardsClassic', 'assets/cards/classic.png', 390, 570, 52);
	game.load.spritesheet('button_grey_wide', 'assets/buttons/grey_wide.png', 190, 49, 3);

	sm = new SkinManager('modernCards');
	sm.addSkin({name: 'modernCards'});
}