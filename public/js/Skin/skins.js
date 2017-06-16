/**
* Скины, передаваемые в skinManager
* @type {object[]}
* @global
*/
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
	scale: 0.4,
	trumpOffset: 90
});

//Classic
skins.push({
	width: 150,
	height: 218,
	name: 'classic',
	numOfFrames: 54,
	cardbackPossibleFrames: [52, 53],
	cardbackFrame: 53,
	trumpOffset: 32,
	trailWidth: 55,
	trailHeight: 55,
	scale: 0.9
});

//Abstract
skins.push({
	width: 130,
	height: 202,
	name: 'abstract',
	numOfFrames: 58,
	cardbackPossibleFrames: [52, 53, 54, 55, 56, 57],
	cardbackFrame: 54,
	trumpOffset: 32,
	trailWidth: 35,
	trailHeight: 35,
	scale: 1
});

//Uno
skins.push({
	color: 0x68C655,
	width: 140,
	height: 196,
	name: 'uno',
	numOfFrames: 56,
	cardbackPossibleFrames: [53, 55],
	cardbackFrame: 55,
	trumpOffset: 32,
	trailWidth: 35,
	trailHeight: 35,
	scale: 1
});