/*
* Энумераторы и фиктивные типы данных для JSDoc.
*/

/*jshint unused:false*/

// ENUMS

/**
* В какой момент должна быть поднята карта.
* @readonly
* @enum {number}
* @global
*/
var BRING_TO_TOP_ON = {
	/** Никогда. */
	NEVER: 0,
	/** При инициализации (до задержки). */
	INIT: 1,
	/** При старте (после задержки). */
	START: 2,
	/** При старте (после задержки), все карты в поле поднимаются наверх. */
	START_ALL: 3,
	/** В конце движения. */
	END: 4,
	/** В конце движения, все карты в поле поднимаются наверх. */
	END_ALL: 5
};


// EXTERNALS

/**
* HTML5 2D WebGL graphics library with canvas fallback. Используется {@link external:Phaser|Phaser'ом} для рендеринга.   
* @external PIXI
* @version 2.2.9
* @see {@link https://phaser.io/docs/2.6.2/PIXI.html}
* @see {@link http://www.pixijs.com/}
*/

/**
* HTML5 game framework. Использует {@link external:PIXI|PIXI} для рендеринга.   
* ![Phaser](https://camo.githubusercontent.com/41b3f653a9ad25ca565c9c4bcfcc13b6d778e329/687474703a2f2f7068617365722e696f2f696d616765732f6769746875622f6172636164652d6361622e706e67)
* @external Phaser
* @version 2.6.2
* @see {@link https://phaser.io/docs/2.6.2/index}
*/

// TYPE DEFS

/**
* Объекты классов `Phaser.Group`, `Phaser.Sprite`, `Phaser.Text`, `Phaser.Button` и все производные от них классы.
* @typedef {object} DisplayObject
* @see  {@link http://phaser.io/docs/2.6.2/global.html#DisplayObject|DisplayObject}
*/
// DisplayObject

/**
* Информация о карте.
* @typedef {object} CardInfo
* @property {string}        cid         id карты
* @property {string}        [pid/field] id игрока/поля
* @property {(number|null)} [suit]      масть карты
* @property {number}        [value]     значение карты
*/
// CardInfo

/**
* Информация о действии переданного от сервера.
* @typedef {object} ActionInfo
* @property {string} [type]  тип действия
* @property {string} [cid]   id карты
* @property {string} [pid]   id игрока
* @property {string} [field] id поля
* @property {number} [suit]  масть карты
* @property {number} [value] значение карты
*/
// Action


// PHASER CLASSES

/**
* Класс из {@link external:Phaser|Phaser}.  
* Группа игровых элементов. Позволяет размещать и контролировать множество элементов.  
* Должна быть добавлена в {@link UILayers} для корректного отображения по вертикали.  
* Далее описаны полезные свойства и методы. По ссылке ниже можно найти полную документацию.
* @class external:Phaser.Group
* @param {Phaser.Game}        game                  игра
* @param {DisplayObject|null} [parent=(game world)] родительская группа
* @param {string}             [name='group']        имя группы
* @see  {@link https://phaser.io/docs/2.6.2/Phaser.Group.html|Phaser.Group полная документация}
*/

/**
* Позиция по горизонтали.
* @name external:Phaser.Group#x
* @type {number}
*/

/**
* Позиция по вертикали.
* @name external:Phaser.Group#y
* @type {number}
*/

/**
* Прозрачность.
* @name external:Phaser.Group#alpha
* @type {number}
*/

/**
* Поворот в градусах.
* @name external:Phaser.Group#angle
* @type {number}
*/

/**
* Поворот в радианах.
* @name external:Phaser.Group#rotation
* @type {number}
*/

/**
* Отрисовывается ли элемент игрой.
* @name external:Phaser.Group#visible
* @type {boolean}
*/

/**
* Элементы, входящие в группу.
* @name external:Phaser.Group#children
* @type {DisplayObject[]}
*/

/**
* Кол-во элементов, входящих в группу.
* @name external:Phaser.Group#length
* @readOnly
* @type {number}
*/

/**
* Имя группы.
* @name external:Phaser.Group#name
* @type {string}
*/

/**
* Добавляет элемент в группу.
* @function external:Phaser.Group#add
*/

/**
* Убирает элемент из группы.
* @function external:Phaser.Group#remove
*/

/**
* Поднимает элемент группы наверх.
* @function external:Phaser.Group#bringToTop
*/

/**
* Устанавливает индекс элемента группы по вертикали.
* @function external:Phaser.Group#setChildIndex
*/

/**
* Выполняет callback для каждого элемента группы.
* @function external:Phaser.Group#forEach
*/

/**
* Возвращает элемент группы с указанным именем.
* @function external:Phaser.Group#getByName
*/

/**
* Обновляет все элементы, входящие в группу.
* @function external:Phaser.Group#update
*/

/**
* Уничтожает группу, убирая все элементы из нее, опционально уничтожая их тоже.
* @function external:Phaser.Group#destroy
*/

/**
* Удаляет все элементы из группы, опционально уничтожая их.
* @function external:Phaser.Group#removeAll
*/
