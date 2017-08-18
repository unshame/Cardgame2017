/**
* Фоновый слой игры
* @class
* @extends {external:Phaser.Group}
*/

var Background = function(){
	Phaser.Group.call(this, game);
	this.name = 'background';
	this.offset = 40;
	this.textures = [
		'blue',
		'green',
		'black',
		'assault',
		'wood_light',
		'wood_dark'
	];
	var textureName = options.get('ui_background');
	if(!~this.textures.indexOf(textureName)){
		textureName = skinManager.skin.background;
	}
	this.surface = game.add.tileSprite(-this.offset/2, -this.offset/2, game.screenWidth + this.offset, game.screenHeight + this.offset, textureName);
	this.surface.name = 'surface';
	this.surface.textureName = textureName;
	this.add(this.surface);
};

extend(Background, Phaser.Group);

Background.prototype.updatePosition = function(){
	this.surface.width = game.screenWidth + this.offset;
	this.surface.height =  game.screenHeight + this.offset;
};

Background.prototype.setTexture = function(textureName){
	if(textureName == this.surface.textureName)
		return;
	var fakebg = game.add.tileSprite(0, 0, game.screenWidth, game.screenHeight, this.surface.textureName);
	this.addChildAt(fakebg, 1);
	this.surface.loadTexture(textureName);
	this.surface.textureName = textureName;
	options.set('ui_background', textureName);
	options.save();
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