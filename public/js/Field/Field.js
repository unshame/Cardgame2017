/*
 * Конструктор полей карт
 * Производит размещение карт на экране
 * Контролирует позицию карт при наведении курсора
 * Работает с указателями на объекты карт, не с id карт
 * Карты добавляются в поле двумя методами:
 *
 * .queueCards(newCards, delay) и .placeQueuedCards():
 *		Добавляет карты в очередь и размещает их с указанной задержкой
 *		.placeQueuedCards финализирует размещение и должно быть использовано до дальнейшей работы с 
 *		полем. Этот метод также отключает выделение карт при наведении на время перемещения карт.
 *
 * .addCards(newCards)
 * 		Добавляет карты сразу без возможности указания задержки
 *		Задержка рассчитывается автоматически
 *
 * Использование второго метода до финализации первого добавляет карты в очередь и запускает очередь
 * .queueCards(c1) -> .addCards(c2) => .queueCards(c1) -> .queueCards(c2) -> .placeQueuedCards() 
 * Так делать не рекомендуется
 */

var Field = function(options){

	var defaultOptions = this.options = this._getDefaultOptions();

	for(var o in options){
		if(options.hasOwnProperty(o) && options[o] !== undefined){
			this.options[o] = options[o];
		}
	}

	this.cards = [];
	this.delays = {};
	this.queuedCards = [];
	this.focusedCard = null;

	this.type = this.options.type;
	this.id = this.options.id;
	this.name = this.options.name;

	this.axis = this.options.axis;
	if(!~['vertical', 'horizontal'].indexOf(this.axis))
		this.axis = defaultOptions.axis;

	this.direction = this.options.direction;
	if(!~['forward', 'backward'].indexOf(this.direction))
		this.direction = defaultOptions.direction;

	this.horizontalAlign = this.options.horizontalAlign;
	if(!~['left', 'center', 'right'].indexOf(this.horizontalAlign))
		this.horizontalAlign = defaultOptions.horizontalAlign;

	this.verticalAlign = this.options.verticalAlign;
	if(!~['top', 'middle', 'bottom'].indexOf(this.verticalAlign))
		this.verticalAlign = defaultOptions.verticalAlign;

	this.addTo = this.options.addTo;
	if(!~['front', 'back'].indexOf(this.addTo))
		this.addTo = defaultOptions.addTo;

	this.flipped = this.options.flipped;

	this.reversed = this.options.reversed;

	this.margin = this.options.margin;
	this.padding = this.options.padding;
	this.raisedHeight = this.options.raisedHeight;

	this.forcedSpace = this.options.forcedSpace;
	this.focusable = this.options.focusable;
	this.focusedScaleDiff = this.options.focusedScaleDiff;
	this.sorted = this.options.sorted;

	this.moveTime = this.options.moveTime;
	this.delayTime = this.options.delayTime;

	if(this.focusable && this.axis == 'vertical'){
		this.focusable = false;
		console.warn(
			'Field', this.type, this.id, 'set to focusable and ' + this.axis,
			'. This is not supported, focusable defaulted to false\n', this
		);
	}

	this.base = game.add.group();
	this.setBase(this.options.x, this.options.y);

	this.minActiveSpace = this.options.minActiveSpace;

	//Текстура для дебага и область поля
	var pixel = game.newPixel();

	this.area = game.add.sprite(0, 0, pixel.generateTexture());
	this.area.alpha = 0.35;
	this.area.visible = this.isInDebugMode;
	this.base.add(this.area);

	this.isHighlighted = false;

	this.resize(this.options.width, this.options.height);
	
	game.world.setChildIndex(this.base, 1);	

	this.debugActiveSpace = new Phaser.Rectangle();
	this.isInDebugMode = this.options.debug;
	this.specialId = this.options.specialId;
};

//Возвращает опции по умолчанию
Field.prototype._getDefaultOptions = function(){
	var options = {
		x:0,
		y:0,
		width:0,
		height:0,		
		margin:10,		//Отступ по краям поля
		padding:10,		//Отступ между картами
		minActiveSpace: fieldManager.builder.minActiveSpace,	//Минимальная ширина\высота для расположения карт
		raisedHeight: skinManager.skin.height/2,	//Насколько поднимать карты с raised = true

		moveTime: 300,
		delayTime: 100,
		//Нужно ли рассчитывать сдвиг карт по отношению друг к другу или использовать заданное значение
		forcedSpace: false,	

		focusable: true,	//Нужно ли сдвигать карты при наведении
		focusedScaleDiff: 0.025,	//На сколько увеличивать масштаб карт при наведении
		sorted: true,		//Нужно ли сортировать карты
		
		id:null,
		type:'GENERIC',
		name: null,

		horizontalAlign:'center',	//Выравнивание по горизонтали
		verticalAlign:'middle',		//по вертикали
		//Поворот поля, меняет местами horizontalAlign и verticalAlign (right станет bottom и т.д.),
		//не влияет на width и height
		axis: 'horizontal', 	//Направление поля
		direction: 'forward',	//В какую сторону происходит итерация по картам
		addTo: 'front',		//В какой конец поля добавляются карты (front - в конец, back - в начало)
		reversed: false,	//Карты добавляются начиная с последней
		flipped: false,		//Карты распологаются повернутыми на 180 градусов

		texture: null,
		alpha: 0.35,

		debug: false,
		specialId: null		//ID в группе полей для дебага
	};
	return options;
};


//ПОЗИЦИОНИРОВАНИЕ ПОЛЯ

//Устанавливает позицию поля
Field.prototype.setBase = function(x, y, shouldPlace){
	if(x === null || x === undefined)
		x = this.options.x;
	if(y === null || y === undefined)
		y = this.options.y;
	if(shouldPlace === undefined)
		shouldPlace = false;

	this.base.x = this.options.x = x;
	this.base.y = this.options.y = y;

	if(shouldPlace)
		this.placeCards();
};

//Изменяет размер поля
Field.prototype.resize = function(width, height, shouldPlace){
	if(width === null || width === undefined)
		width = this.options.width;
	else
		this.options.width = width;

	if(height === null || height === undefined)
		height = this.options.height;
	else
		this.options.height = height;

	if(shouldPlace === undefined)
		shouldPlace = false;

	if(this.axis == 'vertical'){
		if(width < skinManager.skin.height){
			width = skinManager.skin.height;
		}

		if(height < skinManager.skin.width + this.minActiveSpace){
			height = skinManager.skin.width + this.minActiveSpace;
		}
	}
	else{
		if(width < skinManager.skin.width + this.minActiveSpace){
			width = skinManager.skin.width + this.minActiveSpace;
		}

		if(height < skinManager.skin.height){
			height = skinManager.skin.height;
		}
	}

	this.area.width = width + this.margin*2,
	this.area.height = height + this.margin*2;

	if(shouldPlace)
		this.placeCards();
};

Field.prototype.setHighlight = function(on, tint){
	this.area.visible = on || this.isInDebugMode ? true : false;
	this.area.tint = on ? (tint || game.colors.orange) : 0xFFFFFF;
	this.area.alpha = on ? 0.55 : 0.35;
	this.isHighlighted = on;
};

//СОРТИРОВКА

//Устанавливает z-index карт
Field.prototype.zAlignCards = function(finished){
	var i = this.direction == 'backward' ? this.cards.length - 1 : 0;
	var iterator = this.direction == 'backward' ? -1 : 1;

	for(; i >= 0 && i < this.cards.length; i += iterator){
		var card = this.cards[i];
		if(!finished || !card.mover)
			card.bringToTop(false);
	}
};

//Сортирует карты
Field.prototype._sortCards = function(){
	if(this.sorted)
		this.cards.sort(this._compareCards);
};

//Компаратор сортировки
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

//ОЧЕРЕДЬ

//Добавляет карты в очередь на добавление, возвращает планируемое время добавления
Field.prototype.queueCards = function(newCards, delay){
	if(!newCards.length)
		return;

	var ci;

	//Если задержка не указана, используем задержку последней карты в очереди
	if(typeof delay != 'number' || isNaN(delay)){
		var lastQueuedCard = this.queuedCards[this.queuedCards.length - 1];
		if(lastQueuedCard)
			delay = this.delays[lastQueuedCard.id] || 0;
		else
			delay = 0;
	}

	//Устанавливаем задержку для всех карт, равную задержке первой карты в очереди
	for(ci = 0; ci < this.cards.length; ci++){
		if(this.delays[this.cards[ci].id] === undefined)
			this.delays[this.cards[ci].id] = delay;
	}

	//Устанавливаем задержку для кард в очереди, увеличивая каждую следующую
	for(ci = 0; ci < newCards.length; ci++){
		var card = newCards[ci];

		//Если карта переходит из поля, одну из карт которых перетаскивает игрок,
		//возвращаем перетаскиваемую карту
		if(cardControl.card && cardControl.card.field && cardControl.card.field == card.field)
			cardControl.cardReturn();
		this.queuedCards.push(card);
		this.delays[card.id] = delay;
		delay += this.delayTime;
	}

	//Запоминаем задержку для uninteractibleTimer
	this.expectedDelay = delay;
	return delay;
};

//Размещает карты из очереди
Field.prototype.placeQueuedCards = function(){
	if(!this.queuedCards.length)
		return;
	
	this._appendCards(this.queuedCards);
	var bringUpOn; 
	if(this.type == 'DECK')
		bringUpOn = 'init';
	else if(this.sorted)
		bringUpOn = 'endAll';
	else
		bringUpOn = 'start';
	this._sortCards();
	this.placeCards(null, bringUpOn);
	this.setUninteractibleTimer(this.expectedDelay);
	this.queuedCards = [];
	this.delays = {};
	this.expectedDelay = 0;
};

//Очищает очередь на добавление
Field.prototype.resetQueue = function(){
	this.queuedCards = [];
	this.delays = {};
	this.expectedDelay = 0;
};


//ДОБАВЛЕНИЕ КАРТ

//Добавляет карты в поле, возвращает время добавления
Field.prototype.addCards = function(newCards, noDelay){

	if(!newCards.length)
		return;

	if(this.queuedCards.length){
		var lastQueuedCard = this.queuedCards[this.queuedCards.length - 1];
		var delay = this.delays[lastQueuedCard.id] || 0;
		delay += this.delayTime;
		this.queueCards(newCards, delay);
		this.placeQueuedCards();
		delay += (this.queuedCards.length - 1)*this.delayTime;
		return delay;
	}
	else{
		this._appendCards(newCards);
		this._sortCards();
		return this.placeCards(newCards, 'start', noDelay);
	}
};

//Для добавления одной карты, возвращает время добавления
Field.prototype.addCard = function(card){
	return this.addCards([card]);
};

Field.prototype._appendCards = function(cards){

    for(var ci = 0; ci < cards.length; ci++){
        var card = cards[ci];
        card.field = this;
        if(this.addTo == 'front')
            this.cards.push(card);
        else
            this.cards.unshift(card);
    }
};


//РАЗМЕЩЕНИЕ КАРТ

/*
 * Размещает карты в поле
 * @newCards Array (Card) - только что добавленные карты, они будут перемещены в поле по очереди
 * @bringUpOn Bool - когда поднимать карту на передний план ('never', 'init', 'start', 'end', 'endAll')
 * Возвращает задержку следующей карты
 */
Field.prototype.placeCards = function(newCards, bringUpOn, noDelay){

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
		requiredActiveWidth *= this.forcedSpace;
	else
		requiredActiveWidth *= cardWidth;

	//Ширина карт не может быть больше активной ширины поля
	if(requiredActiveWidth > areaActiveWidth){

		//Когда карты с отступом не вмещаются в поле, мы убираем отступ
		areaActiveWidth += this.padding*2;
		cardWidth -= this.padding*2;

		requiredActiveWidth = areaActiveWidth;
	}

	//Отступы
	var leftMargin = cardWidth/2 + this.margin;
	var topMargin = 0;

	//Индекс карты под курсором
	var focusedIndex = null;

	//Сдвиг карты
	var shift = 0;

	//Отступ между картами
	var cardSpacing = 0;

	//Задержка передвижения
	var delayIndex = 0;

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

	//Отступ между картами
	if(this.cards.length > 1)
		cardSpacing = requiredActiveWidth/(this.cards.length-1);
	if(this.forcedSpace){
		if(cardSpacing < this.forcedSpace && this.cards.length > 1)
			console.warn("Field", this.id, "wants to space cards out by", this.forcedSpace + "px", "but only has", cardSpacing + "px", "available per card\n", this);
		cardSpacing = Math.min(cardSpacing, this.forcedSpace);
	}

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
	}

	//Создаем массив задержек в зависимости от направления поля
	var delayArray = [],
		i = this.direction == 'backward' ? this.cards.length - 1 : 0,
		iterator = this.direction == 'backward' ? -1 : 1,
		k = this.reversed ? this.cards.length - 1 : 0,
		kterator = this.reversed ? -1 : 1;

	for(; k >= 0 && k < this.cards.length; k += kterator){

		var localDelay = noDelay ? 0 : this.delays[this.cards[k].id]; 

		delayArray.push(localDelay);
	}
	
	//Передвигаем карты
	for(; i >= 0 && i < this.cards.length; i += iterator){

		var card = this.cards[i];	
		var increaseDelayIndex = (newCards && ~newCards.indexOf(card));

		delayIndex = this._moveCard(
			card, i, topMargin, leftMargin, cardSpacing, angle, shift, focusedIndex,
			delayArray, delayIndex, increaseDelayIndex, bringUpOn
		);
	}

	//Поднимаем карту контроллера наверх
	if(cardControl.card)
		game.cardsGroup.bringToTop(cardControl.card.base);


	//Дебаг отображение активно используемого пространства
	if(this.isInDebugMode){
		this.debugActiveSpace.x = this.base.x;
		this.debugActiveSpace.y = this.base.y;
		if(this.axis == 'vertical'){
			this.debugActiveSpace.x += topMargin - cardHeight/2;
			this.debugActiveSpace.y += leftMargin - shift;
			this.debugActiveSpace.width = cardHeight;
			this.debugActiveSpace.height = requiredActiveWidth + shift*2;
		}
		else{
			this.debugActiveSpace.x += leftMargin - shift;
			this.debugActiveSpace.y += topMargin - cardHeight/2;
			this.debugActiveSpace.width = requiredActiveWidth + shift*2;
			this.debugActiveSpace.height = cardHeight;
		}
	}

	//Возвращаем время задержки
	var delay = delayIndex*this.delayTime + this.moveTime;
	return delay;
};

//Для размещения одной карты
Field.prototype.placeCard = function(card, bringUpOn, noDelay){
	var i = this.cards.indexOf(card);
	if(!~i)
		return;
	return this.placeCards([card], bringUpOn, noDelay);
};

Field.prototype.rotateCards = function(){
	var angle = 0;
	if(this.axis == 'vertical')
		angle += 90;
	if(this.flipped)
		angle += 180;

	for(var i = 0; i < this.cards.length; i++){
		var card = this.cards[i];	
		if(card.fieldId == 'BOTTOM')
			angle = Math.abs(angle - 90);
		card.rotateTo(angle, this.moveTime, 0);
	}
}

/*
 * Перемещает заданную карту в соответствии с переданными данными
 * Внутренний метод, проверка данных не проводится
 * @card Object (Card) - карта
 * @index Number (int) - индекс карты в поле
 * @topMargin Number (px) - отступ сверху
 * @leftMargin Number (px) - отступ слева
 * @cardSpacing Number (px) - отступ от предыдущей карты
 * @angle Number (градусы) - угол поворота
 * @shift Number (px) - сдвиг от выделенной карты
 * @delayArray Array (мс) - массив задержек карт
 * @focusedIndex Number (int) - индекс выделенной карты в поле
 * @delayIndex Number (int) - индекс карты в очереди
 * @increaseDelayIndex Bool - нужно ли увеличивать индекс очереди в конце выполнения функции
 * @bringUpOn Bool - когда поднимать карту на передний план ('never', 'init', 'start', 'end', 'endAll')
 */
Field.prototype._moveCard = function(
	card, index, topMargin, leftMargin, cardSpacing, angle, shift, focusedIndex,
	delayArray, delayIndex, increaseDelayIndex, bringUpOn
){
	var delay = delayArray[index];
	if(delay === null || delay === undefined){
		delay = this.delayTime*delayIndex;
	}

	//Сдвиг текущей карты
	card.setScale(1);
	if(this.focusedCard){
		if(index != focusedIndex){
			shift = (index < focusedIndex) ? -shift : shift;				
		}
		else{
			card.setScale(1 + this.focusedScaleDiff);
			shift = 0;
		}
	}
	else{
		shift = 0;
	}

	//Устанавливаем сдвиг для козыря в колоде
	if(card.fieldId == 'BOTTOM' && this.cards.length > 1){
		leftMargin += skinManager.skin.trumpOffset;
	}

	var bottomMargin = card.raised ? this.raisedHeight : 0;
	if(this.flipped && this.axis == 'horizontal' || !this.flipped && this.axis == 'vertical')
		bottomMargin = -bottomMargin;

	//Горизонтальная позиция состоит из сдвига слева, сдвига по отношению
	//к предыдущим картам, позиции базы поля и сдвига от курсора
	var x = leftMargin + cardSpacing*index + shift;

	//Вертикальная позиция
	var y = topMargin - bottomMargin;

	if(this.axis == 'vertical'){
		var temp = x;
		x = y + this.base.x;
		y = temp + this.base.y;
	}
	else{
		x += this.base.x;
		y += this.base.y;
	}

	//Устанавливаем поворот карты
	if(card.fieldId == 'BOTTOM')
		angle = Math.abs(angle - 90);
	card.rotateTo(angle, this.moveTime, delay);

	//Запускаем перемещение карты
	if(cardControl.card != card){
		card.moveTo(x, y, this.moveTime, delay, false, true, bringUpOn);
	}
	else{
		cardControl.cardShiftTrail(card.base.x - x, card.base.y - y);	
		card.setBase(x, y);
	}

	//Проверяем перетаскиваемость карты для тех случаев, когда карта была перемещена
	//без использования presetField метода
	if(this.type == 'HAND' && this.id == game.pid && !card.draggable)
		card.setDraggability(true);
	else if(card.draggable)
		card.setDraggability(false);

	//Добавляем задержку передвижения, если указаны новые карты или
	//если необходимо задерживать смещенные карты
	if(increaseDelayIndex)
		delayIndex++;
	return delayIndex;
};

//УДАЛЕНИЕ КАРТ ИЗ ПОЛЯ

//Удаляет карты из поля
Field.prototype.removeCards = function(cardsToRemove){
	for(var ci = cardsToRemove.length - 1; ci >= 0; ci--){
		var card = cardsToRemove[ci];
		var i = this.cards.indexOf(card);
		if(~i){
			if(this.focusedCard && this.focusedCard == card)
				this.focusedCard = null;
			this.cards.splice(i, 1);
			card.field = null;
		}
	}
	if(this.cards.length){
		var bringUpOn = (this.type == 'DECK') ? 'never' : 'end';
		this._sortCards();
		this.placeCards(null, bringUpOn);
	}
};

//Удаляет все карты из поля
Field.prototype.removeAllCards = function(){
	this.removeCards(this.cards);
};

//Для удаления одной карты
Field.prototype.removeCard = function(card){
	this.removeCards([card]);
};

//Ресет поля
Field.prototype.reset = function(){
	this.removeAllCards();
};

Field.prototype.destroy = function(){
	this.removeAllCards();
	this.area.kill();
	this.base.removeAll(true);
	game.world.removeChild(this.base);
};


//БУЛЕВЫ ФУНКЦИИ

//Проверяет нахождение карты внутри поля (по координатам)
Field.prototype.cardIsInside = function(card, includeShift){

	if(includeShift === undefined)
		includeShift = true;

	var shift = 0;
	if(includeShift)
		shift = skinManager.skin.width - this.cardSpacing;

	if(
		!card ||
		card.base.x + card.sprite.x < this.base.x + this.margin - shift ||
		card.base.x + card.sprite.x > this.base.x + this.area.width - this.margin + shift ||
		card.base.y + card.sprite.y < this.base.y + this.margin ||
		card.base.y + card.sprite.y > this.base.y + this.area.height - this.margin
	)
		return false;
	else
		return true;
};


//ВЫДЕЛЕНИЕ КАРТ КУРСОРОМ

//Запускает таймер, во время которого карты не реагируют на курсор
Field.prototype.setUninteractibleTimer = function(time){

	if(!time || typeof time != 'number' || isNaN(time))
		return;

	if(this.uninteractibleTimer){
		clearTimeout(this.uninteractibleTimer);
		this.uninteractibleTimer = null;
	}

	if(game.paused)
		return;

	this.uninteractibleTimer = setTimeout(function(field){
		field.zAlignCards();
		field.uninteractibleTimer = null;
	}, time/game.speed, this);
};

//Запоминает карту, над которой находится курсор
Field.prototype.focusOnCard = function(card, pointer, forced){
	if(!card || !~this.cards.indexOf(card) || !forced && (!this.focusable || !this.cardIsInside(card)))
		return;

	this.focusedCard = card;
	if(!this.uninteractibleTimer || forced){
		this.placeCards(null, 'init');
	}
};

//Обнуляет запомненную карту, когда курсор с нее ушел
Field.prototype.focusOffCard = function(card, forced){
	if(
		!card ||
		!~this.cards.indexOf(card) ||
		!this.focusedCard ||
		!forced && (
			!this.focusable ||
			!this.cardIsInside(this.focusedCard, false) ||
			card != this.focusedCard ||
			~this.cards.indexOf(cardControl.card)
		)
	)
		return;

	this.focusedCard = null;
	if(!this.uninteractibleTimer || forced)
		this.placeCards(null, 'init');
};


//ДЕБАГ

//Обновляет дебаг
Field.prototype.updateDebug = function(){
	if(!this.isInDebugMode)
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

	game.debug.geom( this.debugActiveSpace, 'rgba(0,127,127,0.3)' ) ;
};

//Переключает режим дебага
Field.prototype.toggleDebugMode = function(){
	this.isInDebugMode = !this.isInDebugMode;
	this.area.visible = this.isInDebugMode;
	if(!this.isInDebugMode)
		game.debug.reset();
};