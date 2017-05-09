/**
 * Модуль, отвечающий за перетаскивание карт
 * @class
 */

var CardControl = function(isInDebugMode){

	this.isInDebugMode = isInDebugMode || false;

	this.card = null;
	this.pointer = null;

	this.trail = game.add.emitter(0, 0);
	this.trailDefaultBase = game.add.group();
	this.trail.makeParticles(skinManager.skin.trailName, 0);
	this.trailDefaultBase.name = 'trail';
	this.trailDefaultBase.add(this.trail);
	this.trail.gravity = 0;
	this.trail.lifespan = 600;
	this.trail.interval = 20;	//Свойство используется модулем, а не движком
	this.trail.maxParticles = Math.ceil(this.trail.lifespan / this.trail.interval);
	this.cardShiftDuration = 100;
	this.cardReturnTime = 200;
	this.cardClickMaxDelay = 200;

	this.cardMoveThreshold = 2;
	this.cardMaxMoveAngle = 30;
	this.inertiaHistory = [];
};

//Обрабатывает нажатие на карту
CardControl.prototype.cardClick = function(card, pointer){
	if(pointer.button == 1 || pointer.button == 4)
		console.log(card);

	if(!card.isDraggable || this.card && this.card != card || !this.card && card.field && card.field.uninteractibleTimer)
		return;

	if(this.isInDebugMode)
		console.log('Card control: Clicked', card.id);

	if(this.card){
		this.cardPutDown();
	}
	else{
		this.cardPickup(card, pointer);
	}
};

//Обрабатывает поднятие кнопки после нажатия на карту
CardControl.prototype.cardUnclick = function(card){
	if(!this.card || this.card != card)
		return;

	if(this.isInDebugMode)
		console.log('Card control: Unclicked', card.id);

	if(!this.pointer.withinGame){
		this.cardReturn();
	}
	else if(!this.cardPointerInbound() || !this.cardClickTimer || !this.pointer.isMouse){
		this.cardPutDown();
	}
};

//Поднимает карту
CardControl.prototype.cardPickup = function(card, pointer){
	if(!card){
		console.warn('Card control: cardPickup called but no Card assigned.');
		return;
	}

	this.card = card;
	this.pointer = pointer;
	
	if(!this.cardPointerInbound() || (this.pointer.isMouse && !this.pointer.leftButton.isDown)){
		this.reset('clicked out of bounds or wrong mouse button');
		return;
	}

	if(this.isInDebugMode)
		console.log('Card control: Picked up', this.card.id);

	if(this.inertiaHistory.length)
		this.inertiaHistory = [];
	this.cardLastX = this.card.sprite.x;
	this.cardLastY = this.card.sprite.y;

	this.setCardClickTimer();
	this.trailReset();
	this.card.base.addAt(this.trail, 0);
	this.card.setAngle(0);

	this.trail._frames = this.card.suit;
	this.trail.minParticleSpeed.setTo(-skinManager.skin.width, -skinManager.skin.height);
	this.trail.maxParticleSpeed.setTo(skinManager.skin.width, skinManager.skin.height);
	this.lastParticleTime = game.time.time;

	this.cardSetPathToCursor();
	game.cardsGroup.bringToTop(this.card.base);
};

//Устанавливает путь и время смещения карты к курсору
CardControl.prototype.cardSetPathToCursor = function(){

	if(this.card.mover){
		this.card.mover.stop();
		this.card.mover = null;
	}
	this.cardShiftPosition = {
		x: this.pointer.x - this.card.base.x - this.card.sprite.x,
		y: this.pointer.y - this.card.base.y - this.card.sprite.y
	};
	this.cardShiftEndTime = game.time.time + (this.cardShiftDuration/game.speed);
};

//Кладет карту
CardControl.prototype.cardPutDown = function(){

	if(!this.card){
		console.warn('Card control: cardPutDown called but no Card assigned.');
		return;
	}

	if(this.isInDebugMode)
		console.log('Card control: Putting down', this.card.id);

	var field = this.cardOnValidField();
	if(this.card.sprite.body){
		this.cardThrow();
	}
	else if(field && !this.pointer.rightButton.isDown){
		this.cardMoveToField(field);
	}
	else{
		this.cardReturn();
	}
};

//Перемещает карту в новое поле
CardControl.prototype.cardMoveToField = function(newField){

	if(!this.card){
		console.warn('Card control: cardMoveToField called but no Card assigned.');
		return;
	}

	var success = connection.server.sendAction(newField, this.card);

	if(!success){
		this.cardReturn();
		return;
	}

	this.setTrailResetTimer();

	var card = this.card;
	var field = card.field;
	this.card = null;
	this.pointer = null;

	if(newField.linkedField)
		newField = newField.linkedField;

	fieldManager.moveCards(newField, [{
		cid: card.id,
		suit: card.suit,
		value: card.value
	}], true);

	fieldManager.forEachField(function(field, si){
		field.setHighlight(false);
	});

	if(field){
		for(var ci = 0; ci < field.cards.length; ci++){
			field.cards[ci].setPlayability(false);
		}
	}
	card.setPlayability(false);
};

//Возвращает карту на базу
CardControl.prototype.cardReturn = function(){

	if(!this.card){
		console.warn('Card control: cardReturn called but no Card assigned.');
		return;
	}

	if(this.isInDebugMode)
		console.log('Card control: Returning', this.card.id, 'to base');

	this.setTrailResetTimer();

	if(this.inertiaHistory.length)
		this.inertiaHistory = [];

	var card = this.card;
	var stillInbound = this.cardPointerInbound();

	this.card = null;
	this.pointer = null;
	if(card.field){
		if(!stillInbound)
			card.field.focusedCard = null;
		card.field.placeCard(card, BRING_TO_TOP_ON.END, true);
		//card.field.setUninteractibleTimer(card.field.moveTime);
	}
	else{
		card.returnToBase(this.cardReturnTime, 0);
	}
};

CardControl.prototype.cardThrow = function(){
	var	dx = 0,
		dy = 0, 
		counted = 0,
		curTime = game.time.time;

	this.saveInertia(curTime);
	for(var i = 0; i < this.inertiaHistory.length; i++){
		if(curTime - this.inertiaHistory[i][0] < 100){
			counted++;
			dx += this.inertiaHistory[i][1];
			dy += this.inertiaHistory[i][2];
		}
	}
	dx /= counted;
	dy /= counted;
	var velMult = 40,
		angMult = 10,
		card = this.card;
	this.card = null;
	this.pointer = null;
	card.sprite.body.collideWorldBounds = true;
	card.sprite.body.velocity = {x: dx*velMult, y: dy*velMult};
	card.sprite.body.drag = {x: Math.abs(dx*velMult), y: Math.abs(dy*velMult)};
	card.sprite.body.angularVelocity = dx*angMult;
	card.sprite.body.angularDrag = Math.abs(dx*angMult);
	card.setScale(1);
	card.setDraggability(false);
	this.inertiaHistory = [];
	this.setTrailResetTimer();
	setTimeout(function(){
		card.destroy();
	}, 1000);
}

//ТАЙМЕР НАЖАТИЯ

//Запускает таймер клика по карте
CardControl.prototype.setCardClickTimer = function(){
	this.resetCardClickTimer();
	this.cardClickTimer = setTimeout(this.resetCardClickTimer.bind(this), this.cardClickMaxDelay);
};

//Обнуляет таймер клика по карте
CardControl.prototype.resetCardClickTimer = function(){
	if(this.cardClickTimer){
		clearTimeout(this.cardClickTimer);
		this.cardClickTimer = null;
	}
};


//БУЛЕВЫ ФУНКЦИИ

//Проверка нажатия на базу карты
CardControl.prototype.cardPointerInbound = function(){
	var width = this.card.field ? skinManager.skin.width*(1 + this.card.field.focusedScaleDiff) : skinManager.skin.width,
		height = this.card.field ? skinManager.skin.height*(1 + this.card.field.focusedScaleDiff) : skinManager.skin.height,
		cond = 
			this.pointer.x >= this.card.base.x - width / 2 &&
			this.pointer.x <= this.card.base.x + width / 2 &&
			this.pointer.y >= this.card.base.y - height / 2 &&
			this.pointer.y <= this.card.base.y + height / 2;
	return cond;
};

//Проверка корректности позиции карты (возащает false или поля)
CardControl.prototype.cardOnValidField = function(){
	if(!this.card.isPlayable)
		return false;

	var fields = fieldManager.forEachField(function(field, si){
		if(field.isHighlighted && field.cardIsInside(this.card, false)){
			return field;
		}
	}, this);
	if(!fields.length){
		fields = fieldManager.forEachField(function(field, si){
			if(field.isHighlighted && field.cardIsInside(this.card, false, true)){
				return field;
			}
		}, this);
	}
	if(fields.length){
		if(fields.length > 1)
			console.warn('Card control: Card is over more than 1 valid field');
		return fields[0];
	}
	return false;
};


//ХВОСТ КАРТЫ

//Смещает хвост относительно базы карты
CardControl.prototype.trailShift = function(x, y){
	this.trail.position.x += x;
	this.trail.position.y += y;
};

//Создает хвост карты при движении
CardControl.prototype.trailSpawnParticle = function(curTime){

	var	delta = curTime - this.lastParticleTime;
	if(this.lastParticleTime && delta < this.trail.interval)
		return;

	//Прибавляем интервал к последнему моменту спавна, чтобы кол-во партиклей соответствовало прошедшему времени
	//Для оптимизации ограничиваем разницу во времени
	if(delta > this.trail.interval*10)
		this.lastParticleTime += this.trail.interval*10;
	else
		this.lastParticleTime += this.trail.interval;

	var distance = this.card.sprite.position.distance({
		x: this.trail.emitX + this.trail.position.x, 
		y: this.trail.emitY + this.trail.position.y
	}, true);
	if(distance < this.cardMoveThreshold){
		this.trail.width = skinManager.skin.width - 35;
		this.trail.height = skinManager.skin.height - 35;
	}
	else{
		this.trail.width = this.trail.height = 0;
	}
	this.trail.emitX = this.card.sprite.x - this.trail.position.x;
	this.trail.emitY = this.card.sprite.y - this.trail.position.y;
	this.trail.emitParticle();
};

//Ресетит хвост карты
CardControl.prototype.trailReset = function(soft){
	this.resetTrailResetTimer();
	this.trail.forEachAlive(function(p){
		if(soft)
			p.alpha = 0;
		else{
			p.kill();
		}
	}, this);
	this.trail.position = {x: 0, y: 0};
	this.trailDefaultBase.add(this.trail);
};

CardControl.prototype.trailApplySkin = function(){
	this.trail.forEach(function(p){
		p.loadTexture(skinManager.skin.trailName);
	}, this);
};

//ТАЙМЕР РЕСЕТА ХВОСТА

CardControl.prototype.setTrailResetTimer = function(){
	this.resetTrailResetTimer();
	this.trailResetTimer = setTimeout(this.trailReset.bind(this), this.trail.lifespan);
};

CardControl.prototype.resetTrailResetTimer = function(){
	if(this.trailResetTimer){
		clearTimeout(this.trailResetTimer);
		this.trailResetTimer = null;
	}
};


//UPDATE, RESET

//Обновление позиции карты и хвоста
CardControl.prototype.updateCard = function(){
	if(!this.card)
		return;

	//Ресетим контроллер, если карта была спрятана\удалена
	if(!this.card.sprite.visible || this.card.mover){
		this.reset('card hidden or moving');
		return;
	}

	//Возвращаем карту по нажатию правой кнопки или если она была перевернута
	if(this.pointer.rightButton.isDown || !this.card.isDraggable || !this.pointer.withinGame){
		if(this.card.sprite.body)
			this.cardThrow();
		else
			this.cardReturn();
		return;
	}

	var curTime = game.time.time;

	this.updateCardPosition(curTime);
	this.updateCardAngle(curTime);
	this.trailSpawnParticle(curTime);
	if(this.cardOnValidField()){
		this.card.setScale(1);
	}
	else{
		this.card.setScale(1.1);
	}
};

//Устанавливаем позицию карты и плавно передивгаем ее к курсору
CardControl.prototype.updateCardPosition = function(curTime){
	var sTime, sP, mP;
	sTime = this.cardShiftEndTime - curTime;
	if(sTime > 0){
		sP = {
			x: Math.round(this.cardShiftPosition.x / (this.cardShiftDuration/game.speed) * sTime), 
			y: Math.round(this.cardShiftPosition.y / (this.cardShiftDuration/game.speed) * sTime)
		};
	}
	else{
		sP = {x:0, y:0};
	}
	mP = {
		x: this.pointer.x - this.card.base.x,
		y: this.pointer.y - this.card.base.y
	};
	this.card.setRelativePosition(mP.x - sP.x, mP.y - sP.y);
};

CardControl.prototype.saveInertia = function(curTime){
	var curX = this.card.sprite.x,
		curY = this.card.sprite.y,
		distance = {
			x: curX - this.cardLastX,
			y: curY - this.cardLastY
		};

	while(this.inertiaHistory.length && curTime - this.inertiaHistory[0][0] > 300) {
		this.inertiaHistory.shift();
	}
	this.inertiaHistory.push([curTime, distance.x, distance.y]);
}

//Устанавливает угол в зависимости от инерции карты
//Взято отсюда:
//https://github.com/KyleU/solitaire.gg/blob/bf67e1622048bc32abfeef2848f74f220daa384e/app/assets/javascripts/card/CardInput.js#L53
CardControl.prototype.updateCardAngle = function(curTime){

	var maxAngle = this.cardMaxMoveAngle;

	this.saveInertia(curTime);
	
	//Вычисляем угол из средней длины вектора инерции
	var totalDistance = 0;
	for(var i = 0; i < this.inertiaHistory.length; i++){
		totalDistance += this.inertiaHistory[i][1];
	}
	var angle = totalDistance / this.inertiaHistory.length / 1.25;
	if(angle !== 0){
			angle -= angle > 0 ? Math.min(angle, this.cardMoveThreshold) : Math.max(angle, -this.cardMoveThreshold);
	}
	if(angle > maxAngle) {
	  angle = maxAngle;
	}
	if(angle < -maxAngle) {
	  angle = -maxAngle;
	}
	this.card.setAngle(angle);

	this.cardLastX = this.card.sprite.x;
	this.cardLastY = this.card.sprite.y;
};

//Обновление прозрачности партиклей хвоста
CardControl.prototype.updateTrail = function(){
	if(!this.trail.countLiving() || this.trail.parent == this.trailDefaultBase)
		return;
	this.trail.forEachAlive(function(p){
		p.alpha = p.lifespan / this.trail.lifespan * 0.6;
	}, this);
};

//Обновление контроллера
CardControl.prototype.update = function(){
	this.updateCard();
	this.updateTrail();
};

//Ресет модуля
CardControl.prototype.reset = function(reason){

	if(this.isInDebugMode)
		console.log('Card control: Reset' + (reason ? ': ' + reason : ''));

	this.trailReset(true);
	this.card = null;
	this.pointer = null;
};


//ДЕБАГ

//Рисует дебаг хвоста
CardControl.prototype.updateDebug = function(){
	if(!this.isInDebugMode)
		return;

	//База хвоста
	if(!this.debugBase){
		this.debugBase = new Phaser.Rectangle() ;
	}
	var width = this.card && skinManager.skin.width || this.debugBase.width || 0;
	var height = this.card && skinManager.skin.height || this.debugBase.height || 0;
	var x = this.trail.parent.x;
	var y = this.trail.parent.y;
	this.debugBase.x = x - width/2;
	this.debugBase.y = y - height/2;
	this.debugBase.width = width;
	this.debugBase.height = height;
	game.debug.geom( this.debugBase, 'rgba(255,0,0,0.6)' ) ;

	//Визуализация максимальной скорости хвоста
	if(!this.debugSpeed){
		this.debugSpeed = new Phaser.Circle();
	}
	width = this.trail.width || 5;
	height = this.trail.height || 5;
	var diameter = game.math.distance(
		0,
		0,
		this.trail.maxParticleSpeed.x,
		this.trail.maxParticleSpeed.y
	) ;
	this.debugSpeed.x = this.trail.parent.x + this.trail.position.x + this.trail.emitX;
	this.debugSpeed.y = this.trail.parent.y + this.trail.position.y + this.trail.emitY;
	this.debugSpeed.diameter = diameter + (width + height)/2;
	game.debug.geom( this.debugSpeed, 'rgba(255,255,0,0.2)' ) ;

	//Позиция спавна последнего партикля хвоста
	if(!this.debugSpawn){
		this.debugSpawn = new Phaser.Rectangle() ;
	}
	this.debugSpawn.x = this.trail.parent.x + this.trail.position.x + this.trail.emitX - width/2;
	this.debugSpawn.y = this.trail.parent.y + this.trail.position.y + this.trail.emitY - height/2;
	this.debugSpawn.width = width;
	this.debugSpawn.height = height;
	game.debug.geom( this.debugSpawn, 'rgba(0,0,255,0.3)' ) ;

	if(this.pointer)
		game.debug.pointer(this.pointer);
};

//Переключает дебаг
CardControl.prototype.toggleDebugMode = function(){
	this.isInDebugMode = !this.isInDebugMode;
	if(!this.isInDebugMode){
		console.log('Card control: Debug mode OFF');
		game.debug.reset();
	}
	else{
		console.log('Card control: Debug mode ON');
	}
};
