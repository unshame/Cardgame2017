/**
* Конструктор полей карт ({@link Card}).  
* Производит размещение карт на экране. Контролирует позицию карт при наведении курсора.
* Отвечает за подсветку пространства под картами и самих карт.  
* Основные компоненты: {@link Field#base}, {@link Field#area}, {@link Field#circle}, {@link Field#icon}, {@link Field#cards}.  
* Карты добавляются в поле двумя методами:  
*
** {@link Field#queueCards} -> {@link Field#placeQueuedCards}  
** {@link Field#addCards}  
*
* Использование второго метода до финализации первого добавляет карты в очередь и запускает очередь  
* `.queueCards(c1)` -> `.addCards(c2)` => `.queueCards(c1)` -> `.queueCards(c2)` -> `.placeQueuedCards()`   
* @class
* @param {object} [options] Настройки поля. {@link Field#options} 
* @param {string} options.id=null {@link Field#id}	
* @param {string} options.type='GENERIC' {@link Field#type}	
* @param {string} options.name=null {@link Field#name}	
* 
* @param {number} options.moveTime=300 {@link Field#moveTime}	
* @param {number} options.delayTime=100 {@link Field#delayTime}	
* @param {number} options.scaleDiff=0.025 {@link Field#scaleDiff}
* @param {boolean} options.debug=false {@link Field#inDebugMode}	
* @param {number} options.specialId=null {@link Field#specialId}	
* 
* @param {object} [style] Внешний вид поля. {@link Field#style} 
* @param {number} style.x=0	{@link Field#base} позиция по горизонтали
* @param {number} style.y=0	{@link Field#base} позиция по вертикали
* @param {number} style.width=0	{@link Field#area} ширина поверхности
* @param {number} style.height=0 {@link Field#area} высота поверхности
* @param {number} style.padding=10 Отступ по краям поля.
* @param {number} style.spacing=10 Отступ между картами.
* @param {number} style.minActiveSpace=fieldManager.builder.minActiveSpace Минимальная ширина\высота для расположения карт.
* @param {number} style.raisedOffset=skinManager.skin.height/2 	На сколько поднимать карты с `raised == true`
* @param {(boolean|number)} style.forcedSpace=false Нужно ли рассчитывать сдвиг карт по отношению друг к другу или использовать заданное значение.
* 
* @param {boolean} style.focusable=true Нужно ли сдвигать карты при наведении
* @param {boolean} style.sortable=true Нужно ли сортировать карты 
* 
* @param {string} style.horizontalAlign='center' Горизонтальное выравнивание поля.  
*                                                Значения: `'left', 'center', 'right'`
* @param {string} style.verticalAlign='middle' Вертикальное выравнивание поля.  
*                                              Значения: `'top', 'middle', 'bottom'`
* 
* @param {string} style.axis='horizontal' Ориентация поля.
*                                         Меняет местами horizontalAlign и verticalAlign (right станет bottom и т.д.), не влияет на width и height.  
* 	                                      Значения: `'vertical', 'horizontal'`
* @param {string} style.direction='forward'	Направление поля.  
*                                           Значения: `'forward', 'backward'`
* @param {string} style.addTo='front' В какой конец поля добавляются карты.  
*                                     Значения: `'front', 'back'`
* @param {string} style.area='plain' Тип поверхности поля.  
*                                    Значения: `'plain', 'curved', 'glowing'`
* @param {boolean} style.reversed=false Карты добавляются начиная с последней
* @param {boolean} style.flipped=false	Карты распологаются повернутыми на 180 градусов
* @param {(boolean|string)} style.randomAngle=false Нужно ли класть карты в поле под случайным углом.  
*                                                   Значения: `false, true, 'bi'`
* @param {number} style.alpha=0.15 Прозрачность поля в дебаг режиме.
*
* @param {object} [iconStyle] Внешний вид иконки поля. {@link Field#iconStyle} {@link Field#icon} 
* @param {string} iconStyle.texture=null текстура иконки	
* @param {number} iconStyle.frame=0 кадр текстуры иконки
* @param {object} iconStyle.offset={x:0,y:0} отступ иконки `{x, y}`
* @param {boolean} iconStyle.shouldHide=false нужно ли прятать иконку
* @param {boolean} iconStyle.visible=true спрятана ли иконка по умолчанию
*
*/

var Field = function(options, style, iconStyle){

	this._applyOptions(options, style, iconStyle);

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
	 * Ожидаемая задержка для установки {@link Field#_uninteractibleTimer}
	 * @private
	 * @type {Number}
	 */
	this._expectedDelay = 0;

	/**
	 * Таймер {@link Field#_setUninteractibleTimer}
	 * @private
	 */
	this._uninteractibleTimer = null;

	/**
	 * Расчитанное расстояние между картами для {@link Field#cardIsInside}
	 * @private
	 * @type {Number}
	 */
	this._cardSpacing = 0;

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
	 * Специальное id поля для полей, пренадлежащих одной группе.
	 * @type {number}
	 */
	this.specialId = this.options.specialId;

	/**
	 * Имя поля
	 * @type {string}
	 */
	this.name = this.options.name;

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
	 * На сколько увеличивать масштаб карт при наведении.
	 * @type {number}
	 */
	this.scaleDiff = this.options.scaleDiff;

	/**
	 * Phaser группа с поверхностью поля.  
	 * @type {Phaser.Group}
	 */
	this.base = game.add.group();
	this.setBase(this.style.x, this.style.y);
	if(this.style.area == 'curved'){
		/**
		 * Полугруглая поверхность поля, если `style.area == 'curved'`.
		 * @type {Phaser.Graphics}
		 */
		this.circle = game.add.image(0, 0);
		this.base.add(this.circle);
	}

	//Текстура для дебага и область поля.
	var pixel = ui.newPixel();

	/**
	 * Поверхность поля.
	 * @type {Phaser.Image}
	 */
	this.area = game.add.image(0, 0, pixel.generateTexture());
	this.area.alpha = this.style.alpha;
	this.area.visible = this.inDebugMode;
	this.base.add(this.area);

	if(this.iconStyle.texture){
		/**
		 * Иконка поля, если `iconStyle.texture` указано.
		 * @type {Phaser.Image}
		 */
		this.icon = game.add.image(0, 0, this.iconStyle.texture);
		this.icon.frame = this.iconStyle.frame;
		this.icon.visible = this.iconStyle.visible;
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
	 * Интерактивно ли поле.
	 * @type {Boolean}
	 * @default  true
	 */
	this.interactible = false;

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

	this.resize(this.style.width, this.style.height);

	if(this.style.area == 'curved'){
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

};

/**
* Возвращает опции по умолчанию
*/
Field.getDefaultOptions = function(){
	var config = {
		options: {

			moveTime: 300,
			delayTime: 100,		
			scaleDiff: 0.025,

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
			spacing: 10,
			minActiveSpace: fieldManager.builder.minActiveSpace,	
			raisedOffset: skinManager.skin.height/2,	
			forcedSpace: false,	

			focusable: true,	
			sortable: true,	

			horizontalAlign: 'center',	
			verticalAlign: 'middle',		

			axis: 'horizontal', 	
			direction: 'forward',	
			addTo: 'front',		
			reversed: false,	
			flipped: false,		
			randomAngle: false,	
			
			area: 'plain',	
			alpha: 0.25
		},
		iconStyle: {
			texture: null,
			frame: 0,
			offset: {x: 0, y:0},
			shouldHide: false,
			visible: true
		}
	};
	return config;
};

/**
* Совмещает переданные опции со стандартными и сохраняет их, как свойства объекта.
* @private
* @param {object} [options] Настройки поля.
* @param {object} [style] Внешний вид поля.
* @param {object} [iconStyle] Внешний вид иконки поля.
*/
Field.prototype._applyOptions = function(options, style, iconStyle){
	var defaultConfig = Field.getDefaultOptions();

	/**
	 * Настройки поля.
	 * @type {object}
	 */
	this.options = defaultConfig.options;
	/**
	 * Внешний вид поля.
	 * @type {object}
	 */
	this.style = defaultConfig.style;
	/**
	 * Внешний вид иконки поля.
	 * @type {object}
	 */
	this.iconStyle = defaultConfig.iconStyle;

	var o;
	if(options){
		for(o in defaultConfig.options){
			if(options.hasOwnProperty(o) && options[o] !== undefined){
				this.options[o] = options[o];
			}
		}
	}
	if(style){
		for(o in defaultConfig.style){
			if(style.hasOwnProperty(o) && style[o] !== undefined){
				this.style[o] = style[o];
			}
		}
	}
	if(iconStyle){
		for(o in defaultConfig.iconStyle){
			if(iconStyle.hasOwnProperty(o) && iconStyle[o] !== undefined){
				this.iconStyle[o] = iconStyle[o];
			}
		}
	}
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
		spacing = skinManager.skin.width - this._cardSpacing;

	var addX = 0,
		addY = 0;
	if(includeWholeCard){
		addX = skinManager.skin.width/2;
		addY = skinManager.skin.height/2;
	}

	return card && Phaser.Rectangle.containsRaw(
		this.base.x + this.style.padding - spacing - addX,
		this.base.y + this.style.padding - addY,
		this.area.width + addX*2 + spacing*2,
		this.area.height + addY*2,
		card.base.x + card.sprite.x,
		card.base.y + card.sprite.y
	);
};

/**
* Ресет поля. Убирает все карты из поля и очереди.
*/
Field.prototype.reset = function(){
	this.validCards.length = 0;
	this.resetQueue();
	this.removeAllCards();
};