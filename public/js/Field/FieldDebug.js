//ДЕБАГ

/**
* Сохраняет размеры активного места для отображения.
* @private
* @param {number} activeWidth ширина активного места
* @param {number} cardHeight  высота карт
* @param {number} leftMargin  отступ слева
* @param {number} topMargin   отступ сверху
* @param {number} shift       отступ от выделенной карты
*/
Field.prototype._setDebugActiveSpace = function(activeWidth, cardHeight, leftMargin, topMargin, shift){
	this._debugActiveSpace.x = this.base.x;
	this._debugActiveSpace.y = this.base.y;
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
	if(!this.inDebugMode)
		return;

	var x, y;
	if(this.base.x < 0)
		x = 0;
	else if(this.base.x + this.base.width > game.screenWidth)
		x = game.screenWidth - 300;
	else
		x = this.base.x;

	if(this.base.y < 0)
		y = this.base.height + this.base.y + 15;
	else if(this.base.y > game.screenHeight)
		y = game.screenHeight;
	else
		y = this.base.y - 5;

	var str;
	if(this.type == this.id)
		str = this.type;
	else
		str = this.type + ' ' + this.id;
	if(this.name !== null && this.name !== undefined)
		str += ' ' + this.name;
	if(this.specialId !== null && this.specialId !== undefined)
		str += ' #' + this.specialId;
	str += ' ' + this.cards.length;
	game.debug.text(str, x, y );

	game.debug.geom( this._debugActiveSpace, 'rgba(0,127,127,0.3)' ) ;
};

/**
* Переключает режим дебага
*/
Field.prototype.toggleDebugMode = function(){
	this.inDebugMode = !this.inDebugMode;
	this.area.visible = this.inDebugMode;
	if(!this.inDebugMode)
		game.debug.reset();
};