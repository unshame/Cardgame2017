//ПОЗИЦИОНИРОВАНИЕ ПОЛЯ

/**
* Устанавливает позицию поля.
* @param {number} [x=this.style.x]            по горизонтали
* @param {number} [y=this.style.y]            по вертикали
* @param {boolean} [shouldPlace=false] нужно ли размещать карты после установки
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
* @param  {number} [width=this.style.width] ширина
* @param  {number} [height=this.style.height] высота
* @param  {boolean} [shouldPlace=false] нужно ли размещать карты после установки
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

	if(this.icon){
		this.icon.x = width/2 + this.iconStyle.offset.x;
		this.icon.y = height/2 + this.iconStyle.offset.y;
	}

	if(this.style.area == 'curved'){
		this._createCircle(width, height);
	}	

	if(shouldPlace){
		this.placeCards();
	}
};

/**
* Запоминает размеры поля и рисует прямоугольник с закругленными углами.
* @private
* @param  {number} width  ширина поля
* @param  {number} height высота поля
*/
Field.prototype._createArea = function(width, height){
	var radius = this.style.corner,
		lineWidth = this.style.border,
		x = this.style.margin + lineWidth/2,
		y = this.style.margin + lineWidth/2;
		
	var area = this._bitmapArea;
	if(!area){
		area = game.make.bitmapData(width, height);
	}
	else{
		area.clear();		
		area.resize(width, height);
	}
	width -= x*2;
	height -= y*2;
	area.ctx.beginPath();
	area.ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
	area.ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
	area.ctx.lineWidth = lineWidth;
	area.ctx.moveTo(x + radius, y);
	area.ctx.lineTo(x + width - radius, y);
	area.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
	area.ctx.lineTo(x + width, y + height - radius);
	area.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
	area.ctx.lineTo(x + radius, y + height);
	area.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
	area.ctx.lineTo(x, y + radius);
	area.ctx.quadraticCurveTo(x, y, x + radius, y);
	area.ctx.fill();
	area.ctx.stroke();
	area.update();

	this.area.loadTexture(area);
	this._bitmapArea = area;
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

	var circle = this._bitmapCircle;
	if(!circle){
		circle = game.make.bitmapData(game.screenWidth, height);
	}
	else{
		circle.clear();		
		circle.resize(game.screenWidth, height);
	}
	circle.ctx.beginPath();
	circle.ctx.arc(center.x + this.base.x, center.y, radius,2 * Math.PI, 0); 
	circle.ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
	circle.ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
	circle.ctx.lineWidth = this.style.border;
	circle.ctx.fill();
	circle.ctx.stroke();
	circle.update();
	this.circle.loadTexture(circle);
	this._bitmapCircle = circle;

	this.circle.x = -this.base.x;

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

/** 
* Анимирует появление поля
* @private
*/
Field.prototype._animateAppearance = function(){
	if(this.style.area == 'curved'){
		var tween = game.add.tween(this.circle.position);
		this.circle.y = this.area.height;
		tween.to({y: 0}, this.moveTime/game.speed, Phaser.Easing.Quadratic.Out);
		tween.start();
	}
};
