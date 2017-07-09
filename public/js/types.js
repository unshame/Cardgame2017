/*
* Энумераторы и фиктивные типы данных для JSDoc.
*/

// ENUMS

/**
* В какой момент должна быть поднята карта.
* @readonly
* @enum {number}
* @global
*/
window.BRING_TO_TOP_ON = {
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
* @property {string} cid id карты
* @property {string} [pid/field] id игрока/поля
* @property {(number|null)} [suit] - масть карты
* @property {number} [value] - значение карты
*/
// CardInfo
