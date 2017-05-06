/*
 * Класс, управляющий картами и полями игры.
 */
'use strict';

const
	utils = require('../utils'),
	BetterArray = require('../BetterArray'),
	Card = require('./Card');

class GameCards extends BetterArray{

	constructor(game){
		super();
		this.game = game;	

		this.numOfSuits = 4;
		this.maxValue = 14;
		this.normalHandSize = 6;	

		this.table = new BetterArray();
		this.table.usedFields = 0;
		this.table.maxLength = 6;
		this.table.zeroDiscardLength = Math.max(this.table.maxLength - 1, 1);
	}
	static get [Symbol.species]() { return Array; }

	//Карты по id
	get byId(){
		return this.byKey('id');
	}

	//Возвращает первое свободное место на столе
	get firstEmptyTable(){
		let tableField = this.table.find((t) => {
			return !t.attack && !t.defense;
		});
		return tableField;
	}

	getInfo(){

		let cardsToSend = {};

		let players = this.game.players;

		players.forEach((p) => {
			let pid = p.id;
			cardsToSend[pid] = [];

			//Колода
			this.deck.forEach((card) => {
				let newCard = card.info;

				//Игроки знают только о значении карты на дне колоды
				if(card.field != 'BOTTOM'){
					newCard.value = null;
					newCard.suit = null;			
				} 
				cardsToSend[pid].push(newCard);
			});

			//Руки
			for(let hid in this.hands){
				if(!this.hands.hasOwnProperty(hid))
					continue;

				/*jshint loopfunc: true */
				let hand = this.hands[hid];
				hand.forEach((card) => {
					let newCard = card.info;

					if(card.field != pid){
						newCard.value = null;
						newCard.suit = null;			
					} 

					cardsToSend[pid].push(newCard);
				});
			}	

			//В игре
			this.table.forEach((tableField) => {
				if(tableField.attack){
					let card = tableField.attack;
					let newCard = card.info;
					cardsToSend[pid].push(newCard);
				}
				if(tableField.defense){
					let card = tableField.defense;
					let newCard = card.info;
					cardsToSend[pid].push(newCard);
				}		
			});
		});

		return cardsToSend;
	}

	//Обнуляет карты
	reset(){

		//Убираем уже существующие карты
		this.length = 0;

		//Колода (id карт)
		this.deck = new BetterArray();
		
		//Стопка сброса (id карт)
		this.discardPile = [];
		
		//Руки игроков (объекты с id карт по id игроков)		
		this.hands = {};			

		//Поля (стол) (объекты с id карт)
		this.table.length = 0;
		this.table.length = this.table.maxLength;		
		this.table.fullLength = this.table.zeroDiscardLength;
		for(let i = 0; i < this.table.length; i++) {
			let id = 'TABLE'+i;
			let tableField = {
				attack: null,
				defense: null,
				id: id
			};
			this.table[i] = tableField;
		}
	}

	//Создает карты, поля и руки
	make(){
		const game = this.game;

		//Значения карт
		this.values = [];

		//Задаем количество карт и минимальное значение карты
		if(game.players.length > 3){
			this.lowestValue = 2;
			this.numOfCards = 52;
		}
		else{
			this.lowestValue = 6;
			this.numOfCards = 36;
		}

		//Задаем значения карт
		for (let i = this.lowestValue; i <= this.maxValue; i++) {
			this.values.push(i);
		}	

		//Создаем руки
		game.players.forEach((p) => {
			this.hands[p.id] = [];
		});

		//Создаем колоду
		this.makeDeck();

		//Добавляем указатели на элементы игре
		game.deck = this.deck;
		game.discardPile = this.discardPile;
		game.table = this.table;
		game.hands = this.hands;
	}

	//Создает колоду
	makeDeck(){

		//Добавляем карты в колоду и в сам объект
		this.values.forEach((v) => {
			for(let si = 0; si < this.numOfSuits; si++){
				let card = new Card(si, v, 'DECK');
				this.push(card);
				this.deck.push(card);
			}		
		});

		//Перемешиваем колоду
		this.deck.shuffle();
		
		//Находим первый попавшийся не туз и кладем его на дно колоды, это наш козырь
		for(let ci = 0; ci < this.deck.length; ci++){

			let thisCard = this.deck[ci];
			let otherCard = this.deck[this.deck.length - 1];
			if(thisCard.value != this.maxValue){
				this.deck[this.deck.length - 1] = thisCard;
				this.deck[ci] = otherCard;
				break;
			}
		}	

		//Запоминаем козырь
		let lastCard = this.deck[this.deck.length - 1];
		lastCard.field = 'BOTTOM';
		this.trumpSuit = lastCard.suit;
	}

	//Раздает карты, возвращает карты для отправки клиентам
	deal(dealsIn){

		let dealsOut = [];

		for (let di = 0; di < dealsIn.length; di++) {

			let dealInfo = dealsIn[di];
			let numOfCards = dealInfo.numOfCards;
			while (numOfCards--) {
				if(!this.deck.length)
					break;

				let card = this.deck[0];

				this.game.logAction(card, 'DEAL', card.field, dealInfo.pid);

				this.hands[dealInfo.pid].push(card);
				card.field = dealInfo.pid;

				let dealFullInfo = {
					pid: dealInfo.pid,
					cardPosition: card.field,
					cid: card.id
				};

				dealsOut.push(dealFullInfo);
				 
				this.deck.shift();
			}
		}
		return dealsOut;
	}

	//Раздает карты пока у всех не по 6 карт или пока колода не закончится,
	//возвращает карты для отправки клиентам
	dealTillFullHand(){
		const game = this.game;
		const players = game.players;
		let originalAttackers = players.originalAttackers;
		let attacker = players.attacker;
		let defender = players.defender;
		let ally = players.ally;
		let deals = [];

		let sequence = [];
		originalAttackers.forEach((p) => {
			if(!sequence.includes(p))
				sequence.push(p);
		});
		if(!sequence.includes(attacker))
			sequence.push(attacker);

		if(ally && !sequence.includes(ally))
			sequence.push(ally);

		if(!sequence.includes(defender))
			sequence.push(defender);

		sequence.forEach((player) => {
			let pid = player.id;
			let cardsInHand = this.hands[pid].length;
			if(cardsInHand < this.normalHandSize){
				let dealInfo = {
					pid: pid,
					numOfCards: this.normalHandSize - cardsInHand
				};
				deals.push(dealInfo);
			}
		});

		if(deals.length){
			return this.deal(deals);
		}
		else{
			return [];
		}
	}

	//Раздает начальные руки, возвращает карты для отправки клиентам
	dealStartingHands(){
		const game = this.game;
		let deals = [];

		for (let cardN = 0; cardN < this.normalHandSize; cardN++) {
			for(let pi = 0; pi < game.players.length; pi++){
				let dealInfo = {
					pid: game.players[pi].id,
					numOfCards: 1
				};
				deals.push(dealInfo);
			}
		}
		return this.deal(deals);
	}

	//Сбрасывает карты, возвращает карты для отправки клиентам
	discard(){

		let action = {
			type: 'DISCARD',
			ids: []
		};

		//Убираем карты со всех позиций на столе
		this.table.forEach((tableField) => {

			if(tableField.attack){
				let card = tableField.attack;
				this.game.logAction(card, 'DISCARD', card.field, 'DISCARD_PILE');
				card.field = 'DISCARD_PILE';

				action.ids.push(tableField.attack.id);
				this.discardPile.push(tableField.attack);
				tableField.attack = null;
			}

			if(tableField.defense){
				let card = tableField.defense;
				this.game.logAction(card, 'DISCARD', card.field, 'DISCARD_PILE');
				card.field = 'DISCARD_PILE';

				action.ids.push(tableField.defense.id);
				this.discardPile.push(tableField.defense);
				tableField.defense = null;
			}

		});

		//Если карты были убраны, оповещаем игроков и переходим в фазу раздачи карт игрокам
		if(action.ids.length){

			//После первого сброса на стол можно класть больше карт
			if(this.table.fullLength < this.table.maxLength){
				this.table.fullLength = this.table.maxLength;
				utils.log('First discard, field expanded to', this.table.fullLength);
			}

			return action;
		}

		//Иначе раздаем карты и переходим в фазу конца хода
		else{
			return null;
		}
	}

}

module.exports = GameCards;