//ПЕРЕДВИЖЕНИЕ

/**
* Плавно перемещает карту
* @param  {number} x              - позиция по горизонтали
* @param  {number} y              - позиция по вертикали
* @param  {number} time           - время перемещения
* @param  {number} [delay=0]      - задержка перед перемещением
* @param  {boolean} [relativeToBase=false] - перемещение происходит относительно базы карты
* @param  {boolean} [shouldRebase=false]   - нужно ли перемещать базу карты или только карту  
* если база не изменилась, то эта переменная всегда будет false
* @param  {BRING_TO_TOP_ON} [bringToTopOn=BRING_TO_TOP_ON.INIT]   - когда поднимать карту на передний план 
* @param  {functon} [easing=Phaser.Easing.Quadratic.Out] - функция плавности
*/
Card.prototype.moveTo = function(x, y, time, delay, relativeToBase, shouldRebase, bringToTopOn, easing){

	if(relativeToBase === undefined)
		relativeToBase = false;
	if(shouldRebase === undefined)
		shouldRebase = false;
	if(bringToTopOn === undefined)
		bringToTopOn = BRING_TO_TOP_ON.INIT;
	if(time < 0 || isNaN(time))
		time = 0;

	this._bringToTopOn = bringToTopOn;

	if(this._bringToTopOn == BRING_TO_TOP_ON.INIT || game.paused && this._bringToTopOn != BRING_TO_TOP_ON.NEVER)
		this.bringToTop();

	var destination = this._calculateMoveCoordinates(x, y, relativeToBase, shouldRebase);

	//Меняем позицию базы карты перед началом анимации
	//и меняем относительную позицию карты так, чтобы ее абсолютная позиция не менялась
	if(shouldRebase){
		this.setBasePreserving(destination.base.x, destination.base.y, false);
	}

	this._startMover(destination.sprite.x, destination.sprite.y, time, delay, shouldRebase, easing);
};

/**
* Плавно возвращает карту на базу.
* @see  {@link Card#moveTo}
* @param  {number} time           - время перемещения
* @param  {number} delay          - задержка перед перемещением
*/
Card.prototype.returnToBase = function(time, delay){
	this.moveTo(0, 0, time || 0, delay || 0, true);
};

/**
* Вычисляет координаты базы и спрайта, к которым будет происходить движение, из переданных координат.
* @private
* @param  {number} x              позиция по горизонтали
* @param  {number} y              позиция по вертикали
* @param  {number} relativeToBase перемещение происходит относительно базы карты
* @param  {number} shouldRebase   нужно ли перемещать базу карты или только карту  
* @return {object}                Возвращает две позици `{ sprite: {x, y}, base: {x, y} }`
*/
Card.prototype._calculateMoveCoordinates = function(x, y, relativeToBase, shouldRebase){

	//Куда двигать карту
	var moveX, moveY;

	//Новая позиция базы
	var newBaseX = relativeToBase ? x + this.base.x : x;
	var newBaseY = relativeToBase ? y + this.base.y : y;

	//Предупреждаем о том, что карта вышла за пределы экрана
	if(!Phaser.Rectangle.containsRaw(
			-this.skin.width/2,
			-this.skin.height/2,
			game.screenWidth + this.skin.width,
			game.screenHeight + this.skin.height,
			newBaseX,
			newBaseY
	)){
		console.warn('Moving card', this.id, 'out of screen (' + newBaseX + ', ' + newBaseY + ')\n', this);
	}
	//Нет смысла менять базу, если координаты не изменились
	if(shouldRebase && newBaseX == this.base.x && newBaseY == this.base.y)
		shouldRebase = false;

	if(shouldRebase){
		//Мы будем двигать карту к новой позиции базы
		moveX = moveY = 0;
	}
	else{
		//Если база остается прежней, то двигаем карту к нужной позиции
		moveX = relativeToBase ? x : x - this.base.x;
		moveY = relativeToBase ? y : y - this.base.y;
	}

	return {
		sprite: {
			x: moveX,
			y: moveY
		},
		base: {
			x: newBaseX,
			y: newBaseY
		}
	};
};

/**
* Создает и запускает твин передвижения или перемещает карту если игра остановлена.
* @private
* @param  {number} x              	 позиция по горизонтали
* @param  {number} y              	 позиция по вертикали
* @param  {number} time           	 время перемещения
* @param  {number} delay          	 задержка перед перемещением
* @param  {boolean} shouldRebase    нужно ли перемещать базу карты или только карту 
* @param  {functon} easing 		 функция плавности
*/
Card.prototype._startMover = function(x, y, time, delay, shouldRebase, easing){
	if(game.paused){
		this.applyValue();
		this.setRelativePosition(x, y);
		if(this.mover){
			this.mover.stop();
			this.mover = null;
		}
		return;
	}

	//Проверяем и останавливаем текущий мувер
	if(this.mover){
		time = this._tryResetMover(x, y, time, delay, shouldRebase);
		if(time < 0) return;
	}

	if(delay){
		this._delayed = true;
	}

	//Запускаем новый твин
	this.mover = game.add.tween(this.sprite);
	this.mover.to(
		{			
			x: x,
			y: y
		},
		(time/game.speed) || 0,
		easing || Phaser.Easing.Quadratic.Out,
		true,
		(delay/game.speed) || 0
	);

	this.mover.onStart.addOnce(this._onMoveStart, this);
	this.mover.onComplete.addOnce(this._onMoveComplete, this);
};

/** 
* Выполняется по началу движения карты 
* @private
*/
Card.prototype._onMoveStart = function(){
	this._delayed = false;
	this.applyValue();
	if(this._bringToTopOn == BRING_TO_TOP_ON.START || this._bringToTopOn == BRING_TO_TOP_ON.START_ALL){
		if(!this.field || this._bringToTopOn == BRING_TO_TOP_ON.START){
			this.bringToTop();
		}
		else{
			this.field.zAlignCards(true, this);
		}
	}
};

/** 
* Выполняется по окончанию движения карты 
* @private
*/
Card.prototype._onMoveComplete = function(){
	this._delayed = false;
	this.mover = null;
	this.applyValue();
	if(this._bringToTopOn == BRING_TO_TOP_ON.END || this._bringToTopOn == BRING_TO_TOP_ON.END_ALL){
		if(!this.field || this._bringToTopOn == BRING_TO_TOP_ON.END){
			this.bringToTop();
		}
		else{
			this.field.zAlignCards(true, this);
		}
	}
};

/**
* Останавливает мувер, если время, позиция или задержка изменились.
* Возвращает уменьшенное время, если они остались прежними.
* @private
* @param  {number} x              	 позиция по горизонтали
* @param  {number} y              	 позиция по вертикали
* @param  {number} time           	 время перемещения
* @param  {number} delay          	 задержка перед перемещением
* @param  {boolean} shouldRebase    нужно ли перемещать базу карты или только карту 
* @return {number} Возвращает оставшееся время или -1, если мувер не был остановлен.
*/
Card.prototype._tryResetMover = function(x, y, time, delay, shouldRebase){
	var moverData = this.mover.timeline[this.mover.current],
		endPosition = moverData && moverData.vEnd;

	//Не перезапускаем твин, если нет задержки и пункт назначения не изменился
	if(!shouldRebase && endPosition && endPosition.x == x && endPosition.y == y && moverData.delay == delay){
		this.applyValue();
		if(this._bringToTopOn == BRING_TO_TOP_ON.START)
			this.bringToTop();
		return -1;
	}

	//Уменьшаем время движения, если твин уже в процессе, чтобы уменьшить заторможенность карт,
	//когда они несколько раз меняют направление движения (игрок проносит курсор над рукой)
	//Ограничиваем минимальное время половиной заданного, чтобы карты резко не прыгали
	if(!delay){		
		time = Math.max(moverData.duration*game.speed - moverData.dt*game.speed, time/2);
	}

	//Останавливаем существующий твин
	this.mover.stop();

	return time;
};


//ПОВОРОТ

/**
* Поворачивает карту с анимацией.
* @param  {number} angle  угол, к которому будет поворачиваться карта
* @param  {number} time   время поворота
* @param  {number} [delay=0]  задержка перед поворотом
* @param  {function} [easing=Phaser.Easing.Quadratic.Out] функция плавности
*/
Card.prototype.rotateTo = function(angle, time, delay, easing){

	var newAngle = this._calculateCorrectAngle(angle);

	if(newAngle === false){
		if(this._rotator){
			this._rotator.stop();
			this._rotator = null;
		}
		return;
	}
	this._startRotator(angle, time, delay, easing);
};

/**
* Корректирует угол. 
* @private
* @param  {number} angle     угол
* @return {(number|boolean)} Возвращает скорректированный угол, если он не равен текущему, или `false`.
*/
Card.prototype._calculateCorrectAngle = function(angle){
	var angleSign = angle < 0 ? -1 : 1,

		angleAbs = Math.abs(angle),
		angleDiv = Math.floor(angleAbs / 360),

		oldAngle = this.sprite.angle,
		oldAngleSign = oldAngle < 0 ? -1 : 1,
		oldAngleAbs = Math.abs(oldAngle),
		oldAngleDiv = Math.floor(oldAngleAbs / 360);

	angle = (angleAbs - angleDiv*360)*angleSign;
	oldAngle = (oldAngleAbs - oldAngleDiv*360)*oldAngleSign;

	if(Math.abs(angle - oldAngle) >= 180){
		angle -= 360*angleSign;
	}

	if(angle == oldAngle){
		return false;
	}
	return angle;
};

/**
* Создает и запускает твин поворота или поворачивает карту если игра остановлена.
* @private
* @param  {number} angle    угол, к которому будет поворачиваться карта
* @param  {number} time     время поворота
* @param  {number} delay    задержка перед поворотом
* @param  {function} easing функция плавности
*/
Card.prototype._startRotator = function(angle, time, delay, easing){

	//Останавливаем твин, если он есть и угол поворота изменился
	if(this._rotator){
		var rotatorData = this._rotator.timeline[this._rotator.current];
		if(rotatorData && rotatorData.vEnd && rotatorData.vEnd.angle == angle && rotatorData.delay == delay && !game.paused)
			return;

		this._rotator.stop();
		this._rotator = null;
	}

	//Создаем и запускаем твин или поворачиваем карту если игра остановлена
	if(game.paused){
		this.setAngle(angle);
	}
	else{
		this._rotator = game.add.tween(this.sprite);
		this._rotator.to(
			{
				angle: angle
			},
			time/game.speed || 0,
			easing || Phaser.Easing.Quadratic.Out,
			true,
			delay/game.speed || 0
		);

		//Ресет твина по окончанию
		this._rotator.onComplete.addOnce(function(){
			this._rotator = null;
		}, this);
	}
};
