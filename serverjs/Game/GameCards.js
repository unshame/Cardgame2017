/*
 * Класс, управляющий картами и полями игры.
 */
'use strict';

var utils = require('../utils'),
	BetterArray = require('../BetterArray.js');

class GameCards extends BetterArray{

	constructor(game){
		super();

		this.game = game;		
	}

	//Карты по id
	get byId(){
		return this.byKey('id');
	}

	reset(){
		this.length = 0;

		this.hands = {};
		this.hands.normalSize = 6;	

		this.discardPile = [];

		this.deck = new BetterArray();

		this.field = new BetterArray();
		this.field.length = 6;
		this.field.usedSpots = 0;
		this.field.fullLength = this.field.zeroDiscardLength = this.field.length - 1;
		for(let i = 0; i < this.field.length; i++) {
			let id = 'FIELD'+i;
			let fieldSpot = {
				attack: null,
				defense: null,
				id: id
			}
			this.field[i] = fieldSpot;
		}
	}

	make(){
		const game = this.game;

		this.values = [];
		this.numOfSuits = 4;
		this.maxValue = 14;

		//Задаем количество карт и минимальное значение карты
		if(game.players.length > 3){
			this.lowestValue = 2;
			this.numOfCards = 52
		}
		else{
			this.lowestValue = 6;
			this.numOfCards = 36;
		}

		//Задаем значения карт
		for (let i = this.lowestValue; i <= this.maxValue; i++) {
			this.values.push(i);
		}

		this.makeDeck();

		//Запоминаем козырь
		let lastcid = this.deck[this.deck.length - 1];
		let lastcard = this.byId[lastcid];
		lastcard.spot = 'BOTTOM';
		this.trumpSuit = lastcard.suit;


		game.deck = this.deck;
		game.discardPile = this.discardPile;
		game.field = this.field;
		game.hands = this.hands;
	}

	//Создает колоду
	makeDeck(){
		for(let vi = 0; vi < this.values.length; vi++){

			for(let si = 0; si < this.numOfSuits; si++){
				let id = 'card_' + utils.generateId();
				let card = {
					id: id,
					value: this.values[vi],
					suit: si,
					spot: 'DECK'
				}
				this.push(card);
				this.deck.push(card.id);
			}		
		}

		this.deck.shuffle();

		let cardsById = this.byId;
		
		//Находим первый попавшийся не туз и кладем его на дно колоды, это наш козырь
		for(let ci = 0; ci < this.deck.length; ci++){

			let thiscid = this.deck[ci];
			let othercid = this.deck[this.deck.length - 1];
			if(cardsById[thiscid].value != this.maxCardValue){
				this.deck[this.deck.length - 1] = thiscid;
				this.deck[ci] = othercid;
				break;
			}
		}	
	}
	static get [Symbol.species]() { return Array; }
}

module.exports = GameCards;