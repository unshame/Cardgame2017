/*
 * Массив с дополнительными методами
 */

class BetterArray extends Array{
	constructor(...arg){
		super(...arg);
	}

	static get [Symbol.species]() { return Array; }

	//Перемешивает массив
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

	//Возвращает объект по значениям переданного ключа
	//Пропускает элементы без заданных ключей и с пустыми ключами
	byKey(key){
		let obj = {};
		for(let i = 0; i < this.length; i++){
			let v = this[i];
			if(!v || typeof v != 'object' || !v[key])
				continue;
			obj[key] = v;	
		}
		return obj;
	}

}

module.exports = BetterArray;