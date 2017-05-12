//ПРИВАТНЫЕ ФУНКЦИИ РАЗМЕЩЕНИЯ КАРТ

/**
* Считает отступы сверху и слева
* @private
* @param  {number} requiredActiveWidth необходимая ширина для размещения карт
* @param  {number} areaActiveWidth     реальная ширина для размещения карт
* @param  {number} areaWidth           ширина поля
* @param  {number} areaHeight          высота поля
* @param  {number} cardWidth           ширина карты
* @param  {number} cardHeight          высота карты
* @return {object}                     Возвращает отступы `{top, left}`
*/
Field.prototype._calculateMargin = function(requiredActiveWidth, areaActiveWidth, areaWidth, areaHeight, cardWidth, cardHeight){
	var leftMargin = cardWidth/2 + this.margin;
	var topMargin = 0;
	//Если ширина карт меньше ширины поля, устанавливаем отступ
	//По умолчанию отступ слева уже указан
	if(requiredActiveWidth != areaActiveWidth){
		switch(this.horizontalAlign){
		case 'center':
			leftMargin = (areaWidth - requiredActiveWidth)/2;
			break;
		case 'right':
			leftMargin = areaWidth - requiredActiveWidth - cardWidth/2 - this.margin;
			break;
		}
	}

	//Отступ сверху
	switch(this.verticalAlign){

	//Выравнивание по верхнему краю
	case 'top':
		topMargin = this.margin + cardHeight/2;
		break;

	//Выравнивание по нижнему краю
	case 'bottom':
		topMargin = areaHeight - this.margin - cardHeight/2;
		break;

	//Выравнивание по центру
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
* @param  {boolean} noDelay все задержки равны нулю
* @return {array}   Возращает массив задержек.
*/
Field.prototype._createDelayArray = function(noDelay){
	var delayArray = [],
		i = this.reversed ? this.cards.length - 1 : 0,
		iter = this.reversed ? -1 : 1;

	for(; i >= 0 && i < this.cards.length; i += iter){

		var localDelay = noDelay ? 0 : this.delays[this.cards[i].id]; 

		delayArray.push(localDelay);
	}
	return delayArray;
};

/**
* Считает отступ между картами.
* @private
* @param  {number} activeWidth Активная ширина поля.
* @return {number}             Возвращает отступ между картами.
*/
Field.prototype._calculateCardSpacing = function(activeWidth){
	var cardSpacing = 0;

	if(this.cards.length > 1)
		cardSpacing = activeWidth/(this.cards.length-1);
	if(this.forcedSpace){
		if(cardSpacing < this.forcedSpace && this.cards.length > 1)
			console.warn("Field", this.id, "wants to space cards out by", this.forcedSpace + "px", "but only has", cardSpacing + "px", "available per card\n", this);
		cardSpacing = Math.min(cardSpacing, this.forcedSpace);
	}
	return cardSpacing;
};

/**
* Рассчитывает позицию для карты в соотвествии с индексом и перемещает карту в эту позицию.
* @private
* @param  {Card} card             	    карта
* @param  {number} index               индекс карты в поле
* @param  {number} topMargin           отступ сверху
* @param  {number} leftMargin          отступ слева
* @param  {number} cardSpacing         отступ от предыдущей карты
* @param  {number} angle               угол поворота
* @param  {number} shift               сдвиг от выделенной карты
* @param  {number} focusedIndex        индекс выделенной карты в поле
* @param  {number[]} delayArray        массив задержек карт
* @param  {number} delayIndex          индекс задержки карты
* @param  {BRING_TO_TOP_ON} bringToTopOn       когда поднимать карту на передний план
*/
Field.prototype._moveCard = function(
	card, index, topMargin, leftMargin, cardSpacing, angle, shift, focusedIndex,
	delayArray, delayIndex, bringToTopOn
){

	//Задержка
	var delay = delayArray[index];
	if(delay === null || delay === undefined){
		delay = this.delayTime*delayIndex;
	}

	//Сдвиг текущей карты
	if(this.focusedCard && index != focusedIndex){
		shift = (index < focusedIndex) ? -shift : shift;	
	}
	else {
		shift = 0;
	}

	//Масштаб карты
	if(this.focusedCard && index == focusedIndex){
		card.setScale(1 + this.focusedScaleDiff);
	}
	else{
		card.setScale(1);
	}

	//Устанавливаем сдвиг для козыря в колоде
	if(card.fieldId == 'BOTTOM' && this.cards.length > 1){
		leftMargin += skinManager.skin.trumpOffset;
	}

	if(this.type == 'TABLE'){
		leftMargin += this.area.width/2 - this.margin - this.minActiveSpace/2 - skinManager.skin.width/2;
	}

	//Сдвиг поднятых карт
	var bottomMargin = card.raised ? this.raisedHeight : 0;
	if(this.flipped && this.axis == 'horizontal' || !this.flipped && this.axis == 'vertical')
		bottomMargin = -bottomMargin;

	//Горизонтальная позиция состоит из сдвига слева, сдвига по отношению
	//к предыдущим картам, позиции базы поля и сдвига от курсора
	var x = leftMargin + cardSpacing*index + shift;

	//Вертикальная позиция состоит из двига сверху - сдвиг снизу
	var y = topMargin - bottomMargin;

	//Абсолютная позиция 
	if(this.axis == 'vertical'){
		var temp = x;
		x = y + this.base.x;
		y = temp + this.base.y;
	}
	else{
		x += this.base.x;
		y += this.base.y;
	}

	//Запускаем поворот карты
	y = this._rotateCard(card, angle, x, y, delay, topMargin - bottomMargin);

	//Запускаем перемещение карты
	if(cardControl.card != card){
		card.moveTo(x, y, this.moveTime, delay, false, true, bringToTopOn);
	}
	else{
		cardControl.trailShift(card.base.x - x, card.base.y - y);	
		card.setBase(x, y);
	}

	//Проверяем перетаскиваемость карты для тех случаев, когда карта была перемещена
	//без использования presetField метода
	if(this.type == 'HAND' && this.id == game.pid){
		if(!card.draggable)
			card.setDraggability(true);
	}
	else if(card.draggable){
		card.setDraggability(false);
	}
};

/**
* Поворачивает карту и считает корректированную позицию по оси y.
* @private
* @param  {Card}   card  карта
* @param  {number} angle угол
* @param  {number} x     позиция по x
* @param  {number} y     позиция по y
* @param  {number} delay время задержки
* @return {number}       Возвращает откорректированную позицию по оси y.
*/
Field.prototype._rotateCard = function(card, angle, x, y, delay, margin){

	//Находим угол и сдвигаем y, если поле выгнутое
	if(this.areaType == 'curved'){
		var toCenter = this.circleCenter.x - x + this.base.x,
			distance = Math.sqrt(Math.pow(this.circleRadius, 2) - toCenter*toCenter);
		angle = Math.acos(toCenter/this.circleRadius) - Math.PI/2;
		angle *= (180 / Math.PI);
		y = this.base.y + this.circleCenter.y - distance + margin;
	}
	//Берем сохраненный угол, если поле со случайными углами
	else if(this.randomAngle){
		angle = this.angles[card.id] || 0;
	}
	//Поворачиваем карту, если она на дне колоды
	else if(card.fieldId == 'BOTTOM'){
		angle = Math.abs(angle - 90);
	}	

	card.rotateTo(angle, this.moveTime, delay);

	return y;
};
