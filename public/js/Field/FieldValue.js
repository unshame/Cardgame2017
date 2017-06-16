//ЗНАЧЕНИЯ

/**
* Устанавливает играбильность всех карт в поле.
* @param {boolean} playable играбильность карт
*/
Field.prototype.setCardsPlayability = function(playable){
	for(var ci = 0; ci < this.cards.length; ci++){
		this.cards[ci].setPlayability(playable);
	}
};

/**
* Устанавливает подсветку всех карт в поле.
* @param {boolean} highlight подсветка карт
*/
Field.prototype.setCardsHighlight = function(highlight){
	for(var ci = 0; ci < this.cards.length; ci++){
		this.cards[ci].setHighlight(highlight);
	}
};

/**
* Подсвечивает последнюю карту.
* @param  {boolean} highlight включить ли подсветку
*/
Field.prototype.setLastCardHighlight = function(highlight){
	if(!this.cards.length)
		return;

	this.setCardsHighlight(false);
	if(highlight){
		i = this.style.direction == 'backward' ? 0 : this.cards.length - 1;
		this.cards[i].setHighlight(highlight);
	}
};

/**
* Устанавливает подсветку поля. По умолчанию зависит от того,
* включен ли дебаг поля.
* @param {boolean} [on=Field#inDebugMode] подствечивать ли поле
* @param {number} [tint=ui.colors.lightBlue]    цвет подсветки
*/
Field.prototype.setOwnHighlight = function(on, tint){
	this.highlighted = on;

	var plane;
	switch(this.style.area){
		case 'plain': 
		plane = this.area;
		break;

		case 'curved':
		plane = this.circle;
		break;

		case 'glowing':
		if(this.cards.length){
			this.setVisibility(false);
			this.setLastCardHighlight(on);
			return;
		}
		plane = this.area;
		break;
	}

	this.setVisibility(on);
	plane.tint = on ? (tint || ui.colors.orange) : skinManager.skin.color;
	plane.alpha = on ? this.style.alpha : 0.15;
};

/**
* Устанавливает возможность играть карты на поле и подсветку.
* @param {boolean} playable играбильность           
* @param {string} [linkedFieldId=null] связанное поле, используется `{@link CardControl#cardMoveToField}`
*/
Field.prototype.setOwnPlayability = function(playable, linkedFieldId){
	this.playable = playable;
	this.setOwnHighlight(playable, ui.colors.orange);
	this.linkedField = fieldManager.fields[linkedFieldId] || null;
}

/**
* Устанавливает видимость подсветки поля.
* @param {boolean} visible видимость
*/
Field.prototype.setVisibility = function(visible){
	var plane;
	switch(this.style.area){
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
	plane.visible = visible || this.inDebugMode || this.style.area == 'curved';
};

/**
* Устанавливает видимость иконки поля.
* @param {boolean} visible видимость
*/
Field.prototype.setIconVisibility = function(visible){
	if(!this.icon)
		return;

	if(!visible && this.iconStyle.shouldHide || visible && !this.icon.visible){
		this.icon.visible = visible;
	}
};

/**
* Увеличивает или восстанавливает масштаб последней карты в поле.
* @param  {boolean} popped нужно ли увеличить или восстановить масштаб
*/
Field.prototype.setPopOut = function(popped){
	if(popped == this.poppedOut)
		return;
	this.poppedOut = popped;
	var scale = popped ? 1 + this.scaleDiff : 1;
	for(var i = 0; i < this.cards.length - 1; i++){
		this.cards[i].setScale(1);
	}
	this.cards[this.cards.length - 1].setScale(scale);
};

//СОРТИРОВКА

/**
* Сортирует карты в `{@link Field#cards}` по значению.
* @private
*/
Field.prototype._sortCards = function(){
	if(this.style.sortable)
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
