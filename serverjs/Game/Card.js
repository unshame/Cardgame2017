const utils = require('../utils');

class Card{
	constructor(suit, value, field){
		this.id = 'card_' + utils.generateId();
		this.suit = suit;
		this.value = value;
		this.field = field;
	}
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

module.exports = Card;