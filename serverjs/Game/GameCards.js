/*
 * Класс, управляющий картами и полями игры.
 */
'use strict';

var utils = require('../utils'),
	BetterArray = require('../BetterArray'),
	Card = require('./Card');

class GameCards extends BetterArray{

	constructor(game){
		super();
		this.game = game;	

		this.numOfSuits = 4;
		this.maxValue = 14;
		this.normalHandSize = 6;	

		this.field = new BetterArray();
		this.field.usedSpots = 0;
		this.field.maxLength = 6;
		this.field.zeroDiscardLength = this.field.maxLength - 1;
	}
	static get [Symbol.species]() { return Array; }

	//Карты по id
	get byId(){
		return this.byKey('id');
	}

	getInfo(players){

		let cardsToSend = {};

		for(let pi = 0; pi < players.length; pi++){

			let p = players[pi];
			let pid = p.id;
			let hand = this.hands[pid];
			cardsToSend[pid] = [];

			//Колода
			for(let ci = 0; ci < this.deck.length; ci++){

				let card = this.deck[ci];
				let newCard = card.info;

				//Игроки знают только о значении карты на дне колоды
				if(card.spot != 'BOTTOM'){
					newCard.value = null;
					newCard.suit = null;			
				} 
				cardsToSend[pid].push(newCard);
			}

			//Руки
			for(let ci = 0; ci < hand.length; ci++){

				let card = hand[ci];
				let newCard = card.info;

				if(card.spot != pid){
					newCard.value = null;
					newCard.suit = null;			
				} 

				cardsToSend[pid].push(newCard);
			}			

			//В игре
			for(let fi = 0; fi < this.field.length; fi++){

				let fieldSpot = this.field[fi];
				if(fieldSpot.attack){
					let card = fieldSpot.attack;
					let newCard = card.info;
					cardsToSend[pid].push(newCard);
				}
				if(fieldSpot.defense){
					let card = fieldSpot.defense;
					let newCard = card.info;
					cardsToSend[pid].push(newCard);
				}		
			}
		}

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
		this.field.length = 0;
		this.field.length = this.field.maxLength;		
		this.field.fullLength = this.field.zeroDiscardLength;
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

	//Создает карты, поля и руки
	make(){
		const game = this.game;

		//Значения карт
		this.values = [];

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

		//Создаем руки
		for (let pi = 0; pi < game.players.length; pi++) {
			this.hands[game.players[pi].id] = [];
		}

		//Создаем колоду
		this.makeDeck();

		//Добавляем указатели на элементы игре
		game.deck = this.deck;
		game.discardPile = this.discardPile;
		game.field = this.field;
		game.hands = this.hands;
	}

	//Создает колоду
	makeDeck(){

		//Добавляем карты в колоду и в сам объект
		for(let vi = 0; vi < this.values.length; vi++){

			for(let si = 0; si < this.numOfSuits; si++){
				let card = new Card(si, this.values[vi], 'DECK');
				this.push(card);
				this.deck.push(card);
			}		
		}

		//Перемешиваем колоду
		this.deck.shuffle();
		
		//Находим первый попавшийся не туз и кладем его на дно колоды, это наш козырь
		for(let ci = 0; ci < this.deck.length; ci++){

			let thisCard = this.deck[ci];
			let otherCard = this.deck[this.deck.length - 1];
			if(thisCard.value != this.maxCardValue){
				this.deck[this.deck.length - 1] = thisCard;
				this.deck[ci] = otherCard;
				break;
			}
		}	

		//Запоминаем козырь
		let lastCard = this.deck[this.deck.length - 1];
		lastCard.spot = 'BOTTOM';
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

				this.game.logAction(card, 'DEAL', card.spot, dealInfo.pid);

				this.hands[dealInfo.pid].push(card);
				card.spot = dealInfo.pid;

				let dealFullInfo = {
					pid: dealInfo.pid,
					cardPosition: card.spot,
					cid: card.id
				}

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
		for(let oi = 0; oi < originalAttackers.length; oi++){
			let p = originalAttackers[oi];
			if(!~sequence.indexOf(p))
				sequence.push(p);
		}
		if(!~sequence.indexOf(attacker))
			sequence.push(attacker);

		if(ally && !~sequence.indexOf(ally))
			sequence.push(ally);

		if(!~sequence.indexOf(defender))
			sequence.push(defender);

		for(let si = 0; si < sequence.length; si++){
			let player = sequence[si];
			let pid = player.id;
			let cardsInHand = this.hands[pid].length;
			if(cardsInHand < this.normalHandSize){
				let dealInfo = {
					pid: pid,
					numOfCards: this.normalHandSize - cardsInHand
				}
				deals.push(dealInfo);
			}
		}

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
				}
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
		for(let fi = 0; fi < this.field.length; fi++){

			let fieldSpot = this.field[fi];

			if(fieldSpot.attack){
				let card = fieldSpot.attack;
				this.game.logAction(card, 'DISCARD', card.spot, 'DISCARD_PILE');
				card.spot = 'DISCARD_PILE';

				action.ids.push(fieldSpot.attack.id);
				this.discardPile.push(fieldSpot.attack);
				fieldSpot.attack = null;
			}

			if(fieldSpot.defense){
				let card = fieldSpot.defense;
				this.game.logAction(card, 'DISCARD', card.spot, 'DISCARD_PILE');
				card.spot = 'DISCARD_PILE';

				action.ids.push(fieldSpot.defense.id);
				this.discardPile.push(fieldSpot.defense);
				fieldSpot.defense = null;
			}

		}

		//Если карты были убраны, оповещаем игроков и переходим в фазу раздачи карт игрокам
		if(action.ids.length){

			//После первого сброса на стол можно класть больше карт
			if(this.field.fullLength <= this.field.zeroDiscardLength){
				this.field.fullLength++;
				utils.log('First discard, field expanded to', this.field.fullLength);
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