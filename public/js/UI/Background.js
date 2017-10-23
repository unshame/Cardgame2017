/**
* Фоновый слой игры
* @class
* @extends {external:Phaser.Group}
*/
UI.Background = function(){
	Phaser.Group.call(this, game);
	this.name = 'background';
	this.offset = 40;
	this.namedTextures = {
		'blue': 'Blue',
		'green': 'Green',
		'wood_dark': 'Wood Dark',
		'wood_light': 'Wood Light',
		'black': 'Black'
	};
	this.textures = [];
	for(var key in this.namedTextures){
		if(this.namedTextures.hasOwnProperty(key)){
			this.textures.push(key);
		}
	}
	var textureName = gameOptions.get('appearance_background');
	if(!~this.textures.indexOf(textureName)){
		textureName = skinManager.skin.background;
	}
	this.surface = game.add.tileSprite(-this.offset/2, -this.offset/2, game.screenWidth + this.offset, game.screenHeight + this.offset, textureName);
	this.surface.name = 'surface';
	this.surface.textureName = textureName;

	this.vignette = game.make.image(0, 0, 'vignette');
	this.vignette.width = game.screenWidth;
	this.vignette.height =  game.screenHeight;

	this.add(this.surface);
	this.add(this.vignette);

	if(!gameOptions.get('ui_vignette')){
		this.vignette.visible = false;
	}
};

extend(UI.Background, Phaser.Group);

UI.Background.prototype.updatePosition = function(){
	this.surface.width = game.screenWidth + this.offset;
	this.surface.height =  game.screenHeight + this.offset;
	this.vignette.width = game.screenWidth;
	this.vignette.height =  game.screenHeight;
};

UI.Background.prototype.setTexture = function(textureName){
	if(textureName == this.surface.textureName){
		return;
	}
	var fakebg = game.add.tileSprite(this.surface.x, this.surface.y, this.surface.width, this.surface.height, this.surface.textureName);
	this.addChildAt(fakebg, 1);
	this.surface.loadTexture(textureName);
	this.surface.textureName = textureName;
	gameOptions.set('appearance_background', textureName);
	gameOptions.save();
	var transition = game.add.tween(fakebg.position);

	var position = [
		{y: -game.screenHeight - this.offset*2},
		{y: game.screenHeight + this.offset*2},
		{x: -game.screenWidth - this.offset*2},
		{x: game.screenWidth + this.offset*2}
	][ Math.floor(Math.random()*4) ];
	
	transition.to(position, 2000, Phaser.Easing.Bounce.Out);
	transition.onComplete.addOnce(function(){
		fakebg.destroy();
	});
	transition.start();

	ui.menus.options.getElementByName('background').setKey(this.surface.textureName, false);
};

UI.Background.prototype.nextTexture = function(){
	var ti = this.textures.indexOf(this.surface.textureName);
	ti++;
	if(!this.textures[ti]){
		ti = 0;
	}
	var textureName = this.textures[ti];
	this.setTexture(textureName);
};