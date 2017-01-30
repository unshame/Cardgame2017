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

var Spot = function(options){

	this.options = this.getDefaultOptions();

	for(o in options){
		if(options.hasOwnProperty(o))
			this.options[o] = options[o];
	}

	this.isInDebugMode = this.options.debug;

	this.cards = [];
	this.delays = {};
	this.queuedCards = [];
	this.focusedCard = null;

	this.type = this.options.type;
	this.id = this.options.id;

	this.alignment = this.options.alignment;
	if(!~['vertical', 'horizontal'].indexOf(this.alignment))
		this.alignment = this.getDefaultOptions().alignment;

	this.direction = this.options.direction;
	if(!~['forward', 'backward'].indexOf(this.direction))
		this.direction = this.getDefaultOptions().direction;

	this.align = this.options.align;
	if(!~['left', 'center', 'right'].indexOf(this.align))
		this.align = this.getDefaultOptions().align;

	this.verticalAlign = this.options.verticalAlign;
	if(!~['top', 'middle', 'bottom'].indexOf(this.verticalAlign))
		this.verticalAlign = this.getDefaultOptions().verticalAlign;

	this.margin = this.options.margin;

	this.forcedSpace = this.options.forcedSpace;
	this.focusable = this.options.focusable;
	this.sorting = this.options.sorting;

	this.moveTime = this.options.moveTime;
	this.delayTime = this.options.delayTime;

	if(this.focusable && this.alignment == 'vertical'){
		this.focusable = false;
		console.warn(
			'Spot', this.type, this.id, 'set to focusable and ' + this.alignment,
			'. This is not supported, focusable defaulted to false\n', this
		)
	}

	this.base = game.add.group();
	this.setBase(this.options.x, this.options.y);

	this.minActiveSpace = this.options.minActiveSpace;

	//Текстура для дебага и область поля
	var pixel = game.make.graphics(0, 0);
	pixel.beginFill(0xffffff);
	pixel.drawRect(0, 0, 1, 1);
	pixel.endFill();

	this.area = game.add.tileSprite(0, 0, 0, 0, pixel.generateTexture());
	this.area.alpha = 0.35;
	this.area.visible = this.isInDebugMode;
	this.base.add(this.area);

	this.resize(this.options.width, this.options.height)
	
	game.world.setChildIndex(this.base, 1);	
}

//Возвращает опции по умолчанию
Spot.prototype.getDefaultOptions = function(){
	var options = {
		x:0,
		y:0,
		width:0,
		height:0,
		margin:10,
		minActiveSpace: 10,	//Минимальная ширина\высота для расположения карт

		moveTime: 200,
		delayTime: 100,
		//Нужно ли рассчитывать сдвиг карт по отношению друг к другу или использовать
		//заданное значение
		forcedSpace: false,	

		focusable: true,	//Нужно ли сдвигать карты при наведении
		sorting: true,		//Нужно ли сортировать карты
		
		id:null,
		type:'GENERIC',

		align:'center',			 //Выравнивание по горизонтали
		verticalAlign:'middle',
		//Поворот поля, меняет местами align и verticalAlign (right станет bottom и т.д.),
		//не влияет на width и height
		alignment: 'horizontal', 
		direction: 'forward',	 //Направление поля

		texture: null,
		alpha: 0.35,

		debug: true
	}
	return options
}


//ПОЗИЦИОНИРОВАНИЕ ПОЛЯ

//Устанавливает позицию поля
Spot.prototype.setBase = function(x, y, shouldPlace){
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
Spot.prototype.resize = function(width, height, shouldPlace){
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
		if(width < sm.skin.height){
			width = sm.skin.height;
		}

		if(height < sm.skin.width){
			height = sm.skin.width + this.minActiveSpace;
		}
	}
	else{
		if(width < sm.skin.width){
			width = sm.skin.width + this.minActiveSpace;
		}

		if(height < sm.skin.height){
			height = sm.skin.height;
		}
	}

	this.area.width = width + this.margin*2,
	this.area.height = height + this.margin*2;

	if(shouldPlace)
		this.placeCards();
}


//СОРТИРОВКА

//Сортирует карты
Spot.prototype.sortCards = function(){
	if(this.sorting)
		this.cards.sort(this.comparator);
}

//Компаратор сортировки
Spot.prototype.comparator = function(a, b){
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


//ОЧЕРЕДЬ

//Добавляет карты в очередь на добавление, возвращает планируемое время добавления
Spot.prototype.queueCards = function(newCards, delay){
	if(!newCards.length)
		return;

	if(typeof delay != 'number'){
		var lastQueuedCard = this.queuedCards[this.queuedCards.length - 1];
		if(lastQueuedCard)
			delay = this.delays[lastQueuedCard.id] || 0
		else
			delay = 0;
	}

	for(var ci in this.cards){
		this.delays[this.cards[ci].id] = delay;
	}

	for(var ci in newCards){
		var card = newCards[ci];		
		this.queuedCards.push(card);
		this.delays[card.id] = delay;
		delay += this.delayTime;
	}
	this.expectedDelay = delay;
	return delay
}

//Размещает карты из очереди
Spot.prototype.placeQueuedCards = function(){
	if(!this.queuedCards.length)
		return;
	
	for(var ci in this.queuedCards){
		var card = this.queuedCards[ci];
		card.spot = this;
		this.cards.push(card)
	}

	var bringUpOn = (this.type == 'DECK') ? 'init' : 'start';
	this.sortCards();
	this.placeCards(null, bringUpOn);
	this.setNoFocusTimer(this.expectedDelay);
	this.queuedCards = [];
	this.delays = {};
	this.expectedDelay = 0;
}

//Очищает очередь на добавление
Spot.prototype.resetQueue = function(){
	this.queuedCards = [];
	this.delays = {};
	this.expectedDelay = 0;
}


//ДОБАВЛЕНИЕ КАРТ

//Добавляет карты в поле, возвращает время добавления
Spot.prototype.addCards = function(newCards){

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
		for(var ci in newCards){
			var card = newCards[ci];
			card.spot = this;
			this.cards.push(card);
		}
		this.sortCards();
		return this.placeCards(newCards, 'start');
	}
}


//РАЗМЕЩЕНИЕ КАРТ

//Для добавления одной карты, возвращает время добавления
Spot.prototype.addCard = function(card){
	return this.addCards([card]);
}

/*
 * Размещает карты в поле
 * @newCards - только что добавленные карты, они будут перемещены в поле по очереди
 * @bringUpOn - когда поднимать карту на передний план ('never', 'init', 'start', 'end')
 * Возвращает задержку следующей карты
 */
Spot.prototype.placeCards = function(newCards, bringUpOn){

	if(newCards === undefined)
		newCards = null;

	//Размеры и угол поля
	var areaWidth = (this.alignment == 'vertical') ?  this.area.height : this.area.width;
	var areaHeight = (this.alignment == 'vertical') ? this.area.width : this.area.height;
	var angle = (this.alignment == 'vertical') ? 90 : 0;

	//Размеры карт
	var cardWidth = sm.skin.width;
	var cardHeight = sm.skin.height;

	//Необходимая ширина для размещения карт
	var requiredActiveWidth = (this.cards.length-1);
	if(this.forcedSpace)
		requiredActiveWidth *= this.forcedSpace
	else
		requiredActiveWidth *= cardWidth;

	//Отступы
	var leftMargin = cardWidth/2 + this.margin;
	var topMargin = 0;

	//Активная ширина поля
	var areaActiveWidth = areaWidth - cardWidth - this.margin*2;

	//Индекс карты под курсором
	var focusedIndex = null;

	//Сдвиг карты
	var shift = 0;

	//Отступ между картами
	var cardSpacing = 0;

	//Задержка передвижения
	var delayIndex = 0;

	//Ширина карт не может быть больше активной ширины поля
	if(requiredActiveWidth > areaActiveWidth){
		requiredActiveWidth = areaActiveWidth;
	}

	//Если ширина карт меньше ширины поля, устанавливаем отступ
	//По умолчанию отступ слева уже указан
	else{
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
	if(this.forcedSpace)
		cardSpacing = Math.min(cardSpacing, this.forcedSpace);

	//Проверка выделенной карты
	if(
		!controller.card && controller.card != this.focusedCard && 
		!this.cardIsInside(this.focusedCard, cardSpacing)
	){
		this.focusedCard = null;
	}

	//Индекс выделенной карты
	focusedIndex = this.cards.indexOf(this.focusedCard);

	//Если курсор находится над одной из карт и карты не вмещаются в поле,
	//указываем сдвиг карты от курсора
	if(this.focusedCard && requiredActiveWidth == areaActiveWidth){		
		shift = cardWidth - cardSpacing;
	}

	//Создаем массив задержек в зависимости от направления поля
	var delayArray = [];
	var i = this.direction == 'backward' ? this.cards.length - 1 : 0;
	var iterator = this.direction == 'backward' ? -1 : 1;

	for(; i >= 0 && i < this.cards.length; i += iterator){

		var localDelay = this.delays[this.cards[i].id]; 

		delayArray.push(localDelay)
	}
	
	//Передвигаем карты
	i = this.direction == 'backward' ? this.cards.length - 1 : 0;
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
		cardsGroup.bringToTop(controller.card.base);

	//Возвращаем время задержки
	var delay = delayIndex*this.delayTime + this.moveTime;
	return delay
}

//Для размещения одной карты
Spot.prototype.placeCard = function(card){
	var i = this.cards.indexOf(card);
	if(!~i)
		return;
	return this.placeCards([card], 'init');
}

/*
 * Перемещает заданную карту в соответствии с переданными данными
 * Внутренний метод, проверка данных не проводится
 * @card - карта
 * @index - индекс карты в поле
 * @topMargin - отступ сверху
 * @leftMargin - отступ слева
 * @cardSpacing - отступ от предыдущей карты
 * @angle - угол поворота
 * @shift - сдвиг от выделенной карты
 * @delayArray - массив задержек карт
 * @focusedIndex - индекс выделенной карты в поле
 * @delayIndex - индекс карты в очереди
 * @increaseDelayIndex - нужно ли увеличивать индекс очереди в конце выполнения функции
 * @bringUpOn - когда поднимать карту на передний план ('never', 'init', 'start', 'end')
 */
Spot.prototype.moveCard = function(
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
	if(card.spotId == 'BOTTOM'){
		leftMargin += 30;
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
	if(card.spotId == 'BOTTOM')
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

	//Добавляем задержку передвижения, если указаны новые карты или
	//если необходимо задерживать смещенные карты
	if(increaseDelayIndex)
		delayIndex++;
	return delayIndex;
}

//УДАЛЕНИЕ КАРТ ИЗ ПОЛЯ

//Удаляет карты из поля
Spot.prototype.removeCards = function(cardsToRemove){
	for(var ci = cardsToRemove.length - 1; ci >= 0; ci--){
		var card = cardsToRemove[ci];
		var i = this.cards.indexOf(card);
		if(~i){
			if(this.focusedCard && this.focusedCard == card)
				this.focusedCard = null;
			this.cards.splice(i, 1);
			card.spot = null;
		}
	}
	if(this.cards.length){
		var bringUpOn = (this.type == 'DECK') ? 'never' : 'end';
		this.sortCards();
		this.placeCards(null, bringUpOn);
	}
}

//Удаляет все карты из поля
Spot.prototype.removeAllCards = function(){
	this.removeCards(this.cards)
}

//Для удаления одной карты
Spot.prototype.removeCard = function(card){
	this.removeCards([card])
}

//Ресет поля
Spot.prototype.reset = function(){
	this.removeAllCards();
}

//БУЛЕВЫ ФУНКЦИИ

//Проверяет нахождение карты внутри поля (по координатам)
Spot.prototype.cardIsInside = function(card, cardSpacing){
	if(cardSpacing === null || cardSpacing === undefined)
		cardSpacing = 0;
	var shift = sm.skin.width - cardSpacing;
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
Spot.prototype.setNoFocusTimer = function(time){

	if(!time || typeof time != 'number')
		return;

	if(this.noFocusTimer)
		game.time.events.remove(this.noFocusTimer);

	this.noFocusTimer = game.time.events.add(time, function(){
		this.placeCards();
		this.noFocusTimer = null;
	}, this);
}

//Запоминает карту, над которой находится курсор
Spot.prototype.focusOnCard = function(card, pointer){
	if(!card || !~this.cards.indexOf(card) || !this.focusable)
		return;

	this.focusedCard = card;
	if(!this.noFocusTimer)
		this.placeCards();
}

//Обнуляет запомненную карту, когда курсор с нее ушел
Spot.prototype.focusOffCard = function(){
	if(!this.focusedCard || !this.focusable)
		return;

	this.focusedCard = null;
	if(!this.noFocusTimer)
		this.placeCards();
}


//ДЕБАГ

//Обновляет позицию названия поля
Spot.prototype.updateDebug = function(){
	if(!this.isInDebugMode)
		return;
	var x = this.base.x;
	var y = this.base.y - 5;

	var str;
	if(this.type == this.id)
		str = this.type
	else
		str = this.type + ' ' + this.id;
	game.debug.text(str, x, y );
}

//Переключает режим дебага
Spot.prototype.toggleDebugMode = function(){
	this.isInDebugMode = !this.isInDebugMode;
	this.area.visible = this.isInDebugMode;
}