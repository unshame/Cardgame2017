// ПОЗИЦИОНИРОВАНИЕ ПОЛЯ

/**
* Устанавливает позицию поля.
* @param {number}  [x=this.style.x]    по горизонтали
* @param {number}  [y=this.style.y]    по вертикали
* @param {boolean} [shouldPlace=false] нужно ли размещать карты после установки
*/
Field.prototype.setBase = function(x, y, shouldPlace){
	if(x === null || x === undefined)
		x = this.style.x;
	if(y === null || y === undefined)
		y = this.style.y;
	if(shouldPlace === undefined)
		shouldPlace = false;

	this.endAnimation();

	this.x = this.style.x = Math.round(x);
	this.y = this.style.y = Math.round(y);

	if(shouldPlace)
		this.placeCards();
};

/**
* Устанавливает размер поля.
* @param {number}  [width=this.style.width]   ширина
* @param {number}  [height=this.style.height] высота
* @param {boolean} [shouldPlace=false]        нужно ли размещать карты после установки
*/
Field.prototype.setSize = function(width, height, shouldPlace){
	if(width === null || width === undefined)
		width = this.style.width;
	else
		this.style.width = width;

	if(height === null || height === undefined)
		height = this.style.height;
	else
		this.style.height = height;

	if(shouldPlace === undefined)
		shouldPlace = false;

	var margin = this.style.margin;

	if(this.style.axis == 'vertical'){
		if(width - margin*2 < skinManager.skin.height){
			width = skinManager.skin.height + margin*2;
		}

		if(height - margin*2 < skinManager.skin.width + this.style.minActiveSpace){
			height = skinManager.skin.width + this.style.minActiveSpace + margin*2;
		}
	}
	else{
		if(width - margin*2 < skinManager.skin.width + this.style.minActiveSpace){
			width = skinManager.skin.width + this.style.minActiveSpace + margin*2;
		}

		if(height - margin*2 < skinManager.skin.height){
			height = skinManager.skin.height + margin*2;
		}
	}

	width = Math.round(width + this.style.padding*2);
	height = Math.round(height + this.style.padding*2);

	this._createArea(width, height);

	if(shouldPlace){
		this.placeCards();
	}
};

/**
* Запоминает размеры поля и рисует прямоугольник с закругленными углами.
* @private
* @param {number} width  ширина поля
* @param {number} height высота поля
*/
Field.prototype._createArea = function(width, height){
	drawRoundedRectangle(
		this._bitmapArea, 
		width, 
		height, 
		this.style.margin, 
		this.style.margin,
		this.style.corner, 
		this.style.border, 
		0.65, 
		'rgba(255, 255, 255, 1)', 
		'rgba(255, 255, 255, 1)'
	);

	this.area.loadTexture(this._bitmapArea);
};

/**
* Считает центр круга по трем точкам. Взято со stackoverflow.
* @private
* @param {object} a точка a `{x, y}`
* @param {object} b точка b `{x, y}`
* @param {object} c точка c `{x, y}`
*
* @return {Phaser.Point} Возвращает центр круга.
*/
Field.prototype._calculateCircleCenter = function(a, b, c){
	var yDelta_a = b.y - a.y,
		xDelta_a = b.x - a.x,
		yDelta_b = c.y - b.y,
		xDelta_b = c.x - b.x,
		x, y;

	var aSlope = yDelta_a / xDelta_a,
		bSlope = yDelta_b / xDelta_b;

	x = (aSlope*bSlope*(a.y - c.y) + bSlope*(a.x + b.x) - aSlope*(b.x+c.x) )/(2* (bSlope-aSlope) );
	y = -1*(x - (a.x+b.x)/2)/aSlope +  (a.y+b.y)/2;

	return new Phaser.Point(x, y);
};

/** 
* Запускает твин появления поля.
* @param {number} delay задержка до запуска твина
*/
Field.prototype.animateAppearance = function(delay){
	if(!this._entranceTween || this._entranceTween.isRunning){
		return;
	}
	var tweenData = this._entranceTween.timeline[0];
	tweenData.delay = delay;
	this._entranceTween.start();
};

/** 
* Создает твин анимации появления поля.
* @private
*/
Field.prototype._setupAnimatedAppearance = function(){
	if(!this.style.animateAppearance)
		return;

	this._entranceTween = game.add.tween(this.position);

	var position = {x: this.x, y: this.y};
	switch(this.style.animateAppearance){
		case 'left':
		this.x -= this.area.width;
		break;

		case 'right':
		this.x += this.area.width;
		break;

		case 'top':
		this.y -= this.area.height;
		break;

		case 'bottom':
		this.y += this.area.height;
		break;

		default:
		console.error('Field: invalid animateAppearance value', this.style.animateAppearance);
		return;
	}
	this._entranceTween.to(position, this.moveTime/game.speed, Phaser.Easing.Quadratic.Out);
	this._entranceTween.onComplete.addOnce(function(){
		this._entranceTween = null;
	}, this);
};

/** Завершает твин появления поля. */
Field.prototype.endAnimation = function(){
	if(!this._entranceTween){
		return;
	}
	var tweenData = this._entranceTween.timeline[this._entranceTween.current];
	this.position = tweenData.vEnd;
	this._entranceTween.stop();
	this._entranceTween = null;
};