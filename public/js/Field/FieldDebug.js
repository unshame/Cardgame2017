// ДЕБАГ

/**
* Сохраняет размеры активного места для отображения.
* @param {number} activeWidth ширина активного места
* @param {number} cardHeight  высота карт
* @param {number} leftMargin  отступ слева
* @param {number} topMargin   отступ сверху
* @param {number} shift       отступ от выделенной карты
*/
Field.prototype._setDebugActiveSpace = function(activeWidth, cardHeight, leftMargin, topMargin, shift){
	this._debugActiveSpace.x = this.x;
	this._debugActiveSpace.y = this.y;
	if(this.style.axis == 'vertical'){
		this._debugActiveSpace.x += topMargin - cardHeight/2;
		this._debugActiveSpace.y += leftMargin - shift;
		this._debugActiveSpace.width = cardHeight;
		this._debugActiveSpace.height = activeWidth + shift*2;
	}
	else{
		this._debugActiveSpace.x += leftMargin - shift;
		this._debugActiveSpace.y += topMargin - cardHeight/2;
		this._debugActiveSpace.width = activeWidth + shift*2;
		this._debugActiveSpace.height = cardHeight;
	}
};

/**
* Обновляет дебаг
*/
Field.prototype.updateDebug = function(){
	if(!this.inDebugMode){
		return;
	}
	var ax = this.x + this.area.x;
	var ay = this.y + this.area.y;
	var x, y;
	if(ax < 0){
		x = 0;
	}
	else if(ax + this.area.width > game.screenWidth){
		x = game.screenWidth - 300;
	}
	else{
		x = ax;
	}

	if(ay < 0){
		y = this.height + ay + 15;
	}
	else if(ay > game.screenHeight){
		y = game.screenHeight;
	}
	else{
		y = ay - 5;
	}

	if(this.type == 'DUMMY'){
		y += this.area.height + 20;
	}

	var str;
	if(this.type == this.id){
		str = this.type;
	}
	else{
		str = this.type + ' ' + this.id;
	}
	if(this.name !== null && this.name !== undefined){
		str += ' ' + this.name;
	}
	if(this.specialId !== null && this.specialId !== undefined){
		str += ' #' + this.specialId;
	}
	str += ' ' + this.cards.length;
	game.debug.text(str, x, y );

	game.debug.geom( this._debugActiveSpace, 'rgba(0,127,127,0.3)' ) ;
};

/**
* Переключает режим дебага
*/
Field.prototype.toggleDebugMode = function(){
	this.inDebugMode = !this.inDebugMode;
	this.setVisibility(this.inDebugMode);
	if(!this.inDebugMode){
		game.debug.reset();
	}
};