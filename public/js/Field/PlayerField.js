/**
* Поле руки игрока с расположением карт по дуге {@link Field.PlayerField#circle}.
* @class 
* @extends {Field.BadgeField}
* @param {object} options
* @param {object} style
* @param {object} badgeStyle
*/
Field.PlayerField = function(options, style, badgeStyle){
	Field.BadgeField.call(this, options, style, badgeStyle);

	/**
	* Полукруглая поверхность поля.
	* @type {Phaser.Image}
	*/
	this.circle = game.add.image(0, 0);
	this.add(this.circle);

	/**
	* BitmapData полукруглой поверхности поля.
	* @type {Phaser.BitmapData}
	*/
	this._bitmapCircle = game.make.bitmapData();
};

extend(Field.PlayerField, Field.BadgeField);

Field.PlayerField.prototype._rotateCard = function(card, angle, x, y, margin, delay){

	// Находим угол и сдвигаем y
	var toCenter = this.circleCenter.x - x + this.x,
		distance = Math.sqrt(Math.pow(this.circleRadius, 2) - toCenter*toCenter);
	angle = Math.acos(toCenter/this.circleRadius) - Math.PI/2;
	angle *= (180 / Math.PI);
	y = this.y + this.circleCenter.y - distance + margin;

	card.rotateTo(angle, this.moveTime, delay);

	return y;
};

Field.PlayerField.prototype._startCardMovers = function(card, angle, x, y, margin, delay, bringToTopOn){
	// Запускаем поворот карты
	y = this._rotateCard(card, angle, x, y, margin, delay);

	// Запускаем перемещение карты
	if(cardControl.card != card){
		card.moveTo(x, y, this.moveTime, delay, false, true, bringToTopOn);
	}
	else{
		card.setBasePreserving(x, y);
	}

	this._fixCardDraggability(card);
};

Field.PlayerField.prototype._calculateShift = function(cardWidth, cardSpacing, areaActiveWidth){
	var shift = supercall(Field.PlayerField)._calculateShift.call(this, cardWidth, cardSpacing, areaActiveWidth);
	return Math.max(0, shift - 5);
};

Field.PlayerField.prototype._createArea = function(width, height){
	supercall(Field.PlayerField)._createArea.call(this, width, height);
	this._createCircle(width, height);
};

/**
* Считает и запоминает радиус и центр окружности по ширине и высоте поля и
* рисует видимую часть окружности. 
* @param {number} width  ширина поля
* @param {number} height высота поля
*/
Field.PlayerField.prototype._createCircle = function(width, height){
	var total = Math.max(2500, width),	// ширина квадрата, в который точно помещается окружность
		extra = (total - width)/2,		// на сколько окружность выходит за пределы экрана
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

	var circle = this._bitmapCircle,
		ctx = circle.ctx;
	circle.clear();		
	circle.resize(game.screenWidth, height);
	ctx.beginPath();
	ctx.arc(center.x + this.x, center.y, radius,2 * Math.PI, 0); 
	ctx.fillStyle = 'rgba(255, 255, 255, 1)';
	ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
	ctx.lineWidth = this.style.border;
	ctx.globalAlpha = 0.65;
	ctx.fill();
	ctx.globalAlpha = 1;
	ctx.stroke();
	circle.update();
	this.circle.loadTexture(circle);

	this.circle.x = -this.x;

	this.circleCenter = center;
	this.circleRadius = radius;
};

/**
* Считает центр круга по трем точкам. Взято со stackoverflow.
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

Field.PlayerField.prototype.setOwnHighlight = function(on, tint){
	if(tint === undefined){
		tint = ui.colors.orange;
	}
	this.highlighted = on;
	this.setVisibility(on);
	this.circle.tint = on ? ui.colors.orange : skinManager.skin.color;
	this.circle.alpha = (this.style.alwaysVisible || on) ? this.style.alpha : 0.15;
};

Field.PlayerField.prototype.setVisibility = function(visible){
	this.circle.visible = this.style.alwaysVisible || visible || this.inDebugMode;
};