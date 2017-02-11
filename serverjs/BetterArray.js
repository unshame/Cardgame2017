class BetterArray extends Array{
	constructor(...arg){
		super(...arg);
	}

	static get [Symbol.species]() { return Array; }

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

	byId(){
		let obj = {};
		for(let i = 0; i < this.length; i++){
			let v = this[i];
			if(!v || typeof v != 'object' || !v.id)
				continue;
			obj[v.id] = v;	
		}
		return obj;
	}

}

module.exports = BetterArray;