/**
* Конструктор полей карт.  
* Производит размещение карт на экране. Контролирует позицию карт при наведении курсора.
* Возможна подсветка поля.  
* Карты добавляются в поле двумя методами:  
*
** {@link Field#queueCards} -> {@link Field#placeQueuedCards}  
** {@link Field#addCards}  
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
	this.cardsToRemove = [];
	this.validCards = [];
	this.delays = {};
	this.queuedCards = [];
	this.angles = {};
	this.focusedCard = null;
	this.linkedField = null;

	this.type = this.options.type;
	this.id = this.options.id;
	this.name = this.options.name;

	this.iconTexture = this.options.icon;
	this.iconOffset = this.options.iconOffset;
	this.iconShouldHide = this.options.iconShouldHide;

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

	this.areaType = this.options.areaType;
	if(!~['plain', 'curved', 'glowing'].indexOf(this.areaType))
		this.areaType = defaultOptions.areaType;

	this.alpha = this.options.alpha;

	this.base = game.add.group();
	this.setBase(this.options.x, this.options.y);
	if(this.areaType == 'curved'){
		this.circle = game.make.graphics(0, 0);
		this.base.add(this.circle);
	}

	this.minActiveSpace = this.options.minActiveSpace;

	//Текстура для дебага и область поля
	var pixel = ui.newPixel();

	this.area = game.add.image(0, 0, pixel.generateTexture());
	this.area.alpha = this.alpha;
	this.area.visible = this.inDebugMode;
	this.base.add(this.area);

	if(this.iconTexture){
		this.icon = game.add.image(0, 0, this.iconTexture);
		this.icon.frame = this.options.frame;
		this.icon.anchor.set(0.5, 0.5);
		this.base.add(this.icon);
	}
	fieldManager.fieldsGroup.add(this.base);

	this.highlighted = false;
	this.marked = false;
	this.poppedOut = false;

	this.resize(this.options.width, this.options.height);

	if(this.areaType == 'curved'){
		var tween = game.add.tween(this.circle.position);
		this.circle.y = this.area.height;
		tween.to({y: 0}, this.moveTime/game.speed, Phaser.Easing.Quadratic.Out);
		tween.start();
	}
	
	this.debugActiveSpace = new Phaser.Rectangle();
	this.inDebugMode = this.options.debug;
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
		randomAngle: false,	//Нужно ли класть карты в поле под случайным углом
		areaType: 'plain',	//Является ли поле выгнутым

		icon: null,
		frame: 0,
		iconOffset: {x: 0, y:0},
		iconShouldHide: false,

		alpha: 0.15,

		debug: false,
		specialId: null		//ID в группе полей для дебага
	};
	return options;
};

//@include:FieldPosition
//@include:FieldValue
//@include:FieldQueue
//@include:FieldAdd
//@include:FieldDelete
//@include:FieldPlacePrivate
//@include:FieldPlacePublic
//@include:FieldPlaceCursor

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

	return card && Phaser.Rectangle.containsRaw(
		this.base.x + this.margin - spacing - addX,
		this.base.y + this.margin - addY,
		this.area.width + addX*2 + spacing*2,
		this.area.height + addY*2,
		card.base.x + card.sprite.x,
		card.base.y + card.sprite.y
	);
};

//ДЕБАГ

/**
* Сохраняет размеры активного места для отображения.
* @private
* @param {number} activeWidth ширина активного места
* @param {number} cardHeight  высота карт
* @param {number} leftMargin  отступ слева
* @param {number} topMargin   отступ сверху
* @param {number} shift       отступ от выделенной карты
*/
Field.prototype._setDebugActiveSpace = function(activeWidth, cardHeight, leftMargin, topMargin, shift){
	this.debugActiveSpace.x = this.base.x;
	this.debugActiveSpace.y = this.base.y;
	if(this.axis == 'vertical'){
		this.debugActiveSpace.x += topMargin - cardHeight/2;
		this.debugActiveSpace.y += leftMargin - shift;
		this.debugActiveSpace.width = cardHeight;
		this.debugActiveSpace.height = activeWidth + shift*2;
	}
	else{
		this.debugActiveSpace.x += leftMargin - shift;
		this.debugActiveSpace.y += topMargin - cardHeight/2;
		this.debugActiveSpace.width = activeWidth + shift*2;
		this.debugActiveSpace.height = cardHeight;
	}
};

/**
* Обновляет дебаг
*/
Field.prototype.updateDebug = function(){
	if(!this.inDebugMode)
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
	this.inDebugMode = !this.inDebugMode;
	this.area.visible = this.inDebugMode;
	if(!this.inDebugMode)
		game.debug.reset();
};
