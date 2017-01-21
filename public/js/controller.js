/*
* Модуль, обрабатывающий взаимодействие игроком с игрой
* На данный момент отвечает за перенос карт и отображение хвоста карты
*/

var Controller = function(isInDebugMode){

	this.isInDebugMode = isInDebugMode || false;

	this.card = null;
	this.pointer = null;

	this.trail = game.add.emitter(0, 0);
	this.holder = game.add.group();
	this.holder.add(this.trail);
	this.trail.maxParticles = 30;
	this.trail.gravity = 0;
	this.trail.lifespan = 600;
	this.cardShiftDuration = 100;
	this.cardReturnTime = 200;
}

//Обрабатывает нажатие на карту
Controller.prototype.cardClick = function(card, pointer){
	if(!card.isPlayable)
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

	if(!this.cardClickedInbound() || !this.cardClickTimer){
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

	if(!this.cardClickedInbound() || !this.pointer.leftButton.isDown){
		this.reset();
		return;
	}

	if(this.isInDebugMode)
		console.log('Controller: Picked up', this.card.id);

	this.setCardClickTimer();
	this.cardResetTrail();
	this.card.base.addAt(this.trail, 0);
	this.trail.position = {
		x: this.card.sprite.centerX,
		y: this.card.sprite.centerY
	}
	this.trail.minParticleSpeed.setTo(-this.card.sprite.width, -this.card.sprite.height);
	this.trail.maxParticleSpeed.setTo(this.card.sprite.width, this.card.sprite.height);

	this.trail.makeParticles('suits', this.card.suit);

	if(this.card.returner){
		this.card.returner.stop();
		this.card.returner = null;
	}
	this.cardShiftToCursor();
	cardsGroup.bringToTop(this.card.base);
}

//Начинает плавное смещение карты к курсору
Controller.prototype.cardShiftToCursor = function(){

	if(this.card.returner){
		this.card.returner.stop();
		this.card.returner = null;
	}

	this.shiftPosition = new Phaser.Point(
		this.pointer.x - this.card.base.x - this.card.sprite.x,
		this.pointer.y - this.card.base.y - this.card.sprite.y
	);
	this.shiftTime = new Date().getTime() + this.cardShiftDuration;
}

//Кладет карту
Controller.prototype.cardPutDown = function(){

	if(!this.card){
		console.error('Controller: cardPutDown called but no Card assigned.');
		return
	}

	if(this.isInDebugMode)
		console.log('Controller: Putting down', this.card.id);

	if(this.cardOnValidSpot() && this.pointer.leftButton.isDown){
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

	if(this.card.returner){
		this.card.returner.stop();
		this.card.returner = null;
	}

	this.card.returner = game.add.tween(this.card.sprite);
	this.card.returner.to({x:0, y:0}, this.cardReturnTime, Phaser.Easing.Quadratic.Out);
	this.card.returner.onComplete.addOnce(() => {
		this.returner = null;
	}, this.card);

	this.card.returner.start();

	this.card = null;
	this.pointer = null;
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

//Создает хвост карты при движении
Controller.prototype.cardSpawnTrail = function(){
	var curTime = new Date().getTime();
	if(this.lastParticleTime && curTime - this.lastParticleTime < 20)
		return;

	this.lastParticleTime = curTime;

	var distance = this.card.sprite.position.distance(new Phaser.Point(this.trail.emitX, this.trail.emitY), true);
	if(distance < 2){
		this.trail.width = this.card.sprite.width - 35;
		this.trail.height = this.card.sprite.height - 35;
	}
	else{
		this.trail.width = this.trail.height = 0;
	}
	this.trail.emitX = this.card.sprite.x;
	this.trail.emitY = this.card.sprite.y;
	this.trail.emitParticle();
	this.trail.forEachAlive((p) => {
		p.alpha = p.lifespan / this.trail.lifespan * 0.6;
	})
}

//Ресетит хвост карты
Controller.prototype.cardResetTrail = function(soft){
	this.trail.forEachAlive((p) => {
		if(soft)
			p.alpha = 0
		else{
			p.kill();
			p.reset();
		}
	})
	this.trail.position = {x: 0, y: 0};
	this.holder.add(this.trail);
}

Controller.prototype.setCardClickTimer = function(){
	this.resetCardClickTimer();

	this.cardClickTimer = game.time.events.add(300, function(){
		this.resetCardClickTimer();
	}, this);
}

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
		if(!this.card.sprite.visible){
			this.reset();
			return;
		}

		//Возвращаем карту по нажатию правой кнопки или если она была перевернута
		if(this.pointer.rightButton.isDown || !this.card.isPlayable){
			this.cardReturn();
			return;
		}

		//Устанавливаем позицию карты и плавно передивгаем ее к курсору
		if(!this.card.returner){
			var sTime, sP, mP;
			sTime = this.shiftTime - new Date().getTime();
			if(sTime > 0){
				sP = new Phaser.Point(
					Math.round(this.shiftPosition.x / this.cardShiftDuration * sTime), 
					Math.round(this.shiftPosition.y / this.cardShiftDuration * sTime)
				);
			}
			else{
				sP = new Phaser.Point(0, 0);
			}
			mP = new Phaser.Point(this.pointer.x - this.card.base.x, this.pointer.y - this.card.base.y);
			this.card.setRelativePosition(mP.x - sP.x, mP.y - sP.y);
		}

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