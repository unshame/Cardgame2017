/*
 * Модуль, обрабатывающий взаимодействие игрока с игрой
 * На данный момент отвечает за перенос карт и отображение хвоста карты
*/

var Controller = function(isInDebugMode){

	this.isInDebugMode = isInDebugMode || false;

	this.card = null;
	this.pointer = null;

	this.trail = game.add.emitter(0, 0);
	this.trailDefaultBase = game.add.group();
	this.trailDefaultBase.add(this.trail);
	this.trail.gravity = 0;
	this.trail.lifespan = 600;
	this.trail.interval = 20;	//Свойство используется модулем, а не движком
	this.trail.maxParticles = Math.ceil(this.trail.lifespan / this.trail.interval);
	this.cardShiftDuration = 100;
	this.cardReturnTime = 200;
	this.cardClickMaxDelay = 200;
	this.cardMoveThreshold = 2;
}

//Обрабатывает нажатие на карту
Controller.prototype.cardClick = function(card, pointer){
	if(!card.isPlayable || this.card && this.card != card)
		return;

	if(this.isInDebugMode)
		console.log('Controller: Clicked', card.id);

	if(this.card){
		this.cardPutDown();
	}
	else{
		this.cardPickup(card, pointer);
	}
}

//Обрабатывает поднятие кнопки после нажатия на карту
Controller.prototype.cardUnclick = function(card){
	if(!this.card || this.card != card)
		return;

	if(this.isInDebugMode)
		console.log('Controller: Unclicked', card.id);

	if(!this.pointer.withinGame){
		this.cardReturn();
	}
	else if(!this.cardClickedInbound() || !this.cardClickTimer || !this.pointer.isMouse){
		this.cardPutDown();
	}
}

//Поднимает карту
Controller.prototype.cardPickup = function(card, pointer){
	if(!card){
		console.error('Controller: cardPickup called but no Card assigned.');
		return
	}

	this.card = card;
	this.pointer = pointer;
	
	if(!this.cardClickedInbound() || (this.pointer.isMouse && !this.pointer.leftButton.isDown)){
		this.reset();
		return;
	}

	if(this.isInDebugMode)
		console.log('Controller: Picked up', this.card.id);

	this.setCardClickTimer();
	this.cardResetTrail();
	this.card.base.addAt(this.trail, 0);
	this.trail.minParticleSpeed.setTo(-this.card.sprite.width, -this.card.sprite.height);
	this.trail.maxParticleSpeed.setTo(this.card.sprite.width, this.card.sprite.height);

	this.trail.makeParticles(this.card.skin.trailName, this.card.suit);

	this.cardSetPathToCursor();
	cardsGroup.bringToTop(this.card.base);
}

//Устанавливает путь и время смещения карты к курсору
Controller.prototype.cardSetPathToCursor = function(){

	if(this.card.mover){
		this.card.mover.stop();
		this.card.mover = null;
	}
	this.cardShiftPosition = {
		x: this.pointer.x - this.card.base.x - this.card.sprite.x,
		y: this.pointer.y - this.card.base.y - this.card.sprite.y
	};
	this.cardShiftEndTime = new Date().getTime() + this.cardShiftDuration;
}

//Кладет карту
Controller.prototype.cardPutDown = function(){

	if(!this.card){
		console.error('Controller: cardPutDown called but no Card assigned.');
		return
	}

	if(this.isInDebugMode)
		console.log('Controller: Putting down', this.card.id);

	if(this.cardOnValidSpot() && !this.pointer.rightButton.isDown){
		this.cardRebaseAtPointer();
	}
	else{
		this.cardReturn();
	}
}

//Оставляет карту в позиции курсора
Controller.prototype.cardRebaseAtPointer = function(){

	if(!this.card){
		console.error('Controller: cardRebaseAtPointer called but no Card assigned.');
		return
	}

	this.trail.position.x -= this.card.sprite.x; 
	this.trail.position.y -= this.card.sprite.y; 

	var x = this.card.base.x + this.card.sprite.x;
	var y = this.card.base.y + this.card.sprite.y;
	
	if(this.isInDebugMode)
		console.log('Controller: Rebasing', this.card.id, 'at', x, y);

	this.card.setBase(x, y);
	this.card.setRelativePosition(0, 0);

	this.card = null;
	this.pointer = null;
}

//Возвращает карту на базу
Controller.prototype.cardReturn = function(){

	if(!this.card){
		console.error('Controller: cardReturn called but no Card assigned.');
		return
	}

	if(this.isInDebugMode)
		console.log('Controller: Returning', this.card.id, 'to base');

	if(this.card.mover){
		this.card.mover.stop();
		this.card.mover = null;
	}

	var card = this.card;
	var pointer = this.pointer;

	this.card = null;
	this.pointer = null;
	if(card.spot){
		card.spot.placeCard(card);
	}
	else{
		card.returnToBase(this.cardReturnTime, 0);
	}
}

//Проверка нажатия на базу карты
Controller.prototype.cardClickedInbound = function(){
	var cond = 
		this.pointer.x >= this.card.base.x - this.card.sprite.width / 2 &&
		this.pointer.x <= this.card.base.x + this.card.sprite.width / 2 &&
		this.pointer.y >= this.card.base.y - this.card.sprite.height / 2 &&
		this.pointer.y <= this.card.base.y + this.card.sprite.height / 2
	return cond
}

//Проверка корректности позиции карты
Controller.prototype.cardOnValidSpot = function(){
	return debugSpotValidity;
}

//Смещает хвост относительно базы карты
Controller.prototype.cardShiftTrial = function(x, y){
	this.trail.position.x += x;
	this.trail.position.y += y;
}

//Создает хвост карты при движении
Controller.prototype.cardSpawnTrail = function(){

	var curTime = new Date().getTime();
	if(this.lastParticleTime && curTime - this.lastParticleTime < this.trail.interval)
		return;

	this.lastParticleTime = curTime;

	var distance = this.card.sprite.position.distance({
		x: this.trail.emitX + this.trail.position.x, 
		y: this.trail.emitY + this.trail.position.y
	}, true);
	if(distance < this.cardMoveThreshold){
		this.trail.width = this.card.sprite.width - 35;
		this.trail.height = this.card.sprite.height - 35;
	}
	else{
		this.trail.width = this.trail.height = 0;
	}
	this.trail.emitX = this.card.sprite.x - this.trail.position.x;
	this.trail.emitY = this.card.sprite.y - this.trail.position.y;
	this.trail.emitParticle();
	this.trail.forEachAlive(function(p){
		p.alpha = p.lifespan / this.trail.lifespan * 0.6;
	}, this)
}

//Ресетит хвост карты
Controller.prototype.cardResetTrail = function(soft){
	this.trail.forEachAlive(function(p){
		if(soft)
			p.alpha = 0
		else{
			p.kill();
			p.reset();
		}
	}, this)
	this.trail.position = {x: 0, y: 0};
	this.trailDefaultBase.add(this.trail);
}

//Запускает таймер клика по карте
Controller.prototype.setCardClickTimer = function(){
	this.resetCardClickTimer();

	this.cardClickTimer = game.time.events.add(this.cardClickMaxDelay, function(){
		this.resetCardClickTimer();
	}, this);
}

//Обнуляет таймер клика по карте
Controller.prototype.resetCardClickTimer = function(){
	if(this.cardClickTimer){
		game.time.events.remove(this.cardClickTimer);
		this.cardClickTimer = null;
	}
}

//Обновление позиции карты и хвоста
Controller.prototype.update = function(){
	if(this.card){

		//Ресетим контроллер, если карта была спрятана\удалена
		if(!this.card.sprite.visible || this.card.mover){
			this.reset();
			return;
		}

		//Возвращаем карту по нажатию правой кнопки или если она была перевернута
		if(this.pointer.rightButton.isDown || !this.card.isPlayable || !this.pointer.withinGame){
			this.cardReturn();
			return;
		}

		//Устанавливаем позицию карты и плавно передивгаем ее к курсору
		var sTime, sP, mP;
		sTime = this.cardShiftEndTime - new Date().getTime();
		if(sTime > 0){
			sP = {
				x: Math.round(this.cardShiftPosition.x / this.cardShiftDuration * sTime), 
				y: Math.round(this.cardShiftPosition.y / this.cardShiftDuration * sTime)
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

		//Спавним хвост
		this.cardSpawnTrail();
	}
}

//Ресет модуля
Controller.prototype.reset = function(){

	if(this.isInDebugMode)
		console.log('Controller: Reset');

	this.cardResetTrail(true);
	this.card = null;
	this.pointer = null;
}

/* ДЕБАГ */

//Рисует дебаг хвоста
Controller.prototype.updateDebug = function(){
	if(!this.isInDebugMode)
		return;

	//База хвоста
	if(!this.debugBase){
		this.debugBase = new Phaser.Rectangle() ;
	}
	var width = this.card && this.card.sprite.width || this.debugBase.width || 0;
	var height = this.card && this.card.sprite.height || this.debugBase.height || 0;
	var x = this.trail.parent.x;
	var y = this.trail.parent.y;
	this.debugBase.x = x - width/2;
	this.debugBase.y = y - height/2;
	this.debugBase.width = width;
	this.debugBase.height = height;
	game.debug.geom( this.debugBase, 'rgba(255,0,0,0.6)' ) ;

	//Таймер клика
	var time = this.cardClickTimer && this.cardClickTimer.timer.nextTick - new Date().getTime() || 0;
	game.debug.text(time + 'sec', x, y );

	//Визуализация максимальной скорости хвоста
	if(!this.debugSpeed){
		this.debugSpeed = new Phaser.Circle();
	}
	width = this.trail.width || 5;
	height = this.trail.height || 5;
	var diameter = game.math.distance(0,0,this.trail.maxParticleSpeed.x,this.trail.maxParticleSpeed.y) ;
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
}

//Переключает дебаг
Controller.prototype.toggleDebugMode = function(){
	this.isInDebugMode = !this.isInDebugMode;
	if(!this.isInDebugMode){
		console.log('Controller: Debug mode OFF');
		game.debug.reset();
	}
	else{
		console.log('Controller: Debug mode ON');
	}
}
