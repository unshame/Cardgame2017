//АПДЕЙТ И ТАЙМЕР НАЖАТИЯ КОНТРОЛИРУЕМОЙ КАРТЫ

//Обновление позиции карты и хвоста
CardControl.prototype._updateCard = function(){
	if(!this.card){
		return false;
	}

	//Ресетим контроллер, если карта была спрятана\удалена
	if(!this.card.sprite.visible || this.card.mover){
		this.reset('card hidden or moving');
		return false;
	}

	//Возвращаем карту по нажатию правой кнопки или если она была перевернута
	if(this.pointer.rightButton.isDown || !this.card.draggable || !this.pointer.withinGame){
		//Если у карты включена физика, кидаем ее, иначе - возвращаем
		if(cardManager.physicsEnabled && this.card.sprite.body){
			this.cardThrow();
		}
		else{
			this.cardReturn();
		}
		return false;
	}

	var curTime = game.time.time;

	this._updateCardPosition(curTime);
	this._updateCardAngle(curTime);
	var fields = this._cardOnValidField();
	if(fields){
		this.card.setScale(1 + fields[0].focusedScaleDiff);
		if(~fields[0].validCards.indexOf(this.card)){
			fieldManager.popOutField(fields[0]);
		}
	}
	else{
		this.card.setScale(1.1);
		fieldManager.resetPopOut();
	}
	return true;
};

//Устанавливаем позицию карты и плавно передивгаем ее к курсору
CardControl.prototype._updateCardPosition = function(curTime){
	var sTime, sP, mP;
	sTime = this.cardShiftEndTime - curTime;
	if(sTime > 0){
		sP = {
			x: Math.round(this.cardShiftPosition.x / (this.cardShiftDuration/game.speed)* sTime), 
			y: Math.round(this.cardShiftPosition.y / (this.cardShiftDuration/game.speed)* sTime)
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

//Устанавливает угол в зависимости от инерции карты
CardControl.prototype._updateCardAngle = function(curTime){

	var maxAngle = this.cardMaxMoveAngle;

	this._saveInertia(curTime, 300);
	
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

/*
* Сохраняет текущее время и позицию карты.
* @param  {number} curTime текущее время
* @param  {number} maxTime позиции, запомненные больше этого времени назад, будут удалены
* @see {@link https://github.com/KyleU/solitaire.gg/blob/bf67e1622048bc32abfeef2848f74f220daa384e/app/assets/javascripts/card/CardInput.js#L53|Источник кода}
*/
CardControl.prototype._saveInertia = function(curTime, maxTime){
	var curX = this.card.sprite.x,
		curY = this.card.sprite.y,
		distance = {
			x: curX - this.cardLastX,
			y: curY - this.cardLastY
		};

	while(this.inertiaHistory.length && curTime - this.inertiaHistory[0][0] > maxTime) {
		this.inertiaHistory.shift();
	}
	this.inertiaHistory.push([curTime, distance.x, distance.y]);
};
