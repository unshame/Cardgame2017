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
	numOfFrames: 67,
	cardbackPossibleFrames: [53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66],
	cardbackFrame: 55,
	glowWidth: 170,
	glowHeight: 220,
	trumpOffset: 33,
	trailWidth: 35,
	trailHeight: 35
});

// Familiar
skins.push({
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
});

// Classic
skins.push({
	color: 0x874A36,
	background: 'wood_dark',
	width: 150,
	height: 218,
	name: 'classic',
	numOfFrames: 56,
	cardbackPossibleFrames: [52, 53, 54, 55],
	cardbackFrame: 54,
	glowWidth: 170,
	glowHeight: 220,
	trumpOffset: 32,
	trailWidth: 55,
	trailHeight: 55,
	scale: 0.9
});

// Abstract
skins.push({
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
});

// Uno
skins.push({
	color: 0x68C655,
	background: 'green',
	width: 140,
	height: 196,
	name: 'uno',
	numOfFrames: 56,
	cardbackPossibleFrames: [53, 55],
	cardbackFrame: 55,
	glowWidth: 170,
	glowHeight: 220,
	trumpOffset: 32,
	trailWidth: 35,
	trailHeight: 35,
	scale: 1,
	hasSuits: false
});
