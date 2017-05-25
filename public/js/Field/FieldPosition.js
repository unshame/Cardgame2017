//ПОЗИЦИОНИРОВАНИЕ ПОЛЯ

/**
* Устанавливает позицию поля.
* @param {number} x            по горизонтали
* @param {number} y            по вертикали
* @param {boolean} shouldPlace нужно ли размещать карты после установки
*/
Field.prototype.setBase = function(x, y, shouldPlace){
	if(x === null || x === undefined)
		x = this.style.x;
	if(y === null || y === undefined)
		y = this.style.y;
	if(shouldPlace === undefined)
		shouldPlace = false;

	this.base.x = this.style.x = Math.round(x);
	this.base.y = this.style.y = Math.round(y);

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
		width = this.style.width;
	else
		this.style.width = width;

	if(height === null || height === undefined)
		height = this.style.height;
	else
		this.style.height = height;

	if(shouldPlace === undefined)
		shouldPlace = false;

	if(this.style.axis == 'vertical'){
		if(width < skinManager.skin.height){
			width = skinManager.skin.height;
		}

		if(height < skinManager.skin.width + this.style.minActiveSpace){
			height = skinManager.skin.width + this.style.minActiveSpace;
		}
	}
	else{
		if(width < skinManager.skin.width + this.style.minActiveSpace){
			width = skinManager.skin.width + this.style.minActiveSpace;
		}

		if(height < skinManager.skin.height){
			height = skinManager.skin.height;
		}
	}

	this.area.width = Math.round(width + this.style.padding*2),
	this.area.height = Math.round(height + this.style.padding*2);

	if(this.icon){
		this.icon.x = this.area.width/2 + this.iconStyle.offset.x;
		this.icon.y = this.area.height/2 + this.iconStyle.offset.y;
	}

	if(this.style.area == 'curved'){
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

	var circle = game.make.bitmapData(game.screenWidth, this.area.height);
	circle.ctx.beginPath();
	circle.ctx.arc(center.x + this.base.x, center.y, radius,2 * Math.PI, 0); 
	circle.ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
	circle.ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
	circle.ctx.lineWidth = 4;
	circle.ctx.fill();
	circle.ctx.stroke();
	var id = 'circle_' + this.id;
	game.cache.addBitmapData(id, circle);	
	this.circle.loadTexture(game.cache.getBitmapData(id));

	this.circle.x = - this.base.x;

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
