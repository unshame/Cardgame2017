/*
 * Энумераторы и фиктивные типы данных для JSDoc.
 */


//ENUMS

/**
* В какой момент должна быть поднята карта
* @readonly
* @enum {number}
* @global
*/
window.BRING_TO_TOP_ON = {
	NEVER: 0,
	INIT: 1,
	START: 2,
	END: 3,
	END_ALL: 4
};


//TYPE DEFS

/**
* Объекты классов `Phaser.Group`, `Phaser.Sprite`, `Phaser.Text`, `Phaser.Button` и все производные от них классы.
* @typedef {object} DisplayObject
* @see  {@link http://phaser.io/docs/2.6.2/global.html#DisplayObject|DisplayObject}
*/
//DisplayObject

