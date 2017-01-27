var Spot = function(options){
	this.options = {
		id:null,
		x:0,
		y:0,
		width:0,
		height:0,
		margin:10,
		focusable: true,
		type:'HAND',
		align:'center',
		verticalAlign:'middle'
	};
	for(o in options){
		if(options.hasOwnProperty(o))
			this.options[o] = options[o];
	}

	this.type = this.options.type;
	this.id = this.options.id;

	this.align = this.options.align;
	this.verticalAlign = this.options.verticalAlign;
	this.margin = this.options.margin;

	this.focusable = this.options.focusable;

	this.base = game.add.group();
	this.base.x = this.options.x;
	this.base.y = this.options.y;

	if(this.options.width < sm.skin.width)
		this.options.width = sm.skin.width + 10;

	if(this.options.height < sm.skin.height)
		this.options.height = sm.skin.height + 10;

	this.area = game.add.tileSprite(0, 0, this.options.width + this.margin*2, this.options.height + this.margin*2, 'spot');
	this.base.add(this.area);
	game.world.setChildIndex(this.base, 1);
	this.cards = [];
	this.focusedCard = null;
}

Spot.prototype.sortCards = function(){
	this.cards.sort(this.comparator);
}

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

Spot.prototype.addCards = function(cards){
	for(ci in cards){
		var card = cards[ci];
		card.spot = this;
		this.cards.push(card);
	}
	this.sortCards();
	this.placeCards(cards);
}

Spot.prototype.addCard = function(card){
	this.addCards([card]);
}

Spot.prototype.placeCards = function(newCards, delayMisplaced){

	//Ширина карты
	var cardWidth = sm.skin.width;

	//Необходимая ширина для размещения карт
	var requiredActiveWidth = (this.cards.length-1)*cardWidth;

	//Отступ слева
	var leftMargin = cardWidth/2 + this.margin;

	//Активная ширина поля
	var areaActiveWidth = this.area.width - cardWidth - this.margin*2;

	//Индекс карты под курсором
	var focusedIndex;

	//Сдвиг карты
	var shift = 0;

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
				leftMargin = (this.area.width - requiredActiveWidth)/2;
				break;
			case 'right':
				leftMargin = this.area.width - requiredActiveWidth - cardWidth/2 - this.margin;
				break;
		}
	}

	//Отступ между карт
	var cardSpacing = requiredActiveWidth/(this.cards.length-1);

	//Если курсор находится над одной из карт и карты не вмещаются в поле, указываем сдвиг карты от курсора
	if(this.focusedCard && requiredActiveWidth == areaActiveWidth){
		focusedIndex = this.cards.indexOf(this.focusedCard);
		shift = cardWidth - cardSpacing;
	}
	
	for(ci in this.cards){

		var i = Number(ci);
		var card = this.cards[ci];	

		//Сдвиг текущей карты
		var localShift = 0;
		if(this.focusedCard && ci != focusedIndex )
			localShift = ci < focusedIndex ? -shift : shift;

		//Горизонтальная позиция состоит из сдвига слева, сдвига по отношению к предыдущим картам, позиции базы поля и сдвига от курсора
		var x = leftMargin + cardSpacing*i + this.base.x + localShift;

		//Вертикальная позиция
		var y = this.base.y + this.area.height/2;

		//Добавляем задержку передвижения, если указаны новые карты или если необходимо задерживать смещенные карты
		if(newCards && ~newCards.indexOf(card) || delayMisplaced && (card.base.x != x || card.base.y != y))
			di++;

		//Запускаем перемещение карты
		if(controller.card != card){
			card.moveTo(x, y, 200, 50*di, false, true)
		}
		else{
			controller.cardShiftTrial(card.base.x - x, card.base.y - y)
			card.setBase(x, y);
		}
	}

	//Поднимаем карту контроллера наверх
	if(controller.card)
		cardsGroup.bringToTop(controller.card.base);
}

Spot.prototype.placeCard = function(card, time){
	var i = this.cards.indexOf(card);
	if(!~i)
		return;
	card.returnToBase(time || 200, 0);
	for(i++; i < this.cards.length; i++){
		cardsGroup.bringToTop(this.cards[i].base);
	}
}

Spot.prototype.removeCards = function(cards){
	for(var ci in cards){
		var card = cards[ci];
		var i = this.cards.indexOf(card);
		if(~i){
			this.cards.splice(i, 1);
		}
	}
	this.sortCards();
	this.placeCards();
}

Spot.prototype.removeCard = function(card){
	this.removeCards([card])
}

Spot.prototype.focusOnCard = function(card, pointer){
	if(!card || !~this.cards.indexOf(card) || !this.focusable)
		return;

	this.focusedCard = card;
	this.placeCards();
}

Spot.prototype.focusOffCard = function(){
	if(!this.focusedCard || !this.focusable)
		return;

	this.focusedCard = null;
	this.placeCards();
}

Spot.prototype.reset = function(){
	this.cards = [];
}