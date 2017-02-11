/*
 * Класс, управляющий картами и полями игры.
 */
'use strict';

var utils = require('../utils'),
	BetterArray = require('../BetterArray.js');

class GameCards{

	constructor(game){
		this.game = game;

		//Свойства карт
		this.cardValues = [];
		this.numOfSuits = 4;
		this.maxCardValue = 14;

		this.deck = new BetterArray();
		this.field = new BetterArray();

		//Руки (объекты по id игроков, содержащие id карт)
		this.normalHandSize = 6;
	}

	reset(){
		this.fieldSpots = {};
		this.fieldSize = 6;
		this.fieldUsedSpots = 0;
		this.fullField = this.zeroDiscardFieldSize = this.fieldSize - 1;
		for(let i = 0; i < this.fieldSize; i++) {
			let id = 'FIELD'+i;
			let fieldSpot = {
				attack: null,
				defense: null,
				id: id
			}
			this.field.push(fieldSpot);
			this.fieldSpots[id] = fieldSpot;
		}
	}
	static get [Symbol.species]() { return Array; }
}

module.exports = GameCards;