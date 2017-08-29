'use strict';

class BetterArray extends Array{

	/**
 	 * Массив с дополнительными методами.
 	 * @extends {Array}
	* @param  {...any} [arg] элементы массива
	*/
	constructor(...arg){
		super(...arg);
	}

	static get [Symbol.species]() { return Array; }

	/**
	* Перемешивает массив (Fisher–Yates Shuffle).
	*/
	shuffle(){
		let currentIndex = this.length,
			temporaryValue,
			randomIndex;

		// While there remain elements to shuffle...
		while (0 !== currentIndex) {

			// Pick a remaining element...
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex -= 1;

			// And swap it with the current element.
			temporaryValue = this[currentIndex];
			this[currentIndex] = this[randomIndex];
			this[randomIndex] = temporaryValue;
		}
	}

	/**
	* Перемешивает определенное свойство объектов массива (Fisher–Yates Shuffle).
	* @param  {string} key свойство
	*/
	shuffleKey(key){
		let currentIndex = this.length,
			temporaryValue,
			randomIndex;

		while (0 !== currentIndex) {

			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex -= 1;

			temporaryValue = this[currentIndex][key];
			this[currentIndex][key] = this[randomIndex][key];
			this[randomIndex][key] = temporaryValue;
		}
	}

	/**
	* Создает объект по значениям переданного ключа.  
	* `[{key: 'key1'}, {key: 'key2'}]` => `{key1: {key: 'key1'}, key2: {key: 'key2'}} `  
	* Пропускает элементы без заданных ключей и с пустыми ключами
	* @param  {string} key свойство
	* @return {object<any>} Объект по значениям ключа. 
	*/
	byKey(key){
		let obj = {};
		this.forEach((v) => {
			if(!v || typeof v != 'object' || !v[key]){
				return;
			}
			obj[v[key]] = v;
		});
		return obj;
	}

}

/**
* {@link BetterArray}
* @module
*/
module.exports = BetterArray;