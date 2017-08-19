// ПОЗИЦИОНИРОВАНИЕ ПОЛЯ

/**
* Устанавливает позицию поля.
* @param {number}  [x=this.style.x]    по горизонтали
* @param {number}  [y=this.style.y]    по вертикали
* @param {boolean} [shouldPlace=false] нужно ли размещать карты после установки
*/
Field.prototype.setBase = function(x, y, shouldPlace){
	if(x === null || x === undefined){
		x = this.style.x;
	}
	if(y === null || y === undefined){
		y = this.style.y;
	}
	if(shouldPlace === undefined){
		shouldPlace = false;
	}

	this.endAnimation();

	this.x = this.style.x = Math.round(x);
	this.y = this.style.y = Math.round(y);

	if(shouldPlace){
		this.placeCards();
	}
};

/**
* Устанавливает размер поля.
* @param {number}  [width=this.style.width]   ширина
* @param {number}  [height=this.style.height] высота
* @param {boolean} [shouldPlace=false]        нужно ли размещать карты после установки
*/
Field.prototype.setSize = function(width, height, shouldPlace){
	if(width === null || width === undefined){
		width = this.style.width;
	}
	else{
		this.style.width = width;
	}

	if(height === null || height === undefined){
		height = this.style.height;
	}
	else{
		this.style.height = height;
	}

	if(shouldPlace === undefined){
		shouldPlace = false;
	}

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