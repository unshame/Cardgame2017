/**
 * Заменяет курсор на спрайт
 * @class
 */

var Cursor = function(textureName){

	Phaser.Sprite.call(this, game, -32, -32, textureName);

	this.width = this.height = 32;
	this.isInGame = true;
	this.initialized = false;
	this.name = 'cursor';

	game.add.existing(this);

	document.addEventListener('mouseleave', this.update.bind(this, false));
	document.addEventListener('mouseenter', this.update.bind(this, true));

};

Cursor.prototype = Object.create(Phaser.Sprite.prototype);
Cursor.prototype.constructor = Cursor;

//Обновление позиции и вида курсора
Cursor.prototype.update = function(cursorIsInGame){

	if(!Phaser.Device.desktop)
		return;

	this.initialized = this.unitialized || (game.input.x !== 0 || game.input.y !== 0);

	if(cursorIsInGame !== undefined)
		this.isInGame = cursorIsInGame;
	if((!this.isInGame || game.paused || !this.initialized) && this.alive){
		this.kill();
		game.canvas.style.cursor = "default";
	}
	else if(this.isInGame && !game.paused && this.initialized && !this.alive){
		this.reset();
	}
	if(!this.isInGame || game.paused || !this.initialized)
		return;
	game.canvas.style.cursor = "none";
	this.x = game.input.x;
	this.y = game.input.y;
	if(cardControl.card){
		this.x -= this.width/2;
		this.y -= this.height/2;
		this.frame = 2;
		return;
	}
	if(
		cardManager.mouseIsOverACard()
	){
		this.x -= this.width*0.41;
		this.frame = 1;
		return;
	}
	this.frame = 0;
};