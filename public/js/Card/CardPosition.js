// ПОЗИЦИОНИРОВАНИЕ

/**
* Устанавливает абсолютную позицию карты.
* @param {number}  x                 позиция по горизонтали
* @param {number}  y                 позиция по вертикали
* @param {boolean} [resetMover=true] нужно ли останавливать {@link Card#mover}
*/
Card.prototype.setPosition = function(x, y, resetMover){

	if(typeof resetMover == 'undefined'){
		resetMover = true;
	}

	if(this.mover && resetMover){
		this.mover.stop();
		this.mover = null;
	}

	this.sprite.x = x - this.x;
	this.sprite.y = y - this.y;
	this.update();
};

/**
* Устанавливает положение карты по отношению к базе карты.
* @param {number}  x                 позиция по горизонтали
* @param {number}  y                 позиция по вертикали
* @param {boolean} [resetMover=true] нужно ли останавливать {@link Card#mover}
*/
Card.prototype.setRelativePosition = function(x, y, resetMover){

	if(typeof resetMover == 'undefined'){
		resetMover = true;
	}

	if(this.mover && resetMover){
		this.mover.stop();
		this.mover = null;
	}

	this.sprite.x = x;
	this.sprite.y = y;
	this.update();
};

/**
* Устанавливает позицию базы карты.
* @param {number}  x                 позиция по горизонтали
* @param {number}  y                 позиция по вертикали
* @param {boolean} [resetMover=true] нужно ли останавливать {@link Card#mover}
*/
Card.prototype.setBase = function(x, y, resetMover){

	if(typeof resetMover == 'undefined'){
		resetMover = true;
	}

	if(this.mover && resetMover){
		this.mover.stop();
		this.mover = null;
	}

	this.x = x;
	this.y = y;
	this.update();
};

/**
* Устанавливает позицию базы карты, сохраняя относительный сдвиг спрайта и хвоста.
* @param {number}  x                 позиция по горизонтали
* @param {number}  y                 позиция по вертикали
* @param {boolean} [resetMover=true] нужно ли останавливать {@link Card#mover}
*/
Card.prototype.setBasePreserving = function(x, y, resetMover){

	if(typeof resetMover == 'undefined'){
		resetMover = true;
	}

	var shiftX = x - this.x,
		shiftY = y - this.y,
		newX = this.sprite.x - shiftX,
		newY = this.sprite.y - shiftY;
	this.setBase(x, y, resetMover);
	this.setRelativePosition(newX, newY, false);

	// Смещаем хвост карты
	if(cardControl.trail.parent == this){
		cardControl.trailShift(-shiftX, -shiftY);
	}
};

/**
* Запоминает id поля, в которое будет перемещена карта. Устанавливает перетаскиваемость.
* @param {string} fieldId id поля
*/
Card.prototype.presetField = function(fieldId){
	if(this.fieldId == fieldId){
		return false;
	}
	this.fieldId = fieldId;
	if(fieldId == this.game.pid){
		this.setDraggability(true);
	}
	else{
		this.setDraggability(false);
	}
	return true;
};

/**
* Устанавливает угол поворота карты.
* @param {number} angle угол поворота
*/
Card.prototype.setAngle = function(angle){
	if(this._rotator){
		this._rotator.stop();
		this._rotator = null;
	}

	this.sprite.angle = angle;
	this._glowUpdatePosition();
};

/**
* Устанавливает масштаб карты относительно масштаба текущего скина.
* @param {number} scale масштаб
*/
Card.prototype.setScale = function(scale){
	scale = this.skin.scale*scale;
	if(scale != this.sprite.scale.x || scale != this.sprite.scale.y){
		this.sprite.scale.setTo(scale, scale);
		this.glow.scale.setTo(scale, scale);
	}
};
