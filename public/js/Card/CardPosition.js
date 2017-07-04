// ПОЗИЦИОНИРОВАНИЕ

/**
* Устанавливает абсолютную позицию карты.
* @param {number} x          позиция по горизонтали
* @param {number} y          позиция по вертикали
* @param {boolean} [resetMover=true] нужно ли останавливать {@link Card#mover}
*/
Card.prototype.setPosition = function(x, y, resetMover){

	if(typeof resetMover == 'undefined')
		resetMover = true;

	if(this.mover && resetMover){
		this.mover.stop();
		this.mover = null;
	}

	this.sprite.x = x - this.base.x;
	this.sprite.y = y - this.base.y;
	this.update();
};

/**
* Устанавливает положение карты по отношению к базе карты.
* @param {number} x          позиция по горизонтали
* @param {number} y          позиция по вертикали
* @param {boolean} [resetMover=true] нужно ли останавливать {@link Card#mover}
*/
Card.prototype.setRelativePosition = function(x, y, resetMover){

	if(typeof resetMover == 'undefined')
		resetMover = true;

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
* @param {number} x          позиция по горизонтали
* @param {number} y          позиция по вертикали
* @param {boolean} [resetMover=true] нужно ли останавливать {@link Card#mover}
*/
Card.prototype.setBase = function(x, y, resetMover){

	if(typeof resetMover == 'undefined')
		resetMover = true;

	if(this.mover && resetMover){
		this.mover.stop();
		this.mover = null;
	}

	this.base.x = x;
	this.base.y = y;
	this.update();
};

/**
* Устанавливает позицию базы карты, сохраняя относительный сдвиг спрайта и хвоста.
* @param {number} x  позиция по горизонтали
* @param {number} y  позиция по вертикали
* @param {boolean} [resetMover=true] нужно ли останавливать {@link Card#mover}
*/
Card.prototype.setBasePreserving = function(x, y, resetMover){

	if(typeof resetMover == 'undefined')
		resetMover = true;

	var shiftX = x - this.base.x,
		shiftY = y - this.base.y,
		newX = this.sprite.x - shiftX,
		newY = this.sprite.y - shiftY;
	this.setBase(x, y, resetMover);
	this.setRelativePosition(newX, newY, false);

	// Смещаем хвост карты
	if(cardControl.trail.parent == this.base){
		cardControl.trailShift(-shiftX, -shiftY);
	}
};

/**
* Поднимает карту наверх, опционально поднимает перетаскиваемую карту наверх.
* @param {boolean} [fixController=true] нужно ли поднимать {@link cardControl#card} наверх
*/
Card.prototype.bringToTop = function(fixController){
	if(fixController === undefined)
		fixController = true;
	this.base.parent.bringToTop(this.base);
	if(fixController && cardControl.card && cardControl.card != this){
		cardControl.card.bringToTop(false);
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
