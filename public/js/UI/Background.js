/**
 * Фоновый слой игры
 * @class
 * @extends {Phaser.Group}
 */

var Background = function(){
	Phaser.Group.call(this, game);
	this.name = 'background';
	game.add.existing(this);
	ui.layers.addExistingLayer(this, 0);

	this.textures = [
		'blue',
		'green',
		'black',
		'assault',
		'wood_light',
		'wood_dark'
	];

	this.surface = game.add.tileSprite(0, 0, game.screenWidth, game.screenHeight, 'blue');
	this.surface.name = 'surface';
	this.surface.textureName = 'blue';
	this.add(this.surface);
};

Background.prototype = Object.create(Phaser.Group.prototype);
Background.prototype.constructor = Background;

Background.prototype.updateSize = function(){
	this.surface.width = game.screenWidth;
	this.surface.height =  game.screenHeight;
}

Background.prototype.setTexture = function(textureName){
	var fakebg = game.add.tileSprite(0, 0, game.screenWidth, game.screenHeight, this.surface.textureName);
	this.addChildAt(fakebg, 1);
	this.surface.loadTexture(textureName);
	this.surface.textureName = textureName;
	var transition = game.add.tween(fakebg.position);
	var position, i = Math.floor(Math.random()*4);
	switch(i){
	case 0:
		position = {y: -game.screenHeight};
		break;

	case 1:
		position = {y: game.screenHeight};
		break;

	case 2:
		position = {x: -game.screenWidth};
		break;

	case 3:
		position = {x: game.screenWidth};
		break;
	}
	transition.to(position, 2000, Phaser.Easing.Bounce.Out);
	transition.onComplete.addOnce(function(){
		this.destroy();
	}, fakebg);
	transition.start();
};

Background.prototype.nextTexture = function(){
	var ti = this.textures.indexOf(this.surface.textureName);
	ti++;
	if(!this.textures[ti])
		ti = 0;
	var textureName = this.textures[ti];
	this.setTexture(textureName);
};