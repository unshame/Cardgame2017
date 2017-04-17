/*
 * Конструктор карт
 * 
 * Тестовые функции:
 * throwCards - конструктор разлетающихся карт
 * getCards(num, except) - выбирает num карт из cards, пропускает карты из except
 * getCard(except) - выбирает одну карту из cards, пропускает карты из except
 */

var Card = function (options) {

	//Options
	this.options = this.getDefaultOptions();
	for(o in options){
		if(options.hasOwnProperty(o))
			this.options[o] = options[o];
	}

	this.isInDebugMode = this.options.debug;
	this.isDraggable = false;
	this.isPlayable = false;

	//Id
	this.id = this.options.id;

	//Field
	this.presetField(this.options.fieldId)
	this.field = null;

	//Sprite
	this.sprite = game.add.sprite();
	this.sprite.inputEnabled = true;
	this.sprite.events.onInputDown.add(this.mouseDown, this);
	this.sprite.events.onInputUp.add(this.mouseUp, this);
	this.sprite.events.onInputOver.add(this.mouseOver, this);
	this.sprite.events.onInputOut.add(this.mouseOut, this);
	this.sprite.anchor.set(0.5, 0.5);

	//Glow
	this.glow = game.add.sprite();
	this.glow.anchor.set(0.5, 0.5);
	this.glow.visible = false;

	//Base
	this.base = game.add.group();
	this.base.x = this.options.x;
	this.base.y = this.options.y;
	this.base.add(this.glow);
	this.base.add(this.sprite);
	game.cardsGroup.add(this.base);  

	//Tweens
	this.mover = null;
	this.rotator = null;
	this.scaler = null;
	this.flipper = null;

	this.bringToTopOn = 'never';

	//Value
	this.suit = this.options.suit;
	this.value = this.options.value;	
	this.valueChanged = false;
	this.flipTime = this.options.flipTime;

	//Skin
	this.skin = this.options.skin;
	this.applySkin();
};

//Возвращает опции по умолчанию
Card.prototype.getDefaultOptions = function(){
	var options = {
		id:null,
		x: game.screenWidth / 2,
		y: game.screenHeight + 300,
		value:0,
		suit:null,
		flipTime: 150,
		skin:skinManager.skin,
		fieldId: 'DECK',
		debug: false
	}
	return options
}


//ЗНАЧЕНИЯ

//Задает значения для установки в будущем
Card.prototype.presetValue = function(suit, value){
	if(suit === undefined)
		suit = null;

	if(
		(suit === null && this.suit === null) ||
		(suit == this.suit && value == this.value)
	)
		return;

	if(suit === null){
		this.suit = null;
		this.value = 0;
	}
	else{
		this.suit = suit;
		this.value = value;
	}
	this.valueChanged = true;
}

//Устанавливает заданные ранее значения и переворачивает карту
Card.prototype.updateValue = function(){
	if(!this.valueChanged)
		return;

	this.valueChanged = false;

	if(this.flipper){
		this.flipper.stop();
		this.flipper = null;
	}

	if(game.paused){
		this.setValue(this.suit, this.value, false);
		return;
	}

	this.flipper = game.add.tween(this.sprite.scale);
	this.flipper.to({x: 0}, this.flipTime/2);
	this.flipper.to({x: this.skin.scale.x}, this.flipTime/2);

	if(this.suit === null){
		this.flipper.onChildComplete.addOnce(function(){
			this.sprite.frame = this.skin.cardbackFrame;
		}, this);
		this.setDraggability(false);
	}
	else{
		this.flipper.onChildComplete.addOnce(function(){
			this.sprite.frame =  this.skin.firstValueFrame + this.suit*13 + this.value - 2;
		}, this)
	}
	this.flipper.start();

}

//Устанавливает значение карты сразу, с анимацией или без
Card.prototype.setValue = function(suit, value, animate){

	if(suit === undefined)
		suit = null;

	if(animate === undefined)
		animate = true;

	if(animate){
		this.presetValue(suit, value);
		this.updateValue();
	}
	else if(suit === null){
		this.suit = null;
		this.value = 0;
		this.sprite.frame = this.skin.cardbackFrame;
	}
	else{
		this.suit = suit;
		this.value = value;
		this.sprite.frame =  this.skin.firstValueFrame + this.suit*13 + this.value - 2;
	}		

}

//Устанавливает перетаскиваемость карты
Card.prototype.setDraggability = function(draggable){	
	this.isDraggable = draggable;
}

//Устанавливает, можно ли ходить этой картой
Card.prototype.setPlayability = function(playable, tint){
	if(playable){
		this.glowStart(0.25, 0.75, 1500, 500, tint || 0xFF8300)
	}
	else{
		this.glowStop();
	}
	this.isPlayable = playable;

}


//ПОЗИЦИОНИРОВАНИЕ

//Устанавливает абсолютную позицию карты
Card.prototype.setPosition = function(x, y){

	if(this.mover){
		this.mover.stop();
		this.mover = null;
	}

	this.sprite.x = x - this.base.x;
	this.sprite.y = y - this.base.y;
	this.update();
}

//Устанавливает положение карты по отношению к базе карты
Card.prototype.setRelativePosition = function(x, y){

	if(this.mover){
		this.mover.stop();
		this.mover = null;
	}

	this.sprite.x = x;
	this.sprite.y = y;
	this.update();
}

//Устанавливает позицию базы карты
Card.prototype.setBase = function(x, y){

	if(this.mover){
		this.mover.stop();
		this.mover = null;
	}

	this.sprite.x += this.base.x - x;
	this.sprite.y += this.base.y - y;
	this.base.x = x;
	this.base.y = y;
	this.update();
}

//Поднимает карту наверх, опционально поднимает перетаскиваемую карту наверх
Card.prototype.bringToTop = function(fixController){
	if(fixController == undefined)
		fixController = true;
	game.cardsGroup.bringToTop(this.base);
	if(fixController && controller.card)
		game.cardsGroup.bringToTop(controller.card.base);
}

//Запоминает id поля, в которое будет перемещена карта
//Устанавливает перетаскиваемость
Card.prototype.presetField = function(fieldId){
	this.fieldId = fieldId;
	 if(fieldId == game.pid){
		this.setDraggability(true);
	}
	else{
		this.setDraggability(false);
	}
}

Card.prototype.setAngle = function(angle){
	if(this.rotator){
		this.rotator.stop();
		this.rotator = null;
	}

	this.sprite.angle = angle;
	this.update();
}


//ПЕРЕДВИЖЕНИЕ

/*
 * Плавно перемещает карту
 * @x, y Number - позиция
 * @time Number (мс) - время перемещения
 * @delay Number (мс) - задержка перед перемещением
 * @relativeToBase Bool - перемещение происходит относительно базы карты
 * @shouldRebase Bool - нужно ли перемещать базу карты или только карту
 * Если база не изменилась, то эта переменная всегда будет false
 * @bringUpOn - когда поднимать карту на передний план ('never', 'init', 'start', 'end')
*/
Card.prototype.moveTo = function(x, y, time, delay, relativeToBase, shouldRebase, bringToTopOn){


	if(relativeToBase === undefined)
		relativeToBase = false;
	if(shouldRebase === undefined)
		shouldRebase = false;
	if(bringToTopOn === undefined || !~['never', 'init', 'start', 'end'].indexOf(bringToTopOn))
		bringToTopOn = 'init';

	this.bringToTopOn = bringToTopOn;

	if(game.paused)
		this.updateValue();

	if(this.bringToTopOn == 'init' || game.paused && this.bringToTopOn != 'never')
		this.bringToTop();

	//Куда двигать карту
	var moveX, moveY;

	//Новая позиция базы
	var newBaseX = relativeToBase ? x + this.base.x : x;
	var newBaseY = relativeToBase ? y + this.base.y : y;

	//Предупреждаем о том, что карта вышла за пределы экрана
	if(newBaseX < 0 || newBaseX > game.screenWidth || newBaseY < 0 || newBaseY > game.screenHeight)
		console.warn(
			'Moving card', this.id, 'out of the screen (' + newBaseX + ', ' + newBaseY + ')\n',
			this
		);

	//Нет смысла менять базу, если координаты не изменились
	if(shouldRebase && newBaseX == this.base.x && newBaseY == this.base.y)
		shouldRebase = false;

	//Убираем хвост, т.к. он отображается только при перетаскивании карты игроком
	//Хвост остается, если карта возвращается на базу
	if(controller.trail.parent == this.base && shouldRebase)
		controller.cardResetTrail(true);

	//Меняем позицию базы карты перед началом анимации
	//и меняем относительную позицию карты так, чтобы ее абсолютная позиция не менялась
	if(shouldRebase){

		//Мы будем двигать карту к новой позиции базы
		moveX = moveY = 0;
		var newX = this.sprite.x - (newBaseX - this.base.x);
		var newY = this.sprite.y - (newBaseY - this.base.y);
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
	else if(this.mover && !delay){
		this.mover.updateTweenData('x', moveX, -1);
		this.mover.updateTweenData('y', moveY, -1);
		this.mover.updateTweenData('duration', time, -1);
		this.updateValue();
		if(this.bringToTopOn == 'start')
			this.bringToTop();
	}
	else{
		if(this.mover)
			this.mover.stop();
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
		this.mover.onStart.addOnce(function(){
			this.updateValue();
			if(this.bringToTopOn == 'start')
				this.bringToTop();
		}, this);
		//Ресет твина по окончанию
		this.mover.onComplete.addOnce(function(){
			if(this.bringToTopOn == 'end')
				this.bringToTop();
			this.mover = null;
		}, this);
	}

}

//Плавно возвращает карту на базу
Card.prototype.returnToBase = function(time, delay){
	this.moveTo(0, 0, time || 0, delay || 0, true)
}

Card.prototype.rotateTo = function(angle, time, delay){

	//Останавливаем твин, если он есть
	if(this.rotator){
		this.rotator.stop();
		this.rotator = null;
	}
	var offset = angle < 0 ? 360 : 0,

		angleAbs = Math.abs(angle),
		angleDiv = Math.floor(angleAbs / 360),

		oldAngle = this.sprite.angle,
		oldAngleAbs, oldAngleDiv, oldAnglePos;

	angle = Math.abs( offset - (angleAbs - angleDiv*360) );
	
	if(oldAngle > 0){
		oldAnglePos = oldAngle;
	}
	else{
		oldAngleAbs = Math.abs(oldAngle);
		oldAngleDiv = Math.floor(oldAngleAbs / 360);
		oldAnglePos = 360 - (oldAngleAbs - oldAngleDiv*360);
	}	

	if(angle == oldAnglePos)
		return;

	//Создаем и запускаем твин или поворачиваем карту если игра остановлена
	if(game.paused){
		this.setAngle(angle);
	}
	else{
		this.rotator = game.add.tween(this.sprite);
		this.rotator.to(
			{
				angle: angle
			},
			time || 0,
			Phaser.Easing.Quadratic.Out,
			true,
			delay || 0
		);

		//Ресет твина по окончанию
		this.rotator.onComplete.addOnce(function(){
			this.rotator = null;
		}, this);
	}
}


//СКИН

//Применяет текущий скин к карте
Card.prototype.applySkin = function(){
	this.sprite.loadTexture(this.skin.sheetName);
	this.sprite.scale.setTo(this.skin.scale.x, this.skin.scale.y);
	this.glow.loadTexture(this.skin.glowSheetName);
	this.glow.scale.setTo(this.skin.scale.x, this.skin.scale.y);
	this.setValue(this.suit, this.value, false);
}

//Меняет рубашку карт на текущую
Card.prototype.applyCardback = function(){
	if(!this.suit && this.suit !== 0){
		this.sprite.frame = this.skin.cardbackFrame;
	}
}


//СВЕЧЕНИЕ

//Запускает свечение
Card.prototype.glowStart = function(minGlow, maxGlow, speed, delayRange, color){
	
	this.glowReset();

	this.glow.tint = color || 0xFFFFFF;

	if(game.paused)
		return;

	this.glowDecreaser = game.add.tween(this.glow);
	this.glowDecreaser.to(
		{alpha: minGlow}, 
		speed, 
		Phaser.Easing.Linear.None, 
		false, 
		Math.floor(Math.random()*(delayRange || 0))
	);

	this.glowIncreaser = game.add.tween(this.glow);
	this.glowIncreaser.to(
		{alpha: maxGlow},
		speed, 
		Phaser.Easing.Linear.None, 
		false, 
		Math.floor(Math.random()*(delayRange || 0))
	);

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
	this.glow.scale.setTo(this.sprite.scale.x, this.sprite.scale.y)
	this.glow.angle = this.sprite.angle;
}


//СОБЫТИЯ

//Вызывается при нажатии на карту
Card.prototype.mouseDown = function(sprite, pointer){
	controller.cardClick(this, pointer);
}

//Вызывается при окончании нажатия на карту
Card.prototype.mouseUp = function(sprite, pointer){
	controller.cardUnclick(this, pointer);
}

//Вызывается при наведении на карту
Card.prototype.mouseOver = function(sprite, pointer){
	if(this.field)
		this.field.focusOnCard(this, pointer);
}

//Вызывается когда курсор покидает спрайт карты
Card.prototype.mouseOut = function(sprite, pointer){
	if(this.field)
		this.field.focusOffCard(this);
}


//БУЛЕВЫ ФУНКЦИИ
Card.prototype.mouseIsOver = function(){
	return this.sprite.input.pointerOver();
}


//KILL, RESET, UPDATE

//Убивает спрайты карты
Card.prototype.kill = function() {
	this.glow.kill();
	this.sprite.kill();  
	if(this.field){
		this.field.removeCard(this);
	}
}

//Восстанавливает карту
Card.prototype.reset = function(){
	this.sprite.reset();  
	this.setValue(this.suit, this.value, false);
}

//Обновление карты
//В будущем возможно будет делать что-то еще
Card.prototype.update = function() {
	this.glowUpdatePosition();
};

//Обновляет позицию текста карты
Card.prototype.updateDebug = function(){
	if(!this.isInDebugMode)
		return;

	var x = this.base.x + this.sprite.x - this.skin.width/2;
	var y = this.base.y + this.sprite.y + this.skin.height/2 + 12;
	if(this.suit || this.suit === 0)
		game.debug.text(
			getSuitStrings('EN')[this.suit] + ' ' + cardValueToString(this.value, 'EN'),
			x, 
			y 
		);
}


//ТЕСТОВЫЕ ФУНКЦИИ

//Party time
var ThrowCards = function(){

	this.emitter = game.add.emitter(game.world.centerX, 200, 200);

	var frames = [];
	for(var i = 0; i < 52; i++){
		frames.push(i)
	}
	this.emitter.makeParticles(skinManager.skin.sheetName, frames);

	this.emitter.start(false, 5000, 20);
	this.emitter.width = game.screenWidth;
	this.emitter.height = game.screenHeight;

	game.world.bringToTop(this.emitter)
}
ThrowCards.prototype.stop = function(){
	if(this.emitter.on){
		this.emitter.destroy();
	}
}

//Возвращает несколько карт в массиве
//Если не указать num, возвратит все карты
function getCards(num, except){
	if(!num)
		num = Infinity;
	var crds = [];
	for(var ci in game.cards){
		if(!game.cards.hasOwnProperty(ci) || except && except.length && ~except.indexOf(game.cards[ci]))
			continue;
		if(num-- <= 0)
			break
		crds.push(game.cards[ci]);
	}
	return crds
}

//Возвращает одну карту, которая не входит в except
function getCard(except){
	var card = getCards(1, except);
	if(card.length)
		card = card[0]
	else
		card = null;
	return card
}