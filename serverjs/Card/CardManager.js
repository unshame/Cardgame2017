/*
 * Класс, управляющий картами и полями игры.
 */
'use strict';

const
	BetterArray = require('../BetterArray');

class GameCards extends BetterArray{

	constructor(game, config){
		super();
		this.game = game;	
		this.log = game.log;
		this.values = [];

		this.CardClass= config.card;

		this.deck = new BetterArray();

		this.lowestValue = config.lowestValue;
		this.numOfSuits = config.numOfSuits;
		this.maxValue = config.maxValue;
	}
	static get [Symbol.species]() { return Array; }

	// Карты по id
	get byId(){
		return this.byKey('id');
	}

	// Обнуляет карты
	reset(soft){

		// Убираем уже существующие карты
		if(!soft){
			this.length = 0;
		}

		// Колода
		this.deck.length = 0;
	}

	// Создает карты, поля и руки
	make(){
		if(!this.length){
			this.createValues();
		}

		// Создаем колоду
		if(!this.length){
			this.makeDeck();
		}
		else{
			this.shuffle();
		}
	}

	createValues(){
	
		// Значения карт
		this.values.length = 0;

		// Задаем значения карт
		for (let i = this.lowestValue; i <= this.maxValue; i++) {
			this.values.push(i);
		}	
	}

	// Создает колоду
	makeDeck(){

		// Добавляем карты в колоду и в сам объект
		this.values.forEach((v) => {
			for(let si = 0; si < this.numOfSuits; si++){
				let card = new this.CardClass(si, v, 'DECK');
				this.push(card);
				this.deck.push(card);
			}		
		});

		// Перемешиваем колоду
		this.deck.shuffle();		
	}

	shuffle(){

		this.deck.length = 0;

		this.forEach((c) => {
			c.field = 'DECK';
			this.deck.push(c);
		});

		// Перемешиваем колоду
		this.deck.shuffle();

		// Перемешиваем id карт
		this.shuffleKey('id');
	}
}

module.exports = GameCards;
