//ПУБЛИЧНЫЕ ФУНКЦИИ РАЗМЕЩЕНИЯ КАРТ

/**
* Размещает карты в поле.
* @param  {Card[]} [newCards=null]       только что добавленные карты, они будут перемещены в поле по очереди
* @param  {BRING_TO_TOP_ON} [bringToTopOn] когда поднимать карту на передний план
* @param  {boolean} [noDelay=false]      все карты будут перемещены без задержки
* @return {number}              Возвращает задержку следующей карты.
*/
Field.prototype.placeCards = function(newCards, bringToTopOn, noDelay){

	if(newCards === undefined)
		newCards = null;
	if(noDelay === undefined)
		noDelay = false;

	//Размеры и угол поля
	var areaWidth = (this.axis == 'vertical') ?  this.area.height : this.area.width;
	var areaHeight = (this.axis == 'vertical') ? this.area.width : this.area.height;
	var angle = 0;

	if(this.axis == 'vertical')
		angle += 90;
	if(this.flipped)
		angle += 180;

	//Размеры карт, ширина включает отступ между картами
	var cardWidth = skinManager.skin.width + this.padding*2;
	var cardHeight = skinManager.skin.height;

	//Активная ширина поля
	var areaActiveWidth = areaWidth - cardWidth - this.margin*2;

	//Необходимая ширина для размещения карт
	var requiredActiveWidth = this.cards.length - 1;
	if(this.forcedSpace)
		requiredActiveWidth*= this.forcedSpace;
	else
		requiredActiveWidth*= cardWidth;

	//Ширина карт не может быть больше активной ширины поля
	if(requiredActiveWidth > areaActiveWidth){

		//Когда карты с отступом не вмещаются в поле, мы убираем отступ
		areaActiveWidth += this.padding*2;
		cardWidth -= this.padding*2;

		requiredActiveWidth = areaActiveWidth;
	}

	//Отступы
	var margin = this._calculateMargin(requiredActiveWidth, areaActiveWidth, areaWidth, areaHeight, cardWidth, cardHeight),
		topMargin = margin.top,
		leftMargin = margin.left;

	//Индекс карты под курсором
	var focusedIndex = null;

	//Сдвиг карты
	var shift = 0;

	//Задержка передвижения
	var delayIndex = 0;

	//Отступ между картами
	var cardSpacing = this._calculateCardSpacing(requiredActiveWidth);
	this.cardSpacing = cardSpacing;	

	//Проверка выделенной карты
	if(
		cardControl.card && 
		cardControl.card != this.focusedCard
	){
		this.focusedCard = null;
	}

	//Индекс выделенной карты
	focusedIndex = this.cards.indexOf(this.focusedCard);

	//Если курсор находится над одной из карт и карты не вмещаются в поле,
	//указываем сдвиг карты от курсора
	if(this.focusedCard && cardWidth*(this.cards.length - 1) > areaActiveWidth){		
		shift = cardWidth*(1 + this.focusedScaleDiff/2) - cardSpacing;
		//Уменьшаем сдвиг для карт в выгнутом поле
		if(this.areaType == 'curved'){
			shift -= 5;
		}
	}

	//Создаем массив задержек в зависимости от направления поля
	var delayArray = this._createDelayArray(noDelay);

	//Передвигаем карты
	var i = this.direction == 'backward' ? this.cards.length - 1 : 0,
		iterator = this.direction == 'backward' ? -1 : 1;
	for(; i >= 0 && i < this.cards.length; i += iterator){

		var card = this.cards[i];	
		var localDelayIndex = delayIndex;

		//Не нужно задерживать карты, которые уже находятся в поле
		if(newCards && !~newCards.indexOf(card))
			localDelayIndex = 0;

		this._moveCard(
			card, i, topMargin, leftMargin, cardSpacing, angle, shift, focusedIndex,
			delayArray, localDelayIndex, bringToTopOn
		);

		//Добавляем задержку передвижения, если указаны новые карты или
		//если необходимо задерживать смещенные карты
		if(newCards && ~newCards.indexOf(card))
			delayIndex++;
	}

	//Поднимаем карту контроллера наверх
	if(cardControl.card)
		cardControl.card.bringToTop(false);

	//Дебаг отображение активно используемого пространства
	if(this.inDebugMode){
		this._setDebugActiveSpace(requiredActiveWidth, cardHeight, leftMargin, topMargin, shift);
	}

	//Возвращаем время задержки
	var delay = delayIndex*this.delayTime + this.moveTime;
	return delay;
};

/**
* Размещает одну карту в поле.
* @param  {Card[]} [card=null]       только что добавленная карта, они будут перемещены в поле по очереди
* @param  {BRING_TO_TOP_ON} bringToTopOn когда поднимать карту на передний план
* @param  {boolean} [noDelay=false]      все карты будут перемещены без задержки
* @return {number}              Возвращает задержку следующей карты.
* @see  {@link Field#placeCards}
*/
Field.prototype.placeCard = function(card, bringToTopOn, noDelay){
	var i = this.cards.indexOf(card);
	if(!~i)
		return;
	return this.placeCards([card], bringToTopOn, noDelay);
};

/**
* Поворачивает все карты.
*/
Field.prototype.rotateCards = function(){
	var angle = 0;
	if(this.axis == 'vertical')
		angle += 90;
	if(this.flipped)
		angle += 180;

	for(var i = 0; i < this.cards.length; i++){
		var card = this.cards[i];
		this._rotateCard(card, angle, card.base.x, card.base.y, 0);
	}
};

/**
* Устанавливает z-index карт.
* @param  {boolean} [checkMover] если true, то будут подняты только карты,
* которые не перемещаются в данный момент.
*/
Field.prototype.zAlignCards = function(checkMover){
	var i = this.direction == 'backward' ? this.cards.length - 1 : 0;
	var iterator = this.direction == 'backward' ? -1 : 1;

	for(; i >= 0 && i < this.cards.length; i += iterator){
		var card = this.cards[i];
		if(!checkMover || !card.mover)
			card.bringToTop(false);
	}
};
