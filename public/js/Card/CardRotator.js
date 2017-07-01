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
		if(rotatorData && rotatorData.vEnd && rotatorData.vEnd.angle == angle && rotatorData.delay == delay && !this.game.paused)
			return;

		this._rotator.stop();
		this._rotator = null;
	}

	//Создаем и запускаем твин или поворачиваем карту если игра остановлена
	if(this.game.paused){
		this.setAngle(angle);
	}
	else{
		this._rotator = this.game.add.tween(this.sprite);
		this._rotator.to(
			{
				angle: angle
			},
			time/this.game.speed || 0,
			easing || Phaser.Easing.Quadratic.Out,
			true,
			delay/this.game.speed || 0
		);

		//Ресет твина по окончанию
		this._rotator.onComplete.addOnce(function(){
			this._rotator = null;
		}, this);
	}
};


//ВОКРУГ ТОЧКИ

/**
 * Поворачивает карту вокруг указанной точки на указанный угол. 
 * Параметры указыны в {@link Card#_revolveInfo}.
 * @private
 */
Card.prototype._revolve = function(){
	if(!this._revolveInfo || this.mover)
		return;

	var dt = this.game.time.elapsed,
		angle = this._revolveInfo.speed * dt,
		x = this._revolveInfo.x - this.base.x,
		y = this._revolveInfo.y - this.base.y,
		cx = this.sprite.x,
		cy = this.sprite.y,
		distance = Math.sqrt(Math.pow(cx - x, 2) + Math.pow(cy - y, 2)),
		t = angle + Math.atan2(cy - y, cx - x);
	
	this.sprite.x = x + distance * Math.cos(t);
	this.sprite.y = y + distance * Math.sin(t);
	this.sprite.rotation = t + Math.PI;
};

/**
 * Сообщает карте, что нужно вращаться вокруг определенной точки.
 * Вращение происходит, если карта не двигается (нет {@link Card#mover})
 * @param  {number} x     позиция точки вращения по горизонтали
 * @param  {number} y     по вертикали
 * @param  {number} speed угол поворота за 1 мс
 */
Card.prototype.revolveAround = function(x, y, speed){
	this._revolveInfo = {
		x: x,
		y: y,
		speed: speed
	};
};

/**
 * Сообщает карте, что не нужно вращаться.
 */
Card.prototype.stopRevolving = function(){
	this._revolveInfo = null;
};
