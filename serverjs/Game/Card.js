'use strict';

const generateId = requirejs('generateId');

class Card{
	/**
 	 * Класс карт.
	 * @param  {number} suit  масть
	 * @param  {number} value значение
	 * @param  {string} field поле
	 */
	constructor(suit, value, field){

		/**
		 * id карты.
		 * @type {String}
		 */
		this.id = 'card_' + generateId();

		/**
		 * Масть карты.
		 * @type {number}
		 */
		this.suit = suit;

		/**
		 * Значение карты.
		 * @type {number}
		 */
		this.value = value;

		/**
		 * Поле карты.
		 * @type {string}
		 */
		this.field = field;
	}

	/**
	 * Объект с информацией о карте.
	 * @readonly
	 * @type {CardInfo}
	 */
	get info(){
		let obj = {};
		for(let key in this){
			if(!this.hasOwnProperty(key))
				continue;
			obj[key == 'id' ? 'cid' : key] = this[key];
		}
		return obj;
	}
}

/**
 * {@link Card}
 * @module
 */
module.exports = Card;

