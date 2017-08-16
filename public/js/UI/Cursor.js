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
	* @param Cursor#inGame
	* @type {boolean}
	* @default true
	*/
	this.inGame = true;

	/**
	* Инициализирован ли курсор.
	* Курсор инициализирован, если он сдвинулся с позиции `{x: 0, y: 0}`.
	* @param Cursor#initialized
	* @type {boolean}
	* @default false
	*/
	this.initialized = false;

	/**
	* Элемент над которым находится курсор.
	* @type {DisplayElement}
	*/
	this.overlappingElement = null;

	this.name = 'cursor';

	game.add.existing(this);

	document.body.addEventListener('mouseleave', this.update.bind(this, false));
	document.body.addEventListener('mouseenter', this.update.bind(this, true));

};

extend(Cursor, Phaser.Sprite);

/**
* Обновляет позицию и внешний вид курсора.
* @param {boolean} [cursorinGame=Cursor#inGame] находится ли уазатель пользователя в окне
* @param {boolean} [noOverlapCheck]             курсор считает что находится над элементом без проверки
*/
Cursor.prototype.update = function(cursorinGame, noOverlapCheck){

	if(!Phaser.Device.desktop)
		return;

	this.initialized = game.input.x !== 0 || game.input.y !== 0;

	if(cursorinGame !== undefined){
		this.inGame = cursorinGame;
	}

	if((!this.inGame || game.paused || !this.initialized) && this.alive){
		this.kill();
		game.canvas.style.cursor = "default";
	}
	else if(this.inGame && !game.paused && this.initialized && !this.alive){
		this.reset();
	}
	if(!this.inGame || game.paused || !this.initialized)
		return;

	game.canvas.style.cursor = "none";
	this.x = game.input.x;
	this.y = game.input.y;

	// Курсор перетаскивает карту
	// меняем его на сжатую руку
	if(cardControl.card){
		this.x -= this.width/2;
		this.y -= this.height/2;
		this.frame = 2;
		return;
	}

	// Если курсор над картой или элементом интерфейса,
	// меняем его на указатель
	if(noOverlapCheck || this.overlappingElement && this.overlappingElement.cursorIsOver()){
		this.x -= this.width*0.41;
		this.frame = 1;
		return;
	}
	else{
		this.overlappingElement = null;
	}

	// Курсор не над чем не находится
	this.frame = 0;
};

/**
* Запоминает объект над которым находится курсор и обновляет курсор.
* @param {DisplayObject} el элемент над которым находится курсор
*/
Cursor.prototype.updateOverlap = function(el){
	if(this.overlappingElement != el){
		this.overlappingElement = el;
		this.update(undefined, true);
	}
};
