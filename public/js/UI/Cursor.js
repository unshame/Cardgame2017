/**
 * Заменяет курсор на спрайт.  
 * @class
 * @extends {Phaser.Sprite}
 * @listens document.mouseleave
 * @listens document.mouseenter
 */

var Cursor = function(textureName){

	Phaser.Sprite.call(this, game, -32, -32, textureName);

	/**
	 * Ширина курсора.
	 * @param Cursor#width
	 * @type {number}
	 * @default 32
	 */
	this.width = 32;
	
	/**
	 * Высота курсора.
	 * @param Cursor#height
	 * @type {number}
	 * @default 32
	 */
	this.height = 32;

	/**
	 * Находится ли курсор внутри окна.
	 * @param Cursor#isInGame
	 * @type {boolean}
	 * @default true
	 */
	this.isInGame = true;

	/**
	 * Инициализирован ли курсор.
	 * Курсор инициализирован, если он сдвинулся с позиции `{x: 0, y: 0}`.
	 * @param Cursor#initialized
	 * @type {boolean}
	 * @default false
	 */
	this.initialized = false;

	this.name = 'cursor';

	game.add.existing(this);

	document.addEventListener('mouseleave', this.update.bind(this, false));
	document.addEventListener('mouseenter', this.update.bind(this, true));

};

Cursor.prototype = Object.create(Phaser.Sprite.prototype);
Cursor.prototype.constructor = Cursor;

/**
 * Обновляет позицию и внешний вид курсора.
 * @param  {boolean} [cursorIsInGame=Cursor#isInGame] находится ли уазатель пользователя в окне
 */
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

	//Курсор перетаскивает карту
	//меняем его на сжатую руку
	if(cardControl.card){
		this.x -= this.width/2;
		this.y -= this.height/2;
		this.frame = 2;
		return;
	}

	//Если курсор над картой или элементом интерфейса,
	//меняем его на указатель
	if(
		cardManager.cursorIsOverACard() ||
		ui.layers.cursorIsOverAnElement()
	){
		this.x -= this.width*0.41;
		this.frame = 1;
		return;
	}

	//Курсор не над чем не находится
	this.frame = 0;
};