/*
* Энумераторы и фиктивные типы данных для JSDoc.
*/

//ENUMS

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
	/** В конце движения. */
	END: 3,
	/** В конце движения, все карты в поле поднимаются на верх. */
	END_ALL: 4
};


//TYPE DEFS

/**
* Объекты классов `Phaser.Group`, `Phaser.Sprite`, `Phaser.Text`, `Phaser.Button` и все производные от них классы.
* @typedef {object} DisplayObject
* @see  {@link http://phaser.io/docs/2.6.2/global.html#DisplayObject|DisplayObject}
*/
//DisplayObject

/**
* Информация о карте.
* @typedef {object} CardInfo
* @property {string} cid id карты
* @property {string} [pid/field] id игрока/поля
* @property {(number|null)} [suit] - масть карты
* @property {number} [value] - значение карты
*/
//CardInfo
