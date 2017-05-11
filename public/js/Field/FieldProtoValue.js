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

/**
* Устанавливает подсветку поля. По умолчанию зависит от того,
* включен ли дебаг поля.
* @param {boolean} [on=Field#inDebugMode] подствечивать ли поле
* @param {number} [tint=ui.colors.lightBlue]    цвет подсветки
* @param {string} [linkedFieldId=null]      связанное поле, используется `{@link cardControl#cardMoveToField}`
*/
Field.prototype.setHighlight = function(on, tint, linkedFieldId){
	var plane = this.curved ? this.circle : this.area;
	this.setVisibility(on);
	plane.tint = on ? (tint || ui.colors.orange) : ui.colors.lightBlue;
	this.linkedField = fieldManager.fields[linkedFieldId] || null;
	plane.alpha = on ? 0.35 : this.alpha;
	this.highlighted = on;
};

Field.prototype.setVisibility = function(visible){
	var plane = this.curved ? this.circle : this.area;
	plane.visible = visible || this.inDebugMode || this.curved;
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
