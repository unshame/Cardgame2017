/*
* Конструктор карт
*/

var debugSpotValidity = true;

Card = function (options) {

	//Options
	this.options = {
		id:null,
		value:0,
		suit:null
	};
	for(o in options){
		if(options.hasOwnProperty(o))
			this.options[o] = options[o];
	}

	//Id
	this.id = this.options.id;

	this.spot = null;

	//Sprite
	this.sprite = game.add.sprite(0, 0, 'cardsModern');
	this.sprite.inputEnabled = true;
	this.sprite.events.onInputDown.add(this.mouseDown, this);
	this.sprite.events.onInputUp.add(this.mouseUp, this);
	this.sprite.anchor.set(0.5, 0.5);

	//Классический скин карт
	//this.sprite = game.add.sprite(x, y, 'cardsClassic');
	//this.sprite.scale.setTo(0.5, 0.5);	

	//Glow
	this.glow = game.add.sprite(0, 0, 'glow');
	this.glow.anchor.set(0.5, 0.5);
	this.glow.tint = 0xFFFF0A;
	this.glowDelayRange = 500;
	this.glow.visible = false;

	this.glowOff = game.add.tween(this.glow);
	this.glowOff.to({alpha: 0.25}, 1500, Phaser.Easing.Linear.None, false, Math.floor(Math.random()*this.glowDelayRange));

	this.glowOn = game.add.tween(this.glow);
	this.glowOn.to({alpha: 0.75}, 1500, Phaser.Easing.Linear.None, false, Math.floor(Math.random()*this.glowDelayRange));

	this.glowOn.onComplete.add(function(){
		if(this.glow.visible)
			this.glowOff.start();
	},this)
	this.glowOff.onComplete.add(function(){
		if(this.glow.visible)
			this.glowOn.start();
	},this)

	//Base
	this.base = game.add.group();
	this.base.x = screenWidth/2;
	this.base.y = screenHeight + 300;
	this.base.add(this.glow);
	this.base.add(this.sprite);
	cardsGroup.add(this.base);  

	//Value
	this.setValue(this.options.suit, this.options.value);
};

//Устанавливает значение карты 
Card.prototype.setValue = function(suit, value){
	if(suit === null || suit === undefined){
		this.suit = null;
		this.value = 0;
		if(!this.sprite.visible)
			return;

		this.sprite.frame =  55;		
		this.isPlayable = false;
		this.sprite.input.useHandCursor = false;

		if(this.glow.visible)
			this.glow.visible = false;
	}
	else{
		this.suit = suit;
		this.value = value;
		if(!this.sprite.visible)
			return;

		this.sprite.frame =  suit*13+value-2;
		this.isPlayable = true;
		this.sprite.input.useHandCursor = true;

		if(!this.glow.visible){
			this.glow.visible = true;
			this.glowOff.start();
		}

		cardsGroup.bringToTop(this.base);
		if(controller.card){
			cardsGroup.bringToTop(controller.card.base);
		}
	}
}

/* ПОЗИЦИОНИРОВАНИЕ */

//Устанавливает абсолютную позицию карты
Card.prototype.setPosition = function(x, y){
	this.sprite.x = x - this.base.x;
	this.sprite.y = y - this.base.y;
	this.update();
}

//Устанавливает положение карты по отношению к базе карты
Card.prototype.setRelativePosition = function(x, y){
	this.sprite.x = x;
	this.sprite.y = y;
	this.update();
}

//Устанавливает позицию базы карты
Card.prototype.setBase = function(x, y){
	this.base.x = x;
	this.base.y = y;
	this.update();
}

/* /ПОЗИЦИОНИРОВАНИЕ */

/* ПЕРЕДВИЖЕНИЕ */

/*
 * Плавно перемещает карту
 * @x, y Number - позиция
 * @time Number (мс) - время перемещения
 * @delay Number (мс) - задержка перед перемещением
 * @relativeToBase Bool - перемещение происходит относительно базы карты
 * @shouldRebase Bool - нужно ли перемещать базу карты или только карту
*/
Card.prototype.moveTo = function(x, y, time, delay, relativeToBase, shouldRebase){

	relativeToBase = relativeToBase || false;
	shouldRebase = shouldRebase || false;

	//Останавливаем твин, если он есть
	if(this.mover){
		this.mover.stop();
		this.mover = null;
	}

	var moveX, moveY;

	//Меняем позицию базы карты перед началом анимации
	//и меняем относительную позицию карты так, чтобы ее абсолютная позиция не менялась
	if(shouldRebase){

		//Мы будем двигать карту к новой позиции базы
		moveX = moveY = 0;
		
		var newBaseX = relativeToBase ? x + this.base.x : x;
		var newBaseY = relativeToBase ? y + this.base.y : y;
		var newX = this.base.x + this.sprite.x - newBaseX;
		var newY = this.base.y + this.sprite.y - newBaseY;
		this.setBase(newBaseX, newBaseY);
		this.setRelativePosition(newX,newY);
	}
	else{
		//Если база остается прежней, то двигаем карту к нужной позиции
		moveX = relativeToBase ? x : x - this.base.x;
		moveY = relativeToBase ? y : y - this.base.y;
	}

	//Создаем и запускаем твин
	this.mover = game.add.tween(this.sprite);
	this.mover.to(
		{
			x: moveX,
			y: moveY
		},
		time || 0,
		Phaser.Easing.Quadratic.Out,
		true,
		delay || 0
	);
	this.mover.onComplete.addOnce(function(){
		this.mover = null;
	}, this);
}

//Плавно возвращает карту на базу
Card.prototype.returnToBase = function(time, delay){
	this.moveTo(0, 0, time || 0, delay || 0, true)
}

/* /ПЕРЕДВИЖЕНИЕ */

//Вызывается при нажатии на карту
Card.prototype.mouseDown = function(sprite, pointer){
	controller.cardClick(this, pointer);
}

//Вызывается при окончании нажатия на карту
Card.prototype.mouseUp = function(sprite, pointer){
	controller.cardUnclick(this, pointer);
}

//Убивает спрайты карты
Card.prototype.kill = function() {
	this.glow.kill();
	this.sprite.kill();  
}

//Восстанавливает карту
Card.prototype.reset = function(){
	this.sprite.reset();  
	this.setValue(this.suit, this.value);
}

//Обновляет позицию свечения
Card.prototype.update = function() {
	this.glow.x = this.sprite.x;
	this.glow.y = this.sprite.y;
};

//party time
var throwCards = function(){

	this.emitter = game.add.emitter(game.world.centerX, 200, 200);

	var frames = [];
	for(var i = 0; i < 52; i++){
		frames.push(i)
	}
	this.emitter.makeParticles('cardsModern', frames);

	this.emitter.start(false, 5000, 20);
	this.emitter.width = screenWidth;
	this.emitter.height = screenHeight;

	game.world.bringToTop(this.emitter)
}
throwCards.prototype.stop = function(){
	if(this.emitter.on){
		this.emitter.destroy();
	}
}
