/*
 * Класс, управляющий картами и полями игры.
 */
'use strict';

var utils = require('../utils');

var BetterArray = utils.BetterArray;

class GameCards extends BetterArray{

	constructor(game, cards){
		super();
		this.game = game;
	}
	static get [Symbol.species]() { return Array; }
}