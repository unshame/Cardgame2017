// ЗНАЧЕНИЯ

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
* Устанавливает подсветку поля. По умолчанию зависит от того,
* включен ли дебаг поля.
* @param {boolean} [on=Field#inDebugMode]     подствечивать ли поле
* @param {number}  [tint=ui.colors.lightBlue] цвет подсветки
*/
Field.prototype.setOwnHighlight = function(on, tint){
	if(tint === undefined){
		tint = ui.colors.orange;
	}
	this.highlighted = on;
	this.setVisibility(on);
	this.area.tint = on ? tint : skinManager.skin.color;
	this.area.alpha = (this.style.alwaysVisible || on) ? this.style.alpha : 0.15;
};

/**
* Устанавливает возможность играть карты на поле и подсветку.
* @param {(string|boolean)} playable             играбильность и тип применимого действия
* @param {string}           [linkedFieldId=null] связанное поле, используется `{@link CardControl#cardMoveToField}`
*/
Field.prototype.setOwnPlayability = function(playable, linkedField){
	this.playable = playable;
	this.setOwnHighlight(playable, ui.colors.orange);
	this.linkedField = linkedField || null;
};

/**
* Устанавливает видимость подсветки поля.
* @param {boolean} visible видимость
*/
Field.prototype.setVisibility = function(visible){
	this.area.visible = this.style.alwaysVisible || visible || this.inDebugMode;
};

/**
* Увеличивает или восстанавливает масштаб последней карты в поле.
* @param {boolean} popped нужно ли увеличить или восстановить масштаб
*/
Field.prototype.setPopOut = function(popped){
	if(popped == this.poppedOut){
		return;
	}
	this.poppedOut = popped;
	var scale = popped ? 1 + this.style.scaleDiff : 1;
	for(var i = 0; i < this.cards.length - 1; i++){
		this.cards[i].setScale(1);
	}
	this.cards[this.cards.length - 1].setScale(scale);
};

// СОРТИРОВКА

/**
* Сортирует карты в `{@link Field#cards}` по значению.
*/
Field.prototype.sortCards = function(){
	var sorting = gameOptions.get('ui_sorting');
	if(this.style.sortable && sorting !== 0){
		this.cards.sort(this._compareCards.bind(this, sorting));
	}
};

/**
* Компаратор для сортировки.
* @see  {@link Field#sortCards}
* @see  {@link https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Array/sort?v=control|Array#sort}
*/
Field.prototype._compareCards = function(sorting, a, b){
	console.log(sorting)
	if(!a.suit && a.suit !== 0){
		if(b.suit || b.suit === 0){
			return -1;
		}
		return 0;
	}
	if(!b.suit && b.suit !== 0){
		if(a.suit || a.suit === 0){
			return 1;
		}
		return 0;
	}

	if(sorting === 1){
		if(a.suit == b.suit){
			if(a.value == b.value){
				return 0;
			}
			if(a.value < b.value){
				return 1;
			}
			return -1;
		}
		if(a.suit > b.suit){
			return 1;
		}
		return -1;
	}
	else{
		if(a.suit == gameInfo.trumpSuit && b.suit !== gameInfo.trumpSuit){
			return -1;
		}
		if(b.suit == gameInfo.trumpSuit && a.suit !== gameInfo.trumpSuit){
			return 1;
		}
		if(a.value == b.value){
			if(a.suit == b.suit){
				return 0;
			}
			if(a.suit > b.suit){
				return 1;
			}
			return -1;
		}
		if(a.value < b.value){
			return 1;
		}
		return -1;

	}
};
