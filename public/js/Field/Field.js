/**
 * Конструктор полей карт.  
 * Производит размещение карт на экране. Контролирует позицию карт при наведении курсора.
 * Возможна подсветка поля.  
 * Карты добавляются в поле двумя методами:  
 *
 * * {@link Field#queueCards} -> {@link Field#placeQueuedCards}  
 * * {@link Field#addCards}  
 *
 * Использование второго метода до финализации первого добавляет карты в очередь и запускает очередь  
 * `.queueCards(c1)` -> `.addCards(c2)` => `.queueCards(c1)` -> `.queueCards(c2)` -> `.placeQueuedCards()`   
 * @constructor
 */

var Field = function(options){

	var defaultOptions = this.options = Field.getDefaultOptions();

	for(var o in options){
		if(options.hasOwnProperty(o) && options[o] !== undefined){
			this.options[o] = options[o];
		}
	}

	this.cards = [];
	this.delays = {};
	this.queuedCards = [];
	this.angles = {};
	this.focusedCard = null;
	this.linkedField = null;

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

	this.randomAngle = this.options.randomAngle;

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
	var pixel = ui.newPixel();

	this.area = game.add.sprite(0, 0, pixel.generateTexture());
	this.area.alpha = 0.35;
	this.area.visible = this.isInDebugMode;
	this.base.add(this.area);
	fieldManager.fieldsGroup.add(this.base);

	this.isHighlighted = false;

	this.resize(this.options.width, this.options.height);
	
	this.debugActiveSpace = new Phaser.Rectangle();
	this.isInDebugMode = this.options.debug;
	this.specialId = this.options.specialId;
};

/**
 * Возвращает опции по умолчанию
 */
Field.getDefaultOptions = function(){
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
		randomAngle: false,

		texture: null,
		alpha: 0.35,

		debug: false,
		specialId: null		//ID в группе полей для дебага
	};
	return options;
};


//ПОЗИЦИОНИРОВАНИЕ ПОЛЯ

/**
 * Устанавливает позицию поля.
 * @param {number} x            по горизонтали
 * @param {number} y            по вертикали
 * @param {boolean} shouldPlace нужно ли размещать карты после установки
 */
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

/**
 * Устанавливает размер поля.
 * @param  {number} width        ширина
 * @param  {number} height       высота
 * @param  {boolean} shouldPlace нужно ли размещать карты после установки
 */
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

/**
 * Устанавливает подсветку поля. По умолчанию зависит от того,
 * включен ли дебаг поля.
 * @param {boolean} [on=Field#isInDebugMode] подствечивать ли поле
 * @param {number} [tint=ui.colors.white]    цвет подсветки
 * @param {string} [linkedFieldId=null]      связанное поле, используется `{@link cardControl#cardMoveToField}`
 */
Field.prototype.setHighlight = function(on, tint, linkedFieldId){
	this.area.visible = (on || this.isInDebugMode) ? true : false;
	this.area.tint = on ? (tint || ui.colors.orange) : ui.colors.white;
	this.linkedField = fieldManager.fields[linkedFieldId] || null;
	this.area.alpha = on ? 0.55 : 0.35;
	this.isHighlighted = on;
};

//СОРТИРОВКА

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

//ОЧЕРЕДЬ

/**
 * Добавляет карты в очередь на добавление.
 * @param  {Card[]} newCards добавляемые карты
 * @param  {number} delay	задержка, добавляемая к первой карте в очереди
 * @return {number}		  Планируемое время добавления
 * @see  {@link Field#placeQueuedCards}
 */
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

/**
 * Размещает карты из очереди.
 * @see  {@link Field#queueCards}
 */
Field.prototype.placeQueuedCards = function(){
	if(!this.queuedCards.length)
		return;
	
	this._appendCards(this.queuedCards);
	var bringToTopOn; 
	if(this.type == 'DECK')
		bringToTopOn = BRING_TO_TOP_ON.INIT;
	else if(this.sorted)
		bringToTopOn = BRING_TO_TOP_ON.END_ALL;
	else
		bringToTopOn = BRING_TO_TOP_ON.START;
	this._sortCards();
	this.placeCards(null, bringToTopOn);
	this.setUninteractibleTimer(this.expectedDelay);
	this.queuedCards = [];
	this.delays = {};
	this.expectedDelay = 0;
};

/**
 * Очищает очередь на добавление.
 * @see  {@link Field#queueCards}
 * @see  {@link Field#placeQueuedCards}
 */
Field.prototype.resetQueue = function(){
	this.queuedCards = [];
	this.delays = {};
	this.expectedDelay = 0;
};


//ДОБАВЛЕНИЕ КАРТ

/**
 * Добавляет карты в поле.
 * @param {Card[]} newCards - добавляемые карты
 * @param {boolean} noDelay  - убирает время ожидание перед добавлением карт
 * @return {number} Время добавления
 */
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
		return this.placeCards(newCards, BRING_TO_TOP_ON.START, noDelay);
	}
};

/**
 * Добавляет одну карту в поле.
 * @param {Card} card - добавляемая карта
 * @return {number} Время добавления
 * @see {@link Field#addCards}
 */
Field.prototype.addCard = function(card){
	return this.addCards([card]);
};

/**
 * Добавляет карты в `{@link Field#cards}`.
 * Вычисляет и сохраняет угол карты в `{@link Field#angles}`, если указан `{@link Field#randomAngle}`.
 * @private
 * @param  {Card[]} cards карты для добавления
 */
Field.prototype._appendCards = function(cards){

	var card, ci,
		addedAngle,
		lastAngle = this.randomAngle ? Math.floor(Math.random()*10) * (Math.random() > 0.5 ? 1 : -1) - 12 : undefined;

	//Находим угол последней карты
	if(this.randomAngle){		
		for(ci = 0; ci < this.cards.length; ci++){
			card = this.cards[ci];
			if(typeof this.angles[card.id] == 'number')
				lastAngle = this.angles[card.id];
		}
	}

	for(ci = 0; ci < cards.length; ci++){
		card = cards[ci];
		card.field = this;
		if(this.addTo == 'front')
			this.cards.push(card);
		else
			this.cards.unshift(card);

		//Сохраняем новый угол карты
		if(this.randomAngle){
			addedAngle = (Math.floor(Math.random()*5) + 8);
			if(this.randomAngle == 'bi' && Math.random() > 0.5 || this.randomAngle != 'bi' && this.direction == 'backward'){
				addedAngle = -addedAngle;
			}
			lastAngle += addedAngle;
			this.angles[card.id] = lastAngle;
		}
	}
};


//РАЗМЕЩЕНИЕ КАРТ

/**
 * Размещает карты в поле.
 * @param  {Card[]} [newCards=null]       только что добавленные карты, они будут перемещены в поле по очереди
 * @param  {BRING_TO_TOP_ON} bringToTopOn когда поднимать карту на передний план
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
			delayArray, delayIndex, increaseDelayIndex, bringToTopOn
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

/**
 * Размещает одну карту в поле.
 * @param  {Card[]} [newCards=null]       только что добавленная карта, они будут перемещены в поле по очереди
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

		if(this.randomAngle && typeof this.angles[card.id] == 'number')
			angle = this.angles[card.id];
		else if(card.fieldId == 'BOTTOM')
			angle = Math.abs(angle - 90);
		
		card.rotateTo(angle, this.moveTime, 0);
	}
};

/**
 * Перемещает заданную карту в соответствии с переданными данными.
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
 * @param  {boolean} increaseDelayIndex нужно ли увеличивать индекс задержки в конце выполнения функции
 * @param  {BRING_TO_TOP_ON} bringToTopOn       когда поднимать карту на передний план
 * @return {number}                   Возвращает индекс задержки следующей карты. 
 */
Field.prototype._moveCard = function(
	card, index, topMargin, leftMargin, cardSpacing, angle, shift, focusedIndex,
	delayArray, delayIndex, increaseDelayIndex, bringToTopOn
){
	var delay = delayArray[index];
	if(delay === null || delay === undefined){
		delay = this.delayTime*delayIndex;
	}

	if(this.randomAngle){
		angle = this.angles[card.id] || 0;		
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
		card.moveTo(x, y, this.moveTime, delay, false, true, bringToTopOn);
	}
	else{
		cardControl.trailShift(card.base.x - x, card.base.y - y);	
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

/**
 * Удаляет карты из поля.
 * @param  {Card[]} cardsToRemove карты для удаления
 */
Field.prototype.removeCards = function(cardsToRemove){
	for(var ci = cardsToRemove.length - 1; ci >= 0; ci--){
		var card = cardsToRemove[ci];
		var i = this.cards.indexOf(card);
		if(~i){
			if(this.focusedCard && this.focusedCard == card)
				this.focusedCard = null;
			this.cards.splice(i, 1);
			card.field = null;
			this.angles[card.id] = null;
		}
	}
	if(this.cards.length){
		var bringToTopOn = (this.type == 'DECK') ? BRING_TO_TOP_ON.NEVER : BRING_TO_TOP_ON.END;
		this._sortCards();
		this.placeCards(null, bringToTopOn);
	}
};

/**
 * Удаляет все карты из поля.
 * @see  {@link Field#removeCards}
 */
Field.prototype.removeAllCards = function(){
	this.removeCards(this.cards);
};

/**
 * Удаляет одну карту из поля.
 * @param  {Card} cardToRemove карта для удаления
 * @see  {@link Field#removeCards}
 */
Field.prototype.removeCard = function(cardToRemove){
	this.removeCards([cardToRemove]);
};

/**
 * Ресет поля. На данный момент только удаляет все карты из поля.
 * @see  {@link Field#removeAllCards}
 */
Field.prototype.reset = function(){
	this.removeAllCards();
};

/**
 * Полностью уничтожает поле, убирае все карты предварительно.
 */
Field.prototype.destroy = function(){
	this.removeAllCards();
	this.area.kill();
	this.base.removeAll(true);
	game.world.removeChild(this.base);
};


//БУЛЕВЫ ФУНКЦИИ

/**
 * Проверяет нахождение карты внутри поля (по координатам).
 * @param  {Card} card                     проверяемая карта
 * @param  {boolean} [includeSpacing=true] нужно ли учитывать сдвиг карт друг от друга
 * @param  {boolean} [includeWholeCard=false]      если false, то центр карты должен быть внутри поля, иначе - любая часть карты
 * @return {boolean} Находится ли карта в поле.
 */
Field.prototype.cardIsInside = function(card, includeSpacing, includeWholeCard){

	if(includeSpacing === undefined)
		includeSpacing = true;

	if(includeWholeCard === undefined)
		includeWholeCard = false;

	var spacing = 0;
	if(includeSpacing)
		spacing = skinManager.skin.width - this.cardSpacing;

	var addX = 0,
		addY = 0;
	if(includeWholeCard){
		addX = skinManager.skin.width/2;
		addY = skinManager.skin.height/2;
	}

	if(
		!card ||
		card.base.x + card.sprite.x < this.base.x + this.margin - spacing - addX ||
		card.base.x + card.sprite.x > this.base.x + this.area.width - this.margin + spacing + addX ||
		card.base.y + card.sprite.y < this.base.y + this.margin - addY ||
		card.base.y + card.sprite.y > this.base.y + this.area.height - this.margin + addY
	)
		return false;
	else
		return true;
};


//ВЫДЕЛЕНИЕ КАРТ КУРСОРОМ

/**
 * Запускает таймер, во время которого карты не реагируют на курсор.
 * @param {number} time время таймера
 */
Field.prototype.setUninteractibleTimer = function(time){

	if(!time || typeof time != 'number' || isNaN(time))
		return;

	if(this.uninteractibleTimer){
		clearTimeout(this.uninteractibleTimer);
		this.uninteractibleTimer = null;
	}

	if(game.paused)
		return;

	function makeInteracible(){
		this.zAlignCards();
		this.uninteractibleTimer = null;
	}

	this.uninteractibleTimer = setTimeout(makeInteracible.bind(this), time/game.speed);
};

/**
 * Выделяет карту, над которой находится курсор.
 * @param  {Card} card      выделенная карта
 * @param  {Phaser.Pointer} pointer курсор
 * @param  {boolean} [forced]  заставляет поле выделить карту, даже если она не находится в пределах поля
 * или поле не выделяет карты при наведении
 */
Field.prototype.focusOnCard = function(card, pointer, forced){
	if(!card || !~this.cards.indexOf(card) || !forced && (!this.focusable || !this.cardIsInside(card)))
		return;

	this.focusedCard = card;
	if(!this.uninteractibleTimer || forced){
		this.placeCards(null, BRING_TO_TOP_ON.INIT);
	}
};

/**
 * Убирает выделение карты.
 * @param  {Card} card   выделенная карта
 * @param  {boolean} [forced] заставляет поле убрать выделение карты, даже если поле не стало бы этого делать
 */
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
		this.placeCards(null, BRING_TO_TOP_ON.INIT);
};


//ДЕБАГ

/**
 * Обновляет дебаг
 */
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

/**
 * Переключает режим дебага
 */
Field.prototype.toggleDebugMode = function(){
	this.isInDebugMode = !this.isInDebugMode;
	this.area.visible = this.isInDebugMode;
	if(!this.isInDebugMode)
		game.debug.reset();
};