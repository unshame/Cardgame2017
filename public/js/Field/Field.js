/**
* Конструктор полей карт ({@link Card}).  
* Производит размещение карт на экране. Контролирует позицию карт при наведении курсора.
* Возможна подсветка поля.  
* Карты добавляются в поле двумя методами:  
*
** {@link Field#queueCards} -> {@link Field#placeQueuedCards}  
** {@link Field#addCards}  
*
* Использование второго метода до финализации первого добавляет карты в очередь и запускает очередь  
* `.queueCards(c1)` -> `.addCards(c2)` => `.queueCards(c1)` -> `.queueCards(c2)` -> `.placeQueuedCards()`   
* @class
* @param {object} options Опции используемые при создании поля.
* @param {number} options.x=0	{@link Field#base} позиция по горизонтали
* @param {number} options.y=0	{@link Field#base} позиция по вертикали
* @param {number} options.width=0	{@link Field#area} ширина поверхности
* @param {number} options.height=0	{@link Field#area} высота поверхности
* @param {number} options.margin=10	{@link Field#margin}
* @param {number} options.padding=10 {@link Field#padding}	
* @param {number} options.minActiveSpace=fieldManager.builder.minActiveSpace {@link Field#minActiveSpace}	
* @param {number} options.raisedHeight=skinManager.skin.height/2 {@link Field#raisedHeight}		
* @param {number} options.moveTime=300 {@link Field#moveTime}	
* @param {number} options.delayTime=100 {@link Field#delayTime}	
* @param {(boolean|number)} options.forcedSpace=false {@link Field#forcedSpace}		
* @param {boolean} options.focusable=true {@link Field#focusable}	
* @param {number} options.focusedScaleDiff=0.025 {@link Field#focusedScaleDiff}	
* @param {boolean} options.sorted=true {@link Field#sorted}	
* @param {string} options.id=null {@link Field#id}	
* @param {string} options.type='GENERIC' {@link Field#type}	
* @param {string} options.name=null {@link Field#name}	
* @param {string} options.horizontalAlign='center' {@link Field#horizontalAlign}	
* @param {string} options.verticalAlign='middle' {@link Field#verticalAlign}	
* @param {string} options.axis='horizontal'  {@link Field#axis}	
* @param {string} options.direction='forward'	 {@link Field#direction}	
* @param {string} options.addTo='front'	 {@link Field#addTo}		
* @param {boolean} options.reversed=false {@link Field#reversed}		
* @param {boolean} options.flipped=false	 {@link Field#flipped}		
* @param {boolean} options.randomAngle=false {@link Field#randomAngle}		
* @param {string} options.areaType='plain' {@link Field#areaType}		
* @param {string} options.icon=null {@link Field#iconTexture} текстура иконки	
* @param {number} options.frame=0 {@link Field#icon} кадр текстуры иконки
* @param {number} options.alpha=0.15 {@link Field#alpha}	
* @param {boolean} options.debug=false {@link Field#inDebugMode}	
* @param {number} options.specialId=null {@link Field#specialId}	
*/

var Field = function(options){

	var defaultOptions = this.options = Field.getDefaultOptions();

	for(var o in options){
		if(options.hasOwnProperty(o) && options[o] !== undefined){
			this.options[o] = options[o];
		}
	}

	/**
	 * Карты поля.
	 * @type {Card[]}
	 */
	this.cards = [];

	/**
	 * Карты на удаление.
	 * @type {Card[]}
	 * @see {@link FieldManager#queueCards}
	 */
	this.cardsToRemove = [];

	/**
	 * Карты, которые могут быть сыграны на это поле.
	 * @type {Card[]}
	 * @see  {@link highlightPossibleActions}
	 */
	this.validCards = [];

	/**
	 * Задержки карт по id карт.
	 * @private
	 * @type {object<string>}
	 */
	this._delays = {};

	/**
	 * Карты в очереди на добавление.
	 * @type {Card[]}
	 * @private
	 */
	this._queuedCards = [];

	/**
	 * Углы карт по id карт.
	 * @type {Object<number>}
	 * @private
	 */
	this._angles = {};

	/**
	 * Выделенная карта.
	 * @type {Card}
	 */
	this.focusedCard = null;

	/**
	 * Связанное поле.
	 * @type {Field}
	 * @see {@link CardControl#cardMoveToField}
	 */
	this.linkedField = null;

	/**
	 * Тип поля
	 * @type {string}
	 */
	this.type = this.options.type;

	/**
	 * id поля
	 * @type {string}
	 */
	this.id = this.options.id;

	/**
	 * Имя поля
	 * @type {string}
	 */
	this.name = this.options.name;

	/**
	 * Текстура иконки поля.
	 * @type {string}
	 */
	this.iconTexture = this.options.icon;
	this.iconOffset = this.options.iconOffset;
	this.iconShouldHide = this.options.iconShouldHide;

	/**
	 * Ориентация поля. Меняет местами horizontalAlign и verticalAlign 
	 * (right станет bottom и т.д.), не влияет на width и height.  
	 * Значения: `'vertical', 'horizontal'`
	 * @type {string}
	 */
	this.axis = this.options.axis;
	if(!~['vertical', 'horizontal'].indexOf(this.axis))
		this.axis = defaultOptions.axis;

	/**
	 * Направление поля.  
	 * Значения: `'forward', 'backward'`
	 * @type {string}
	 */
	this.direction = this.options.direction;
	if(!~['forward', 'backward'].indexOf(this.direction))
		this.direction = defaultOptions.direction;

	/**
	 * Горизонтальное выравнивание поля.  
	 * Значения: `'left', 'center', 'right'`
	 * @type {string}
	 */
	this.horizontalAlign = this.options.horizontalAlign;
	if(!~['left', 'center', 'right'].indexOf(this.horizontalAlign))
		this.horizontalAlign = defaultOptions.horizontalAlign;

	/**
	 * Вертикальное выравнивание поля.  
	 * Значения: `'top', 'middle', 'bottom'`
	 * @type {string}
	 */
	this.verticalAlign = this.options.verticalAlign;
	if(!~['top', 'middle', 'bottom'].indexOf(this.verticalAlign))
		this.verticalAlign = defaultOptions.verticalAlign;

	/**
	 * В какой конец поля добавляются карты.  
	 * Значения: `'front', 'back'`
	 * @type {string}
	 */
	this.addTo = this.options.addTo;
	if(!~['front', 'back'].indexOf(this.addTo))
		this.addTo = defaultOptions.addTo;

	/**
	 * Карты распологаются повернутыми на 180 градусов
	 * @type {boolean}
	 */
	this.flipped = this.options.flipped;

	/**
	 * Карты добавляются начиная с последней
	 * @type {boolean}
	 */
	this.reversed = this.options.reversed;

	/**
	 * Отступ по краям поля.
	 * @type {number}
	 */
	this.margin = this.options.margin;

	/**
	 * Отступ между картами
	 * @type {number}
	 */
	this.padding = this.options.padding;

	/**
	 * На сколько поднимать карты с `raised == true`
	 * @type {number}
	 */
	this.raisedHeight = this.options.raisedHeight;

	/**
	 * Минимальная ширина\высота для расположения карт.
	 * @type {number}
	 */
	this.minActiveSpace = this.options.minActiveSpace;

	/**
	 * Нужно ли рассчитывать сдвиг карт по отношению друг к другу
	 * или использовать заданное значение.
	 * @type {(boolean|number)}
	 */
	this.forcedSpace = this.options.forcedSpace;

	/**
	 * Нужно ли сдвигать карты при наведении
	 * @type {boolean}
	 */
	this.focusable = this.options.focusable;

	/**
	 * На сколько увеличивать масштаб карт при наведении
	 * @type {number}
	 */
	this.focusedScaleDiff = this.options.focusedScaleDiff;

	/**
	 * Нужно ли сортировать карты
	 * @type {boolean}
	 */
	this.sorted = this.options.sorted;

	/** 
	 * Время движения карт.
	 * @type {number}
	 */
	this.moveTime = this.options.moveTime;

	/**
	 * Задержка между движением карт.
	 * @type {number}
	 */
	this.delayTime = this.options.delayTime;

	/**
	 * Нужно ли класть карты в поле под случайным углом
	 * @type {number}
	 */
	this.randomAngle = this.options.randomAngle;

	/**
	 * Тип поверхности поля.  
	 * Значения: `'plain', 'curved', 'glowing'`
	 * @type {string}
	 */
	this.areaType = this.options.areaType;
	if(!~['plain', 'curved', 'glowing'].indexOf(this.areaType))
		this.areaType = defaultOptions.areaType;

	/**
	 * Прозрачность поля в дебаг режиме.
	 * @type {number}
	 */
	this.alpha = this.options.alpha;

	/**
	 * Phaser группа с поверхностью поля.  
	 * @type {Phaser.Group}
	 */
	this.base = game.add.group();
	this.setBase(this.options.x, this.options.y);
	if(this.areaType == 'curved'){
		/**
		 * Полугруглая поверхность поля, если `{@link Field#areaType} == 'curved'`.
		 * @type {Phaser.Graphics}
		 */
		this.circle = game.make.graphics(0, 0);
		this.base.add(this.circle);
	}

	//Текстура для дебага и область поля.
	var pixel = ui.newPixel();

	/**
	 * Поверхность поля.
	 * @type {Phaser.Image}
	 */
	this.area = game.add.image(0, 0, pixel.generateTexture());
	this.area.alpha = this.alpha;
	this.area.visible = this.inDebugMode;
	this.base.add(this.area);

	if(this.iconTexture){
		/**
		 * Иконка поля, если `{@link Field#iconTexture}` указано.
		 * @type {Phaser.Image}
		 */
		this.icon = game.add.image(0, 0, this.iconTexture);
		this.icon.frame = this.options.frame;
		this.icon.anchor.set(0.5, 0.5);
		this.base.add(this.icon);
	}
	fieldManager.fieldsGroup.add(this.base);

	/**
	 * Подсвечено ли поле.
	 * @type {Boolean}
	 * @default  false
	 */
	this.highlighted = false;

	/**
	 * Нужно ли подсвечивать поле.
	 * @type {Boolean}
	 * @default  false
	 */
	this.marked = false;

	/**
	 * Увеличен ли масштаб поля
	 * @type {Boolean}
	 * @default  false
	 */
	this.poppedOut = false;

	this.resize(this.options.width, this.options.height);

	if(this.areaType == 'curved'){
		var tween = game.add.tween(this.circle.position);
		this.circle.y = this.area.height;
		tween.to({y: 0}, this.moveTime/game.speed, Phaser.Easing.Quadratic.Out);
		tween.start();
	}
	
	/**
	 * Размер активного места поля для дебага.
	 * @type {Phaser.Rectangle}
	 * @private
	 */
	this._debugActiveSpace = new Phaser.Rectangle();

	/**
	 * Находится ли поле в дебаг режиме
	 * @type {boolean}
	 */
	this.inDebugMode = this.options.debug;

	/**
	 * Специальное id поля для полей, пренадлежащих одной группе.
	 * @type {number}
	 */
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
		margin:10,	
		padding:10,	
		minActiveSpace: fieldManager.builder.minActiveSpace,	
		raisedHeight: skinManager.skin.height/2,	

		moveTime: 300,
		delayTime: 100,
		
		forcedSpace: false,	

		focusable: true,	
		focusedScaleDiff: 0.025,	
		sorted: true,		
		
		id:null,
		type:'GENERIC',
		name: null,

		horizontalAlign:'center',	
		verticalAlign:'middle',		
		axis: 'horizontal', 	
		direction: 'forward',	
		addTo: 'front',		
		reversed: false,	
		flipped: false,		
		randomAngle: false,	
		areaType: 'plain',	

		icon: null,
		frame: 0,
		iconOffset: {x: 0, y:0},
		iconShouldHide: false,

		alpha: 0.15,

		debug: false,
		specialId: null
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
//@include:FieldPlaceDebug

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
