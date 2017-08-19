//@include:FieldManager
//@include:FieldBuilder

/**
* Конструктор полей карт ({@link Card}).  
* Производит размещение карт на экране. Контролирует позицию карт при наведении курсора.
* Отвечает за подсветку пространства под картами и самих карт.  
* Основные компоненты: {@link Field#area}, {@link Field#cards}.  
* Карты добавляются в поле двумя методами:  
*
* {@link Field#queueCards} -> {@link Field#placeQueuedCards}  
* {@link Field#addCards}  
*
* Использование второго метода до финализации первого добавляет карты в очередь и запускает очередь  
* `.queueCards(c1)` -> `.addCards(c2)` => `.queueCards(c1)` -> `.queueCards(c2)` -> `.placeQueuedCards()`  
*  
* @class
* @extends {external:Phaser.Group}
* 
* @param {object}           options                                                  Настройки поля. {@link Field#options}. 
*                                                                                    Будут пересохранены в `this`, изменения объекта `options` не повлияют на поле.
* @param {string}           options.id=null                                          {@link Field#id}	
* @param {string}           options.type='GENERIC'                                   {@link Field#type}	
* @param {string}           options.name=null                                        {@link Field#name}	
*
* @param {number}           options.moveTime=cardManager.defaultMoveTime             {@link Field#moveTime}	
* @param {number}           options.delayTime=100                                    {@link Field#delayTime}	
* @param {boolean}          options.debug=false                                      {@link Field#inDebugMode}	
* @param {number}           options.specialId=null                                   {@link Field#specialId}	
*
*
* @param {object}           style                                                    Внешний вид поля. {@link Field#style} 
* @param {number}           style.x=0                                                {@link Field#x} позиция по горизонтали
* @param {number}           style.y=0                                                {@link Field#y} позиция по вертикали
* @param {number}           style.width=0                                            {@link Field#area} ширина поверхности
* @param {number}           style.height=0                                           {@link Field#area} высота поверхности
* @param {number}           style.margin=0                                           Отступ от края поля до видимого края поля.
* @param {number}           style.padding=10                                         Отступ от видимого края поля до карт внутри.
* @param {number}           style.spacing=10                                         Отступ между картами.
* 
* @param {number}           style.minActiveSpace=fieldManager.builder.minActiveSpace Минимальная ширина\высота для расположения карт.
* @param {number}           style.raisedOffset=skinManager.skin.height/2             На сколько поднимать карты с `raised == true`
* @param {(boolean|number)} style.forcedSpace=false                                  Нужно ли рассчитывать сдвиг карт по отношению друг к другу или использовать заданное значение.
* @param {number}           style.scaleDiff=0.025                                    На сколько увеличивается масштаб карты при наведении.
* 
* @param {boolean}          style.focusable=false                                    Нужно ли сдвигать карты при наведении
* @param {boolean}          style.sortable=false                                     Нужно ли сортировать карты 
* @param {boolean}          style.draggable=false                                    Можно ли перетаскивать карты в этом поле
*          
* @param {string}           style.horizontalAlign='center'                           Горизонтальное выравнивание поля.  
*                                                                                    Значения: `'left', 'center', 'right', 'centerLeft'`
* @param {string}           style.verticalAlign='middle'                             Вертикальное выравнивание поля.  
*                                                                                    Значения: `'top', 'middle', 'bottom'`
*          
* @param {string}           style.axis='horizontal'                                  Ориентация поля.
*                                                                                    Меняет местами horizontalAlign и verticalAlign (right станет bottom и т.д.), не влияет на width и height.  
* 	                                                                                 Значения: `'vertical', 'horizontal'`
* @param {string}           style.direction='forward'                                Направление поля.  
*                                                                                    Значения: `'forward', 'backward'`
* @param {string}           style.addTo='front'                                      В какой конец поля добавляются карты.  
*                                                                                    Значения: `'front', 'back'`
* @param {boolean}          style.flipped=false                                      Карты распологаются повернутыми на 180 градусов
* @param {(boolean|string)} style.randomAngle=false                                  Нужно ли класть карты в поле под случайным углом.  
*                                                                                    Значения: `false, 'uni', 'bi'`  
*                                                                                    `'uni'` - карты поворачиваются по направлению поля   
*                                                                                    `'bi'` - карты поворачиваются в случайную сторону
* @param {boolean}          style.adjust=true                                        Нужно ли пытаться двигать карты, которые уже находятся в поле, при добавлении новых.
* @param {number}           style.alpha=0.35                                         Прозрачность поля.
* @param {number}           style.corner=5                                           Радиус закругленного угла.
* @param {number}           style.border=4                                           Ширина рамки.
*
* @param {(boolean|string)} style.animateAppearance                                  Нужно ли анимировать появление поля и откуда это делать.  
*                                                                                    Значения: `false, 'left', 'right', 'top', 'bottom'`
*/

var Field = function(options, style){


	this._applyOptions(options, style);


	Phaser.Group.call(this, game, null, this.options.name);
	/**
	* Имя поля.
	* @member Field#name
	* @type {string}
	*/

	// Сохраняем опции на самом объекте для быстрого доступа

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
	* Запомненная позиция поля ({@link FieldManager#swapFields}).
	* @type {object}
	*/
	this.savedPosition = this.savedPosition;

	/**
	* Специальное id поля для полей, пренадлежащих одной группе.
	* @type {number}
	*/
	this.specialId = this.options.specialId;

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
	* Находится ли поле в дебаг режиме
	* @type {boolean}
	*/
	this.inDebugMode = this.options.debug;


	// Меняемые свойства

	/**
	* Подсвечено ли поле.
	* @type {Boolean}
	* @default  false
	*/
	this.highlighted = false;

	/**
	* Можно ли играть карты на это поле и тип действия.
	* @type {(string|boolean)}
	* @default  false
	*/
	this.playable = false;

	/**
	* Интерактивно ли поле.
	* @type {Boolean}
	* @default  true
	*/
	this.interactible = true;

	/**
	* Увеличен ли масштаб поля
	* @type {Boolean}
	* @default  false
	*/
	this.poppedOut = false;


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
	* Связанное поле.
	* @type {Field}
	* @see {@link CardControl#cardMoveToField}
	*/
	this.linkedField = null;


	/**
	* Выделенная карта.
	* @type {Card}
	*/
	this.focusedCard = null;

	/**
	* Ожидаемая задержка для установки {@link Field#_uninteractibleTimer}
	* @private
	* @type {Number}
	*/
	this._expectedDelay = 0;

	/**
	* Расчитанное расстояние между картами для {@link Field#cardIsInside}
	* @private
	* @type {Number}
	*/
	this._cardSpacing = 0;


	/**
	* Таймер {@link Field#_setUninteractibleTimer}
	* @private
	*/
	this._uninteractibleTimer = null;

	/**
	* Твин появления поля.
	* @type {Phaser.Tween}
	* @private
	*/
	this._entranceTween = null;


	/**
	* Поверхность поля.
	* @type {Phaser.Image}
	*/
	this.area = game.add.image(0, 0);
	this.area.alpha = this.style.alpha;
	this.area.visible = false;
	this.add(this.area);

	/**
	* BitmapData поверхности поля.
	* @type {Phaser.BitmapData}
	* @private
	*/
	this._bitmapArea = game.make.bitmapData();

	/**
	* Размер активного места поля для дебага.
	* @type {Phaser.Rectangle}
	* @private
	*/
	this._debugActiveSpace = new Phaser.Rectangle();
};

extend(Field, Phaser.Group);

Field.prototype.initialize = function(){
	this.setOwnHighlight(false);
	this.setBase(this.style.x, this.style.y);
	this.setSize(this.style.width, this.style.height);

	this.setupAnimatedAppearance();
};

/**
* Возвращает опции по умолчанию
*/
Field.prototype.getDefaultOptions = function(){
	return {
		options: {
			moveTime: cardManager.defaultMoveTime,
			delayTime: 100,		

			id: null,
			specialId: null,
			type: 'GENERIC',
			name: null,

			debug: false
		},
		style: {
			x: 0,
			y: 0,
			width: 0,
			height: 0,

			padding: 10,
			margin: 0,
			spacing: 10,
			minActiveSpace: fieldManager.builder.minActiveSpace,
			raisedOffset: skinManager.skin.height/2,
			forcedSpace: false,	
			scaleDiff: 0.025,

			focusable: false,	
			sortable: false,	
			draggable: false,

			horizontalAlign: 'center',	
			verticalAlign: 'middle',		

			axis: 'horizontal', 	
			direction: 'forward',	
			addTo: 'front',		
			flipped: false,		
			randomAngle: false,	
			adjust: true,

			animateAppearance: false,
			
			alwaysVisible: false,
			alpha: 0.35,
			corner: 5,
			border: 4
		}
	};
};

/**
* Совмещает переданные опции со стандартными и сохраняет их, как свойства объекта.
* @private
* @param {object} [options]   Настройки поля.
* @param {object} [style]     Внешний вид поля.
*/
Field.prototype._applyOptions = function(options, style){
	var defaults = this.getDefaultOptions();

	/**
	* Настройки поля.
	* Изменения не повлияют на само поле, т.к. все свойства сохранены в `this`.
	* @type {object}
	*/
	this.options = mergeOptions(defaults.options, options);

	/**
	* Внешний вид поля.
	* @type {object}
	*/
	this.style = mergeOptions(defaults.style, style);

};

//@include:FieldPosition
//@include:FieldValue
//@include:FieldQueue
//@include:FieldAdd
//@include:FieldDelete
//@include:FieldPlacePrivate
//@include:FieldPlacePublic
//@include:FieldCursor
//@include:FieldAnimate
//@include:FieldDebug

//@include:IconField
//@include:BadgeField
//@include:PlayerField
//@include:TableField

/**
* Проверяет нахождение карты внутри поля (по координатам).
* @param {Card}    card                     проверяемая карта
* @param {boolean} [includeSpacing=true]    нужно ли учитывать сдвиг карт друг от друга
* @param {boolean} [includeWholeCard=false] любая часть карты
*
* @return {boolean} Находится ли карта в поле.
*/
Field.prototype.cardIsInside = function(card, includeSpacing, includeWholeCard){

	if(includeSpacing === undefined){
		includeSpacing = true;
	}

	if(includeWholeCard === undefined){
		includeWholeCard = false;
	}

	var spacing = 0;
	if(includeSpacing){
		spacing = skinManager.skin.width - this._cardSpacing;
	}

	var addX = 0,
		addY = 0;
	if(includeWholeCard){
		addX = skinManager.skin.width/2;
		addY = skinManager.skin.height/2;
	}

	return card && Phaser.Rectangle.containsRaw(
		this.x - spacing - addX,
		this.y - addY,
		this.area.width + addX*2 + spacing*2,
		this.area.height + addY*2,
		card.x + card.sprite.x,
		card.y + card.sprite.y
	);
};
