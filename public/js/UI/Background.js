/**
* Фоновый слой игры
* @class
* @extends {Phaser.Group}
*/

var Background = function(){
	Phaser.Group.call(this, game);
	this.name = 'background';

	this.textures = [
		'blue',
		'green',
		'black',
		'assault',
		'wood_light',
		'wood_dark'
	];

	this.surface = game.add.tileSprite(0, 0, game.screenWidth, game.screenHeight, skinManager.skin.background);
	this.surface.name = 'surface';
	this.surface.textureName = skinManager.skin.background;
	this.add(this.surface);
};

Background.prototype = Object.create(Phaser.Group.prototype);
Background.prototype.constructor = Background;

Background.prototype.updatePosition = function(){
	this.surface.width = game.screenWidth;
	this.surface.height =  game.screenHeight;
};

Background.prototype.setTexture = function(textureName){
	if(textureName == this.surface.textureName)
		return;
	var fakebg = game.add.tileSprite(0, 0, game.screenWidth, game.screenHeight, this.surface.textureName);
	this.addChildAt(fakebg, 1);
	this.surface.loadTexture(textureName);
	this.surface.textureName = textureName;
	var transition = game.add.tween(fakebg.position);

	var position = [
		{y: -game.screenHeight},
		{y: game.screenHeight},
		{x: -game.screenWidth},
		{x: game.screenWidth}
	][ Math.floor(Math.random()*4) ];
	
	transition.to(position, 2000, Phaser.Easing.Bounce.Out);
	transition.onComplete.addOnce(function(){
		fakebg.destroy();
	});
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