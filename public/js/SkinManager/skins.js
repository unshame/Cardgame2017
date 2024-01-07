/**
* Скины, передаваемые в skinManager
* @type {object[]}
* @global
*/

/* exported skins */
var skins = [];

// Modern
skins.push({
	width: 140,
	height: 190,
	name: 'modern',
	friendlyName: 'Modern',
	numOfFrames: 67,
	cardbackPossibleFrames: [
		['Blue 1', 52],
		['Blue 2', 53],
		['Blue 3', 54],
		['Blue 4', 55],
		['Blue 5', 56],
		['Green 1', 57],
		['Green 2', 58],
		['Green 3', 59],
		['Green 4', 60],
		['Green 5', 61],
		['Red 1', 62],
		['Red 2', 63],
		['Red 3', 64],
		['Red 4', 65],
		['Red 5', 66]
	],
	cardbackFrame: 55,
	glowWidth: 170,
	glowHeight: 220,
	trumpOffset: 33,
	trailWidth: 35,
	trailHeight: 35
});

// Familiar
/*skins.push({
	width: 390,
	height: 570,
	name: 'familiar',
	numOfFrames: 52,
	cardbackPossibleFrames: [51],
	glowWidth: 170,
	glowHeight: 238,
	scale: 0.4,
	trumpOffset: 90,
	trailWidth: 35,
	trailHeight: 35
});*/

// Classic
skins.push({
	color: 0x874A36,
	background: 'wood_dark',
	width: 150,
	height: 218,
	name: 'classic',
	friendlyName: 'Classic',
	numOfFrames: 56,
	cardbackPossibleFrames: [
		['Suits', 52],
		['Blue 1', 53],
		['Blue 2', 54],
		['Blue 3', 55]
	],
	cardbackFrame: 54,
	glowWidth: 170,
	glowHeight: 220,
	trumpOffset: 32,
	trailWidth: 55,
	trailHeight: 55,
	scale: 0.9
});

/*skins.push({
	name: 'game',
	width: 441,
	height: 653,
	friendlyName: 'GoT',
	numOfFrames: 53,
	cardbackPossibleFrames: [
		['Red', 52]
	],
	cardbackFrame: 52,
	scale: 0.4,
	hasSuits: false
});*/

// Abstract
/*skins.push({
	width: 130,
	height: 202,
	name: 'abstract',
	numOfFrames: 58,
	cardbackPossibleFrames: [52, 53, 54, 55, 56, 57],
	cardbackFrame: 54,
	glowWidth: 170,
	glowHeight: 220,
	trumpOffset: 32,
	trailWidth: 35,
	trailHeight: 35,
	scale: 1
});*/

// Uno
/*skins.push({
	color: 0x68C655,
	background: 'green',
	width: 140,
	height: 196,
	name: 'uno',
	friendlyName: 'Uno',
	numOfFrames: 56,
	cardbackPossibleFrames: [
		['Uno', 54],
		['Circled U', 55]
	],
	cardbackFrame: 55,
	glowWidth: 170,
	glowHeight: 220,
	trumpOffset: 32,
	trailWidth: 35,
	trailHeight: 35,
	scale: 1,
	hasSuits: false
});
*/

// Pixel
skins.push({
	color: 0xE0E0E0,
	background: 'black',
	width: 136,
	height: 192,
	name: 'pixel',
	friendlyName: 'Pixel',
	numOfFrames: 56,
	cardbackPossibleFrames: [
		['Blue', 53],
		['Red', 52],
		['Yellow', 54],
		['Purple', 55],
	],
	cardbackFrame: 53,
	glowWidth: 148,
	glowHeight: 204,
	trumpOffset: 40,
	trailWidth: 55,
	trailHeight: 55,
	uiVignette: false
});
