//ПОЗИЦИОНИРОВАНИЕ ПОЛЯ

/**
* Устанавливает позицию поля.
* @param {number} x            по горизонтали
* @param {number} y            по вертикали
* @param {boolean} shouldPlace нужно ли размещать карты после установки
*/
Field.prototype.setBase = function(x, y, shouldPlace){
	if(x === null || x === undefined)
		x = this.options.x;
	if(y === null || y === undefined)
		y = this.options.y;
	if(shouldPlace === undefined)
		shouldPlace = false;

	this.base.x = this.options.x = Math.round(x);
	this.base.y = this.options.y = Math.round(y);

	if(shouldPlace)
		this.placeCards();
};

/**
* Устанавливает размер поля.
* @param  {number} width        ширина
* @param  {number} height       высота
* @param  {boolean} shouldPlace нужно ли размещать карты после установки
*/
Field.prototype.resize = function(width, height, shouldPlace){
	if(width === null || width === undefined)
		width = this.options.width;
	else
		this.options.width = width;

	if(height === null || height === undefined)
		height = this.options.height;
	else
		this.options.height = height;

	if(shouldPlace === undefined)
		shouldPlace = false;

	if(this.axis == 'vertical'){
		if(width < skinManager.skin.height){
			width = skinManager.skin.height;
		}

		if(height < skinManager.skin.width + this.minActiveSpace){
			height = skinManager.skin.width + this.minActiveSpace;
		}
	}
	else{
		if(width < skinManager.skin.width + this.minActiveSpace){
			width = skinManager.skin.width + this.minActiveSpace;
		}

		if(height < skinManager.skin.height){
			height = skinManager.skin.height;
		}
	}

	this.area.width = Math.round(width + this.margin*2),
	this.area.height = Math.round(height + this.margin*2);

	if(this.icon){
		this.icon.x = this.area.width/2 + this.iconOffset.x;
		this.icon.y = this.area.height/2 + this.iconOffset.y;
	}

	if(this.areaType == 'curved'){
		this._createCircle(this.area.width, this.area.height);
	}

	if(shouldPlace){
		this.placeCards();
	}
};

/**
* Считает и запоминает радиус и центр окружности по ширине и высоте поля и
* рисует видимую часть окружности. 
* @private
* @param  {number} width  ширина поля
* @param  {number} height высота поля
*/
Field.prototype._createCircle = function(width, height){
	var total = Math.max(2500, width),	//ширина квадрата, в который точно помещается окружность
		extra = (total - width)/2,		//на сколько окружность выходит за пределы экрана
		a = {
			x: -extra,
			y: height
		},
		b = {
			x: extra + width,
			y: height
		},
		c = {
			x: width/2,
			y: 0
		};

	var center = this._calculateCircleCenter(a, c, b);
	var radius = center.y;

	this.circle.clear();		

	this.circle.alpha = this.alpha;	
	this.circle.lineStyle(4, ui.colors.white, 1);
	this.circle.beginFill(ui.colors.white, 1);

	var cos = (total - extra + this.base.x + this.area.height) / 2 / radius,
		angle1 = Math.acos(cos),
		angle2 = Math.acos(-cos);

	this.circle.arc(center.x, center.y, radius, -angle1, -angle2, true);

	this.circleCenter = center;
	this.circleRadius = radius;
};

/**
* Считает центр круга по трем точкам. Взято со stackoverflow.
* @private
* @param  {object} a точка a `{x, y}`
* @param  {object} b точка b `{x, y}`
* @param  {object} c точка c `{x, y}`
* @return {Phaser.Point}   Возвращает центр круга.
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
