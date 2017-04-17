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

	var defaultOptions = this.options = this.getDefaultOptions();

	for(o in options){
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

	this.alignment = this.options.alignment;
	if(!~['vertical', 'horizontal'].indexOf(this.alignment))
		this.alignment = defaultOptions.alignment;

	this.direction = this.options.direction;
	if(!~['forward', 'backward'].indexOf(this.direction))
		this.direction = defaultOptions.direction;

	this.align = this.options.align;
	if(!~['left', 'center', 'right'].indexOf(this.align))
		this.align = defaultOptions.align;

	this.verticalAlign = this.options.verticalAlign;
	if(!~['top', 'middle', 'bottom'].indexOf(this.verticalAlign))
		this.verticalAlign = defaultOptions.verticalAlign;

	this.flipped = this.options.flipped;

	this.margin = this.options.margin;
	this.padding = this.options.padding;

	this.forcedSpace = this.options.forcedSpace;
	this.focusable = this.options.focusable;
	this.sorting = this.options.sorting;

	this.moveTime = this.options.moveTime;
	this.delayTime = this.options.delayTime;

	if(this.focusable && this.alignment == 'vertical'){
		this.focusable = false;
		console.warn(
			'Field', this.type, this.id, 'set to focusable and ' + this.alignment,
			'. This is not supported, focusable defaulted to false\n', this
		)
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

	this.resize(this.options.width, this.options.height)
	
	game.world.setChildIndex(this.base, 1);	

	this.debugActiveSpace = new Phaser.Rectangle();
	this.isInDebugMode = this.options.debug;
	this.specialId = this.options.specialId;
}

//Возвращает опции по умолчанию
Field.prototype.getDefaultOptions = function(){
	var options = {
		x:0,
		y:0,
		width:0,
		height:0,
		margin:10,
		padding:10,
		minActiveSpace: 10,	//Минимальная ширина\высота для расположения карт

		moveTime: 300,
		delayTime: 100,
		//Нужно ли рассчитывать сдвиг карт по отношению друг к другу или использовать
		//заданное значение
		forcedSpace: false,	

		focusable: true,	//Нужно ли сдвигать карты при наведении
		sorting: true,		//Нужно ли сортировать карты
		
		id:null,
		type:'GENERIC',
		name: null,

		align:'center',			 //Выравнивание по горизонтали
		verticalAlign:'middle',
		//Поворот поля, меняет местами align и verticalAlign (right станет bottom и т.д.),
		//не влияет на width и height
		alignment: 'horizontal', 
		direction: 'forward',	 //Направление поля
		flipped: false,

		texture: null,
		alpha: 0.35,

		debug: true,
		specialId: null
	}
	return options
}


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
}

//Изменяет размер поля
Field.prototype.resize = function(width, height, shouldPlace){
	if(width === null || width === undefined)
		width = this.options.width
	else
		this.options.width = width;

	if(height === null || height === undefined)
		height = this.options.height
	else
		this.options.height = height;

	if(shouldPlace === undefined)
		shouldPlace = false;

	if(this.alignment == 'vertical'){
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
}

Field.prototype.setHighlight = function(on){
	this.area.visible = on || this.isInDebugMode ? true : false;
	this.area.tint = on ? 0xFF8300 : 0xFFFFFF;
	this.area.alpha = on ? 1 : 0.35;
	this.isHighlighted = on;
}


//СОРТИРОВКА

//Сортирует карты
Field.prototype.sortCards = function(){
	if(this.sorting)
		this.cards.sort(this.comparator);
}

//Компаратор сортировки
Field.prototype.comparator = function(a, b){
	if(!a.suit && a.suit !== 0){
		if(b.suit || b.suit === 0)
			return -1
		else
			return 0
	}
	if(!b.suit && b.suit !== 0){
		if(a.suit || a.suit === 0)
			return 1
		else
			return 0
	}
	if(a.suit == b.suit){
		if(a.value == b.value)
			return 0
		else if(a.value > b.value)
			return 1
		else
			return -1;
	}
	else if(a.suit > b.suit)
		return 1
	else
		return -1;
}

Field.prototype.zAlignCards = function(){
	var i = this.direction == 'backward' ? this.cards.length - 1 : 0;
	var iterator = this.direction == 'backward' ? -1 : 1;

	for(; i >= 0 && i < this.cards.length; i += iterator){
		this.cards[i].bringToTop(false);
	}
}



//ОЧЕРЕДЬ

//Добавляет карты в очередь на добавление, возвращает планируемое время добавления
Field.prototype.queueCards = function(newCards, delay){
	if(!newCards.length)
		return;

	//Если задержка не указана, используем задержку последней карты в очереди
	if(typeof delay != 'number' || isNaN(delay)){
		var lastQueuedCard = this.queuedCards[this.queuedCards.length - 1];
		if(lastQueuedCard)
			delay = this.delays[lastQueuedCard.id] || 0
		else
			delay = 0;
	}

	//Устанавливаем задержку для всех карт, равную задержке первой карты в очереди
	for(var ci = 0; ci < this.cards.length; ci++){
		if(this.delays[this.cards[ci].id] === undefined)
			this.delays[this.cards[ci].id] = delay;
	}

	//Устанавливаем задержку для кард в очереди, увеличивая каждую следующую
	for(var ci = 0; ci < newCards.length; ci++){
		var card = newCards[ci];

		//Если карта переходит из поля, одну из карт которых перетаскивает игрок,
		//возвращаем перетаскиваемую карту
		if(controller.card && controller.card.field && controller.card.field == card.field)
			controller.cardReturn();

		this.queuedCards.push(card);
		this.delays[card.id] = delay;
		delay += this.delayTime;
	}

	//Запоминаем задержку для uninteractibleTimer
	this.expectedDelay = delay;
	return delay
}

//Размещает карты из очереди
Field.prototype.placeQueuedCards = function(){
	if(!this.queuedCards.length)
		return;
	
	for(var ci = 0; ci < this.queuedCards.length; ci++){
		var card = this.queuedCards[ci];
		card.field = this;
		this.cards.push(card)
	}

	var bringUpOn = (this.type == 'DECK') ? 'init' : 'start';
	this.sortCards();
	this.placeCards(null, bringUpOn);
	this.setUninteractibleTimer(this.expectedDelay);
	this.queuedCards = [];
	this.delays = {};
	this.expectedDelay = 0;
}

//Очищает очередь на добавление
Field.prototype.resetQueue = function(){
	this.queuedCards = [];
	this.delays = {};
	this.expectedDelay = 0;
}


//ДОБАВЛЕНИЕ КАРТ

//Добавляет карты в поле, возвращает время добавления
Field.prototype.addCards = function(newCards){

	if(!newCards.length)
		return;

	if(this.queuedCards.length){
		var lastQueuedCard = this.queuedCards[this.queuedCards.length - 1];
		var delay = this.delays[lastQueuedCard.id] || 0;
		delay += this.delayTime;
		this.queueCards(newCards, delay);
		this.placeQueuedCards();
		delay += (this.queuedCards.length - 1)*this.delayTime;
		return delay
	}
	else{
		for(var ci = 0; ci < newCards.length; ci++){
			var card = newCards[ci];
			card.field = this;
			this.cards.push(card);
		}
		this.sortCards();
		return this.placeCards(newCards, 'start');
	}
}

//Для добавления одной карты, возвращает время добавления
Field.prototype.addCard = function(card){
	return this.addCards([card]);
}


//РАЗМЕЩЕНИЕ КАРТ

/*
 * Размещает карты в поле
 * @newCards Array (Card) - только что добавленные карты, они будут перемещены в поле по очереди
 * @bringUpOn Bool - когда поднимать карту на передний план ('never', 'init', 'start', 'end')
 * Возвращает задержку следующей карты
 */
Field.prototype.placeCards = function(newCards, bringUpOn, noDelay){

	if(newCards === undefined)
		newCards = null;
	if(noDelay === undefined)
		noDelay = false;

	//Размеры и угол поля
	var areaWidth = (this.alignment == 'vertical') ?  this.area.height : this.area.width;
	var areaHeight = (this.alignment == 'vertical') ? this.area.width : this.area.height;
	var angle = 0;
	if(this.alignment == 'vertical')
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
		requiredActiveWidth *= this.forcedSpace
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
		switch(this.align){
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
			console.warn("Field", this.id, "wants to space cards out by", this.forcedSpace + "px", "but only has", cardSpacing + "px", "available per card\n", this)
		cardSpacing = Math.min(cardSpacing, this.forcedSpace);
	}

	this.cardSpacing = cardSpacing;

	//Проверка выделенной карты
	if(
		controller.card && 
		controller.card != this.focusedCard
	){
		this.focusedCard = null;
	}

	//Индекс выделенной карты
	focusedIndex = this.cards.indexOf(this.focusedCard);

	//Если курсор находится над одной из карт и карты не вмещаются в поле,
	//указываем сдвиг карты от курсора
	if(this.focusedCard && cardWidth*(this.cards.length - 1) > areaActiveWidth){		
		shift = cardWidth - cardSpacing;
	}

	//Создаем массив задержек в зависимости от направления поля
	var delayArray = [];
	var i = this.direction == 'backward' ? this.cards.length - 1 : 0;
	var iterator = this.direction == 'backward' ? -1 : 1;

	for(; i >= 0 && i < this.cards.length; i += iterator){

		var localDelay = noDelay ? 0 : this.delays[this.cards[i].id]; 

		delayArray.push(localDelay)
	}
	
	//Передвигаем карты
	i = (this.direction == 'backward') ? this.cards.length - 1 : 0;
	for(; i >= 0 && i < this.cards.length; i += iterator){

		var card = this.cards[i];	
		var increaseDelayIndex = (newCards && ~newCards.indexOf(card));

		delayIndex = this.moveCard(
			card, i, topMargin, leftMargin, cardSpacing, angle, shift, focusedIndex,
			delayArray, delayIndex, increaseDelayIndex, bringUpOn
		)
	}

	//Поднимаем карту контроллера наверх
	if(controller.card)
		game.cardsGroup.bringToTop(controller.card.base);


	//Дебаг отображение активно используемого пространства
	if(this.isInDebugMode){
		this.debugActiveSpace.x = this.base.x;
		this.debugActiveSpace.y = this.base.y;
		if(this.alignment == 'vertical'){
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
	return delay
}

//Для размещения одной карты
Field.prototype.placeCard = function(card, bringUpOn, noDelay){
	var i = this.cards.indexOf(card);
	if(!~i)
		return;
	return this.placeCards([card], bringUpOn, noDelay);
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
 * @bringUpOn Bool - когда поднимать карту на передний план ('never', 'init', 'start', 'end')
 */
Field.prototype.moveCard = function(
	card, index, topMargin, leftMargin, cardSpacing, angle, shift, focusedIndex,
	delayArray, delayIndex, increaseDelayIndex, bringUpOn
){
	var delay = delayArray[index];
	if(delay === null || delay === undefined){
		delay = this.delayTime*delayIndex;
	}

	//Сдвиг текущей карты
	//card.sprite.scale.setTo(1,1);
	if(this.focusedCard){
		if(index != focusedIndex){
			shift = (index < focusedIndex) ? -shift : shift;				
		}
		else{
			//card.sprite.scale.setTo(1.05, 1.05)
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

	//Горизонтальная позиция состоит из сдвига слева, сдвига по отношению
	//к предыдущим картам, позиции базы поля и сдвига от курсора
	var x = leftMargin + cardSpacing*index + shift;

	//Вертикальная позиция
	var y = topMargin;

	if(this.alignment == 'vertical'){
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
	if(controller.card != card){
		card.moveTo(x, y, this.moveTime, delay, false, true, bringUpOn);
	}
	else{
		controller.cardShiftTrial(card.base.x - x, card.base.y - y);	
		card.setBase(x, y);
	}

	//Проверяем перетаскиваемость карты для тех случаев, когда карта была перемещена
	//без использования presetField метода
	if(this.type == 'HAND' && this.id == game.pid && !card.draggable)
		card.setDraggability(true)
	else if(card.draggable)
		card.setDraggability(false);

	//Добавляем задержку передвижения, если указаны новые карты или
	//если необходимо задерживать смещенные карты
	if(increaseDelayIndex)
		delayIndex++;
	return delayIndex;
}

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
		this.sortCards();
		this.placeCards(null, bringUpOn);
	}
}

//Удаляет все карты из поля
Field.prototype.removeAllCards = function(){
	this.removeCards(this.cards)
}

//Для удаления одной карты
Field.prototype.removeCard = function(card){
	this.removeCards([card])
}

//Ресет поля
Field.prototype.reset = function(){
	this.removeAllCards();
}

Field.prototype.destroy = function(){
	this.removeAllCards();
	this.area.kill();
	this.base.removeAll(true);
	game.world.removeChild(this.base);
}


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
		return false
	else
		return true
}


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
	}, time, this);
}

//Запоминает карту, над которой находится курсор
Field.prototype.focusOnCard = function(card, pointer){
	if(!card || !~this.cards.indexOf(card) || !this.focusable || !this.cardIsInside(card))
		return;

	this.focusedCard = card;
	if(!this.uninteractibleTimer)
		this.placeCards(null, 'init');
}

//Обнуляет запомненную карту, когда курсор с нее ушел
Field.prototype.focusOffCard = function(card){
	if(
		!this.focusedCard ||
		!this.focusable ||
		!this.cardIsInside(this.focusedCard, false) ||
		card != this.focusedCard ||
		~this.cards.indexOf(controller.card)
	)
		return;

	this.focusedCard = null;
	if(!this.uninteractibleTimer)
		this.placeCards(null, 'init');
}


//ДЕБАГ

//Обновляет дебаг
Field.prototype.updateDebug = function(){
	if(!this.isInDebugMode)
		return;
	var x = this.base.x;
	var y = this.base.y - 5;

	var str;
	if(this.type == this.id)
		str = this.type
	else
		str = this.type + ' ' + this.id;
	if(this.name !== null && this.name !== undefined)
		str += ' ' + this.name;
	if(this.specialId !== null && this.specialId !== undefined)
		str += ' #' + this.specialId;
	str += ' ' + this.cards.length;
	game.debug.text(str, x, y );

	game.debug.geom( this.debugActiveSpace, 'rgba(0,127,127,0.3)' ) ;
}

//Переключает режим дебага
Field.prototype.toggleDebugMode = function(){
	this.isInDebugMode = !this.isInDebugMode;
	this.area.visible = this.isInDebugMode;
	if(!this.isInDebugMode)
		game.debug.reset();
}