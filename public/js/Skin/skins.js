//Скины, передаваемые в skinManager

window.skins = [];

//Modern
skins.push({
	name: 'modern'
});

//Familiar
skins.push({
	width: 390,
	height: 570,
	name: 'familiar',
	numOfFrames: 52,
	cardbackPossibleFrames: [51],
	cardbackFrame: 51,
	glowHeight: 238,
	scaleX: 0.4,
	scaleY: 0.4,
	trumpOffset: 90
});

//Classic
skins.push({
	width: 150,
	height: 218,
	name: 'classic',
	numOfFrames: 53,
	cardbackPossibleFrames: [52],
	cardbackFrame: 52,
	trumpOffset: 32,
	trailWidth: 55,
	trailHeight: 55,
	scaleX: 0.9,
	scaleY: 0.9
});