//ЗНАЧЕНИЯ

/**
* Устанавливает играбильность всех карт в поле.
* @param {boolean} playable играбильность карт
*/
Field.prototype.setPlayability = function(playable){
	for(var ci = 0; ci < this.cards.length; ci++){
		this.cards[ci].setPlayability(playable);
	}
};

Field.prototype.highlightLastCard = function(highlight){
	if(!this.cards.length)
		return;

	var i = 0;
	for(; i < this.cards.length; i++){
		this.cards[i].setHighlight(false);
	}
	if(highlight){
		i = this.direction == 'backward' ? 0 : this.cards.length - 1;
		this.cards[i].setHighlight(highlight);
	}
};

/**
* Устанавливает подсветку поля. По умолчанию зависит от того,
* включен ли дебаг поля.
* @param {boolean} [on=Field#inDebugMode] подствечивать ли поле
* @param {number} [tint=ui.colors.lightBlue]    цвет подсветки
* @param {string} [linkedFieldId=null]      связанное поле, используется `{@link cardControl#cardMoveToField}`
*/
Field.prototype.setHighlight = function(on, tint, linkedFieldId){
	this.highlighted = on;

	var plane;
	switch(this.areaType){
		case 'plain': 
		plane = this.area;
		break;

		case 'curved':
		plane = this.circle;
		break;

		case 'glowing':
		if(this.cards.length){
			this.setVisibility(false);
			this.highlightLastCard(on);
			return;
		}
		plane = this.area;
		break;
	}

	this.setVisibility(on);
	plane.tint = on ? (tint || ui.colors.orange) : ui.colors.lightBlue;
	plane.alpha = on ? 0.35 : this.alpha;
	this.linkedField = fieldManager.fields[linkedFieldId] || null;
};

Field.prototype.setVisibility = function(visible){
	var plane;
	switch(this.areaType){
		case 'plain': 
		plane = this.area;
		break;

		case 'curved':
		plane = this.circle;
		break;

		case 'glowing':
		plane = this.area;
		break;
	}
	plane.visible = visible || this.inDebugMode || this.areaType == 'curved';
};

Field.prototype.popOut = function(popped){
	if(popped == this.poppedOut)
		return;
	this.poppedOut = popped;
	var scale = popped ? 1 + this.focusedScaleDiff : 1;
	for(var i = 0; i < this.cards.length; i++){
		this.cards[i].setScale(scale);
	}
};

//СОРТИРОВКА

/**
* Сортирует карты в `{@link Field#cards}` по значению.
* @private
*/
Field.prototype._sortCards = function(){
	if(this.sorted)
		this.cards.sort(this._compareCards);
};

/**
* Компаратор для сортировки.
* @private
* @see  {@link Field#_sortCards}
* @see  {@link https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Array/sort?v=control|Array#sort}
*/
Field.prototype._compareCards = function(a, b){
	if(!a.suit && a.suit !== 0){
		if(b.suit || b.suit === 0)
			return -1;
		else
			return 0;
	}
	if(!b.suit && b.suit !== 0){
		if(a.suit || a.suit === 0)
			return 1;
		else
			return 0;
	}
	if(a.suit == b.suit){
		if(a.value == b.value)
			return 0;
		else if(a.value > b.value)
			return 1;
		else
			return -1;
	}
	else if(a.suit > b.suit)
		return 1;
	else
		return -1;
};
