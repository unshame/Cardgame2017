/*
 * Конструктор полей карт
 * Производит размещение карт на экране
 * Контролирует позицию карт при наведении курсора
*/

var Spot = function(options){

	this.options = this.getDefaultOptions();

	for(o in options){
		if(options.hasOwnProperty(o))
			this.options[o] = options[o];
	}

	this.cards = [];
	this.focusedCard = null;

	this.type = this.options.type;
	this.id = this.options.id;

	this.direction = this.options.direction;
	this.align = this.options.align;
	this.verticalAlign = this.options.verticalAlign;
	this.margin = this.options.margin;

	this.spacing = this.options.spacing;
	this.focusable = this.options.focusable;
	this.sorting = this.options.sorting;

	this.base = game.add.group();
	this.setBase(this.options.x, this.options.y);

	this.minActiveWidth = this.options.minActiveWidth;

	if(this.options.texture){
		this.area = game.add.tileSprite(0, 0, 0, 0, this.options.texture);
		this.area.alpha = this.options.alpha;
		this.base.add(this.area);
	}
	else{
		this.area = {x:0, y:0, width:0, height:0};
	}

	this.resize(this.options.width, this.options.height)
	
	game.world.setChildIndex(this.base, 1);

	this.isInDebugMode = this.options.debug;
}

Spot.prototype.getDefaultOptions = function(){
	var options = {
		id:null,
		x:0,
		y:0,
		width:0,
		height:0,
		margin:10,
		minActiveWidth: 10,	//Минимальная ширина для расположения карт
		focusable: true,	//Нужно ли сдвигать карты при наведении
		spacing: true,		//Нужно ли рассчитывать сдвиг карт по отношению друг к другу или использовать 1
		sorting: true,	//Нужно ли сортировать карты
		type:'GENERIC',
		align:'center',
		verticalAlign:'middle',
		texture: null,
		alpha: 0.35,
		debug: true,
		direction: 'horizontal'
	}
	return options
}

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

	if(width < sm.skin.width)
		width = sm.skin.width + this.minActiveWidth;

	if(height < sm.skin.height)
		height = sm.skin.height + this.minActiveWidth;

	this.area.width = width + this.margin*2,
	this.area.height = height + this.margin*2;

	if(shouldPlace)
		this.placeCards();
}

//Сортирует карты
Spot.prototype.sortCards = function(){
	if(this.sorting)
		this.cards.sort(this.comparator);
}

//Функция сортировки
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

//Добавляет карты в поле
Spot.prototype.addCards = function(newCards){

	if(!newCards.length)
		return;

	for(ci in newCards){
		var card = newCards[ci];
		card.spot = this;
		this.cards.push(card);
	}
	this.sortCards();
	this.placeCards(newCards);
}

//Для добавления одной карты
Spot.prototype.addCard = function(card){
	
	this.addCards([card]);
}

/*
 * Размещает карты в поле
 * @newCards - только что добавленные карты, они будут перемещены в поле по очереди
 * @delayMisplaced - нужно ли перемещать сдвинутые карты по очереди
 */
Spot.prototype.placeCards = function(newCards, delayMisplaced){

	//console.log(newCards);

	var areaWidth = (this.direction == 'horizontal') ? this.area.width : this.area.height;
	var areaHeight = (this.direction == 'horizontal') ? this.area.height : this.area.width;
	var angle = (this.direction == 'horizontal') ? 0 : 90;

	//Размеры карт
	var cardWidth = sm.skin.width;
	var cardHeight = sm.skin.height;

	//Необходимая ширина для размещения карт
	var requiredActiveWidth = (this.cards.length-1)*cardWidth;

	//Отступы
	var leftMargin = cardWidth/2 + this.margin;
	var topMargin = 0;

	//Активная ширина поля
	var areaActiveWidth = areaWidth - cardWidth - this.margin*2;

	//Индекс карты под курсором
	var focusedIndex;

	//Сдвиг карты
	var shift = 0;

	//Отступ между картами
	var cardSpacing = 0;

	//Задержка передвижения
	var di = 0;

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
	if(!this.spacing)
		cardSpacing = Math.min(cardSpacing, 1);

	//Проверка сфокусированной карты
	if(!controller.card && controller.card != this.focusedCard && !this.cardIsInside(this.focusedCard, cardSpacing)){
		this.focusedCard = null;
	}

	focusedIndex = this.cards.indexOf(this.focusedCard);
	//Если курсор находится над одной из карт и карты не вмещаются в поле, указываем сдвиг карты от курсора
	if(this.focusedCard && requiredActiveWidth == areaActiveWidth){
		
		shift = cardWidth - cardSpacing;
	}
	
	for(ci in this.cards){

		var i = Number(ci);
		var card = this.cards[ci];	

		//Сдвиг текущей карты
		var localShift = 0;
		//card.sprite.scale.setTo(1,1);
		if(this.focusedCard){
			if(ci != focusedIndex){
				localShift = ci < focusedIndex ? -shift : shift;				
			}
			else{
				//card.sprite.scale.setTo(1.05, 1.05)
			}
		}

		//Горизонтальная позиция состоит из сдвига слева, сдвига по отношению к предыдущим картам, позиции базы поля и сдвига от курсора
		var x = this.base.x + leftMargin + cardSpacing*i + localShift;

		//Вертикальная позиция
		var y = this.base.y + topMargin;

		card.rotateTo(angle, 200, 50*di);

		//Запускаем перемещение карты
		if(controller.card != card){
			if(this.type == 'DISCARD_PILE')
				console.log(this.cards.length, di*50);
			card.moveTo(x, y, 200, 50*di, false, true);
		}
		else{
			controller.cardShiftTrial(card.base.x - x, card.base.y - y)
			card.setBase(x, y);
		}

		//Добавляем задержку передвижения, если указаны новые карты или если необходимо задерживать смещенные карты
		if(newCards && ~newCards.indexOf(card) || delayMisplaced && (card.base.x != x || card.base.y != y))
			di++;
	}

	//Поднимаем карту контроллера наверх
	if(controller.card)
		cardsGroup.bringToTop(controller.card.base);
}

//Для размещения одной карты
Spot.prototype.placeCard = function(card){
	var i = this.cards.indexOf(card);
	if(!~i)
		return;
	this.placeCards([card]);
	/*card.returnToBase(time || 200, 0);
	for(i++; i < this.cards.length; i++){
		cardsGroup.bringToTop(this.cards[i].base);
	}*/
}

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
	this.sortCards();
	this.placeCards();
}

//Удаляет все карты из поля
Spot.prototype.removeAllCards = function(){
	this.removeCards(this.cards)
}

//Для удаления одной карты
Spot.prototype.removeCard = function(card){
	this.removeCards([card])
}

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

//Запоминает карту, над которой находится курсор
Spot.prototype.focusOnCard = function(card, pointer){
	if(!card || !~this.cards.indexOf(card) || !this.focusable)
		return;

	this.focusedCard = card;
	this.placeCards();
}

//Обнуляет запомненную карту, когда курсор с нее ушел
Spot.prototype.focusOffCard = function(){
	if(!this.focusedCard || !this.focusable)
		return;

	this.focusedCard = null;
	this.placeCards();
}

Spot.prototype.reset = function(){
	this.removeAllCards();
}

Spot.prototype.updateDebug = function(){
	if(!this.isInDebugMode)
		return;
	var x = this.base.x;
	var y = this.base.y - 5;
	game.debug.text(this.type + ' ' + this.id, x, y );
}