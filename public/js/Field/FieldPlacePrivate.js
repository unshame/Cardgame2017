// ПРИВАТНЫЕ ФУНКЦИИ РАЗМЕЩЕНИЯ КАРТ

/**
* Считает отступы сверху и слева
* @private
* @param {number} requiredActiveWidth необходимая ширина для размещения карт
* @param {number} areaActiveWidth     реальная ширина для размещения карт
* @param {number} areaWidth           ширина поля
* @param {number} areaHeight          высота поля
* @param {number} cardWidth           ширина карты
* @param {number} cardHeight          высота карты
*
* @return {object} Возвращает отступы `{top, left}`
*/
Field.prototype._calculateMargin = function(requiredActiveWidth, areaActiveWidth, areaWidth, areaHeight, cardWidth, cardHeight){
	var offset = this.style.margin + this.style.padding;
	var leftMargin = cardWidth/2 + offset;
	var topMargin = 0;
	// Если ширина карт меньше ширины поля, устанавливаем отступ
	// По умолчанию отступ слева уже указан
	if(requiredActiveWidth != areaActiveWidth){
		switch(this.style.horizontalAlign){
		case 'center':
			leftMargin = (areaWidth - requiredActiveWidth)/2;
			break;
		case 'right':
			leftMargin = areaWidth - requiredActiveWidth - cardWidth/2 - offset;
			break;
		case 'centerLeft':
			leftMargin += this.area.width/2 - this.style.padding - this.style.margin - this.style.minActiveSpace/2 - skinManager.skin.width/2;
			break;
		}
	}

	// Отступ сверху
	switch(this.style.verticalAlign){

	// Выравнивание по верхнему краю
	case 'top':
		topMargin = offset + cardHeight/2;
		break;

	// Выравнивание по нижнему краю
	case 'bottom':
		topMargin = areaHeight - offset - cardHeight/2;
		break;

	// Выравнивание по центру
	default:
		topMargin = areaHeight/2;
		break;
	}
	return {
		top: topMargin,
		left: leftMargin
	};
};

/**
* Создает массив задержек.
* @private
* @param {boolean} noDelay все задержки равны нулю
*
* @return {array} Возращает массив задержек.
*/
Field.prototype._createDelayArray = function(noDelay){
	var delayArray = [];

	for(var i = 0; i < this.cards.length; i++){

		var localDelay = noDelay ? 0 : this._delays[this.cards[i].id]; 

		delayArray.push(localDelay);
	}
	return delayArray;
};

/**
* Считает отступ между картами.
* @private
* @param {number} activeWidth Активная ширина поля.
*
* @return {number} Возвращает отступ между картами.
*/
Field.prototype._calculateCardSpacing = function(activeWidth){
	var cardSpacing = 0;

	if(this.cards.length > 1)
		cardSpacing = activeWidth/(this.cards.length-1);
	if(this.style.forcedSpace){
		if(cardSpacing < this.style.forcedSpace && this.cards.length > 1)
			console.warn("Field", this.id, "wants to space cards out by", this.style.forcedSpace + "px", "but only has", cardSpacing + "px", "available per card\n", this);
		cardSpacing = Math.min(cardSpacing, this.style.forcedSpace);
	}
	return cardSpacing;
};

Field.prototype._calculateShift = function(cardWidth, cardSpacing, areaActiveWidth){
	if(this.focusedCard && cardWidth*(this.cards.length - 1) > areaActiveWidth){		
		return shift = cardWidth*(1 + this.style.scaleDiff/2) - cardSpacing;
	}
	return 0;
}

/**
* Рассчитывает позицию для карты в соотвествии с индексом и перемещает карту в эту позицию.
* @private
* @param {Card}            card         карта
* @param {number}          index        индекс карты в поле
* @param {number}          topMargin    отступ сверху
* @param {number}          leftMargin   отступ слева
* @param {number}          cardSpacing  отступ от предыдущей карты
* @param {number}          angle        угол поворота
* @param {number}          shift        сдвиг от выделенной карты
* @param {number}          focusedIndex индекс выделенной карты в поле
* @param {number[]}        delayArray   массив задержек карт
* @param {number}          delayIndex   индекс задержки карты
* @param {BRING_TO_TOP_ON} bringToTopOn когда поднимать карту на передний план
*/
Field.prototype._moveCard = function(
	card, index, topMargin, leftMargin, cardSpacing, angle, shift, focusedIndex,
	delayArray, delayIndex, bringToTopOn
){

	// Задержка
	var delay = delayArray[index];
	if(delay === null || delay === undefined){
		delay = this.delayTime*delayIndex;
	}

	// Сдвиг текущей карты
	if(this.focusedCard && index != focusedIndex){
		shift = (index < focusedIndex) ? -shift : shift;	
	}
	else {
		shift = 0;
	}

	// Масштаб карты
	if(this.focusedCard && index == focusedIndex){
		card.setScale(1 + this.style.scaleDiff);
	}
	else{
		card.setScale(1);
	}

	// Устанавливаем сдвиг для козыря в колоде
	if(this.type == 'DECK' && card.suit !== null){
		leftMargin += skinManager.skin.trumpOffset;
	}

	// Сдвиг поднятых карт
	var bottomMargin = card.raised ? this.style.raisedOffset : 0;
	if(this.style.flipped && this.style.axis == 'horizontal' || !this.style.flipped && this.style.axis == 'vertical')
		bottomMargin = -bottomMargin;

	// Горизонтальная позиция состоит из сдвига слева, сдвига по отношению
	// к предыдущим картам, позиции базы поля и сдвига от курсора
	var x = leftMargin + cardSpacing*index + shift;

	// Вертикальная позиция состоит из двига сверху - сдвиг снизу
	var y = topMargin - bottomMargin;

	// Абсолютная позиция 
	if(this.style.axis == 'vertical'){
		var temp = x;
		x = y + this.x;
		y = temp + this.y;
	}
	else{
		x += this.x;
		y += this.y;
	}

	this._startCardMovers(card, angle, x, y, topMargin - bottomMargin, delay, bringToTopOn);
	this._fixCardDraggability(card);
};

/**
* Запускает твины карты.
* @param  {Card} card         
* @param  {number} angle        
* @param  {number} x            
* @param  {number} y           
* @param  {number} margin      
* @param  {number} delay       
* @param  {BRING_TO_TOP_ON} bringToTopOn
*/
Field.prototype._startCardMovers = function(card, angle, x, y, margin, delay, bringToTopOn){
	// Запускаем поворот карты
	this._rotateCard(card, angle, delay);

	// Запускаем перемещение карты
	if(cardControl.card != card){
		card.moveTo(x, y, this.moveTime, delay, false, true, bringToTopOn);
	}
	else{
		card.setBasePreserving(x, y);
	}
};

/**
* Выставляет перетаскиваемость карты для тех случаев, когда карта была перемещена
* без использования presetField метода.
* @private
* @param {Card} card
*/
Field.prototype._fixCardDraggability = function(card){

	if(this.style.draggable){
		if(!card.draggable){
			card.setDraggability(true);
		}
	}
	else if(card.draggable){
		card.setDraggability(false);
	}
};

/**
* Поворачивает карту и считает корректированную позицию по оси y.
* @private
* @param {Card}   card  карта
* @param {number} angle угол
* @param {number} x     позиция по x
* @param {number} y     позиция по y
* @param {number} delay время задержки
*
* @return {number} Возвращает откорректированную позицию по оси y.
*/
Field.prototype._rotateCard = function(card, angle, delay){


	// Берем сохраненный угол, если поле со случайными углами
	if(this.style.randomAngle){
		angle = this._angles[card.id] || 0;
	}
	// Поворачиваем карту, если она на дне колоды
	else if(this.type == 'DECK' && card.suit !== null){
		angle = Math.abs(angle - 90);
	}	

	card.rotateTo(angle, this.moveTime, delay);
};
