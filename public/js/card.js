/*
* Конструктор карт
*/

var debugSpotValidity = true;

Card = function (options) {

	//Options
	this.options = {
		id:null,
		value:0,
		suit:null,
		skin:sm.skin,
		spotId: 'DECK'
	};
	for(o in options){
		if(options.hasOwnProperty(o))
			this.options[o] = options[o];
	}

	//Id
	this.id = this.options.id;

	//Skin
	this.skin = this.options.skin;

	//Spot
	this.spotId = this.options.spotId;
	this.spot = null;

	//Sprite
	this.sprite = game.add.sprite(0, 0, this.skin.sheetName);
	this.sprite.inputEnabled = true;
	this.sprite.events.onInputDown.add(this.mouseDown, this);
	this.sprite.events.onInputUp.add(this.mouseUp, this);
	this.sprite.events.onInputOver.add(this.mouseOver, this);
	this.sprite.events.onInputOut.add(this.mouseOut, this);
	this.sprite.anchor.set(0.5, 0.5);
	this.sprite.scale.setTo(this.skin.scale.x, this.skin.scale.y);	

	//Классический скин карт
	//this.sprite = game.add.sprite(x, y, 'cardsClassic');

	//Glow
	this.glow = game.add.sprite(0, 0, this.skin.glowName);
	this.glow.anchor.set(0.5, 0.5);
	this.glow.visible = false;

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

		this.sprite.frame =  this.skin.cardbackFrame;		
		this.isPlayable = false;
		this.sprite.input.useHandCursor = false;

		this.glowStop();
	}
	else{
		this.suit = suit;
		this.value = value;
		if(!this.sprite.visible)
			return;

		this.sprite.frame =  this.skin.firstValueFrame + suit*13 + value - 2;
		this.isPlayable = true;
		this.sprite.input.useHandCursor = true;

		this.glowStart(0.25, 0.75, 1500, 500, 0xFFFF0A)

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

Card.prototype.setSpot = function(spotId){
	this.spotId = spotId;
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

	//Убираем хвост, т.к. он отображается только при перетаскивании карты игроком
	if(controller.trail.parent == this.base && shouldRebase)
		controller.cardResetTrail(true);

	//Поднимаем карту на верх
	cardsGroup.bringToTop(this.base);

	//Останавливаем твин, если он есть
	if(this.mover){
		this.mover.stop();
		this.mover = null;
	}

	var moveX, moveY;

	//Новая позиция базы
	var newBaseX = relativeToBase ? x + this.base.x : x;
	var newBaseY = relativeToBase ? y + this.base.y : y;

	//Меняем позицию базы карты перед началом анимации
	//и меняем относительную позицию карты так, чтобы ее абсолютная позиция не менялась
	if(shouldRebase && (newBaseX != this.base.x || newBaseY != this.base.y)){

		//Мы будем двигать карту к новой позиции базы
		moveX = moveY = 0;
		var newX = this.base.x + this.sprite.x - newBaseX;
		var newY = this.base.y + this.sprite.y - newBaseY;
		this.setBase(newBaseX, newBaseY);
		this.setRelativePosition(newX, newY);
	}
	else{
		//Если база остается прежней, то двигаем карту к нужной позиции
		moveX = relativeToBase ? x : x - this.base.x;
		moveY = relativeToBase ? y : y - this.base.y;
	}

	//Создаем и запускаем твин или перемещаем карту если игра остановлена
	if(game.paused){
		this.setRelativePosition(moveX, moveY);
	}
	else{
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

		//Ресет твина по окончанию
		this.mover.onComplete.addOnce(function(){
			this.mover = null;
		}, this);
	}

}

//Плавно возвращает карту на базу
Card.prototype.returnToBase = function(time, delay){
	this.moveTo(0, 0, time || 0, delay || 0, true)
}

/* /ПЕРЕДВИЖЕНИЕ */

/* СКИН */

//Применяет текущий скин к карте
Card.prototype.applySkin = function(){
	if(!this.suit && this.suit !== 0){
		this.sprite.frame = this.skin.cardbackFrame;
	}
	else{
		this.sprite.frame =  this.skin.firstValueFrame + this.suit*13 + this.value - 2;
	}
	//stub
}

//Меняет рубашку карт на текущую
Card.prototype.applyCardback = function(){
	if(!this.suit && this.suit !== 0){
		this.sprite.frame = this.skin.cardbackFrame;
	}
}
/* /СКИН */

/* СВЕЧЕНИЕ */
//Запускает свечение
Card.prototype.glowStart = function(minGlow, maxGlow, speed, delayRange, color){
	
	this.glowReset();

	this.glow.tint = color || 0xFFFFFF;

	this.glowDecreaser = game.add.tween(this.glow);
	this.glowDecreaser.to({alpha: minGlow}, speed, Phaser.Easing.Linear.None, false, Math.floor(Math.random()*(delayRange || 0)));

	this.glowIncreaser = game.add.tween(this.glow);
	this.glowIncreaser.to({alpha: maxGlow}, speed, Phaser.Easing.Linear.None, false, Math.floor(Math.random()*(delayRange || 0)));

	this.glowIncreaser.onComplete.add(function(){
		if(this.glow.visible && this.glowDecreaser)
			this.glowDecreaser.start();
	},this)
	this.glowDecreaser.onComplete.add(function(){
		if(this.glow.visible && this.glowIncreaser)
			this.glowIncreaser.start();
	},this)
	this.glowDecreaser.start()
}

//Останавливает свечение
Card.prototype.glowStop = function(){
	if(this.glowIncreaser){
		this.glowIncreaser.stop();
		this.glowIncreaser = null;
	}
	if(this.glowDecreaser){
		this.glowDecreaser.stop();
		this.glowDecreaser = null;
	}
	if(this.glow.visible){
		this.glow.kill();
	}
}

//Останавливает и восстанавливает свечение
Card.prototype.glowReset = function(){
	this.glowStop();
	this.glow.reset();
	this.glowUpdatePosition();
}

//Обновляет позицию свечения
Card.prototype.glowUpdatePosition = function(){
	this.glow.x = this.sprite.x;
	this.glow.y = this.sprite.y;
}
/* /СВЕЧЕНИЕ */

//Вызывается при нажатии на карту
Card.prototype.mouseDown = function(sprite, pointer){
	controller.cardClick(this, pointer);
}

//Вызывается при окончании нажатия на карту
Card.prototype.mouseUp = function(sprite, pointer){
	controller.cardUnclick(this, pointer);
}

Card.prototype.mouseOver = function(sprite, pointer){
	if(!this.spot)
		return;
	this.spot.focusOnCard(this, pointer);
}

Card.prototype.mouseOut = function(sprite, pointer){
	if(!this.spot)
		return;
	this.spot.focusOffCard();
}

//Убивает спрайты карты
Card.prototype.kill = function() {
	this.glow.kill();
	this.sprite.kill();  
	if(this.spot){
		this.spot.removeCard(this);
	}
}

//Восстанавливает карту
Card.prototype.reset = function(){
	this.sprite.reset();  
	this.setValue(this.suit, this.value);
}

//Обновление карты
//В будущем вохможно будет делать что-то еще
Card.prototype.update = function() {
	this.glowUpdatePosition();
};

//party time
var ThrowCards = function(){

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
ThrowCards.prototype.stop = function(){
	if(this.emitter.on){
		this.emitter.destroy();
	}
}
