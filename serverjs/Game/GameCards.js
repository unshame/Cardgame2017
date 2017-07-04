/*
 * Класс, управляющий картами и полями игры.
 */
'use strict';

const
	BetterArray = require('../BetterArray'),
	Card = require('./Card');

class GameCards extends BetterArray{

	constructor(game){
		super();
		this.game = game;	

		this.numOfSuits = 4;
		this.maxValue = 14;
		this.normalHandSize = 6;	

		this.deck = new BetterArray();
		this.discardPile = [];
		this.hands = {};

		this.table = new BetterArray();
		this.table.usedFields = 0;
		this.table.maxLength = 6;
		this.table.fullLength = 0;
		this.table.zeroDiscardLength = Math.max(this.table.maxLength - 1, 1);

		this.values = [];
		this.lowestValue = 0;
		this.numOfCards = 0;
		this.trumpSuit = null;

		this.log = game.log;

		// Добавляем указатели на элементы игре
		game.deck = this.deck;
		game.discardPile = this.discardPile;
		game.table = this.table;
		game.hands = this.hands;
	}
	static get [Symbol.species]() { return Array; }

	// Карты по id
	get byId(){
		return this.byKey('id');
	}

	// Возвращает первое свободное место на столе
	get firstEmptyTable(){
		let tableField = this.table.find((t, i) => {
			return i < this.table.fullLength && !t.attack && !t.defense;
		});
		return tableField;
	}

	get defenseFields(){
		let defenseFields = [];
		this.table.forEach((tableField) => {
			if(tableField.attack && !tableField.defense){
				defenseFields.push(tableField);
			} 
		});
		return defenseFields;
	}

	get lockedFieldsIds(){
		let lockedFields = [];
		for(let i = this.table.fullLength; i < this.table.maxLength; i++){
			lockedFields.push(this.table[i].id);
		}
		return lockedFields;
	}

	getInfo(reveal){

		let cardsToSend = {};

		let players = this.game.players;

		players.forEach((p) => {
			let pid = p.id;
			cardsToSend[pid] = [];

			// Колода
			this.deck.forEach((card) => {
				let newCard = card.info;

				// Игроки знают только о значении карты на дне колоды
				if(card.field != 'BOTTOM' && !reveal){
					newCard.value = null;
					newCard.suit = null;			
				} 
				cardsToSend[pid].unshift(newCard);
			});

			// Руки
			for(let hid in this.hands){
				if(!this.hands.hasOwnProperty(hid))
					continue;

				/*jshint loopfunc: true */
				let hand = this.hands[hid];
				hand.forEach((card) => {
					let newCard = card.info;

					if(card.field != pid && !reveal){
						newCard.value = null;
						newCard.suit = null;			
					} 

					cardsToSend[pid].push(newCard);
				});
			}	

			// В игре
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

			// Сброс
			this.discardPile.forEach((c) => {
				let newCard = c.info;
				if(!reveal){
					newCard.suit = null;
					newCard.value = null;
				}
				cardsToSend[pid].push(newCard);
			});
		});

		return cardsToSend;
	}

	// Обнуляет карты
	reset(soft){
		const game = this.game;

		// Убираем уже существующие карты
		if(!soft){
			this.length = 0;
		}

		// Колода
		this.deck.length = 0;
		
		// Стопка сброса
		this.discardPile.length = 0;
		
		// Руки игроков (объекты с id карт по id игроков)		
		Object.keys(this.hands).forEach((key) => {
			delete this.hands[key];
		});			

		// Поля (стол)
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

	// Создает карты, поля и руки
	make(){
		const game = this.game;

		if(!this.length){

			// Значения карт
			this.values.length = 0;
		
			// Задаем количество карт и минимальное значение карты
			if(game.players.length > 3){
				this.lowestValue = 2;
				this.numOfCards = 52;
			}
			else{
				this.lowestValue = 6;
				this.numOfCards = 36;
			}

			// Задаем значения карт
			for (let i = this.lowestValue; i <= this.maxValue; i++) {
				this.values.push(i);
			}	
		}

		// Создаем руки
		game.players.forEach((p) => {
			this.hands[p.id] = [];
		});

		// Создаем колоду
		if(!this.length){
			this.makeDeck();
		}
		else{
			this.shuffle();
		}

		// Запоминаем козырь
		this.findTrumpCard();
	}

	// Создает колоду
	makeDeck(){

		// Добавляем карты в колоду и в сам объект
		this.values.forEach((v) => {
			for(let si = 0; si < this.numOfSuits; si++){
				let card = new Card(si, v, 'DECK');
				this.push(card);
				this.deck.push(card);
			}		
		});

		// Перемешиваем колоду
		this.deck.shuffle();		
	}

	shuffle(){

		this.forEach((c) => {
			c.field = 'DECK';
			this.deck.push(c);
		});

		// Перемешиваем колоду
		this.deck.shuffle();

		// Перемешиваем id карт
		this.shuffleKey('id');
	}

	// Находит козырную карту
	findTrumpCard(){
		// Находим первый попавшийся не туз и кладем его на дно колоды, это наш козырь
		for(let ci = 0; ci < this.deck.length; ci++){

			let thisCard = this.deck[ci];
			let otherCard = this.deck[this.deck.length - 1];
			if(thisCard.value != this.maxValue){
				this.deck[this.deck.length - 1] = thisCard;
				this.deck[ci] = otherCard;
				break;
			}
		}	

		// Запоминаем козырь
		let lastCard = this.deck[this.deck.length - 1];
		lastCard.field = 'BOTTOM';
		this.trumpSuit = lastCard.suit;
	}

	// Раздает карты, возвращает карты для отправки клиентам
	deal(dealsIn){

		let dealsOut = [];

		for (let di = 0; di < dealsIn.length; di++) {

			let dealInfo = dealsIn[di];
			let numOfCards = dealInfo.numOfCards;
			while (numOfCards--) {
				if(!this.deck.length)
					break;

				let card = this.deck[0];

				this.game.actions.logAction(card, 'DEAL', card.field, dealInfo.pid);

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

	// Раздает карты пока у всех не по 6 карт или пока колода не закончится,
	// возвращает карты для отправки клиентам
	dealTillFullHand(){
		const game = this.game;
		const players = game.players;
		let originalAttackers = players.originalAttackers;
		let attackers = players.attackers;
		let defender = players.defender;
		let deals = [];

		let sequence = [];
		originalAttackers.forEach((p) => {
			if(!sequence.includes(p))
				sequence.push(p);
		});
		
		attackers.forEach((attacker) => {
			if(!sequence.includes(attacker)){
				sequence.push(attacker);
			}
		});

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

	// Раздает начальные руки, возвращает карты для отправки клиентам
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

	// Сбрасывает карты, возвращает карты для отправки клиентам
	discard(){

		let action = {
			type: 'DISCARD',
			ids: []
		};

		// Убираем карты со всех позиций на столе
		this.table.forEach((tableField) => {

			if(tableField.attack){
				let card = tableField.attack;
				this.game.actions.logAction(card, 'DISCARD', card.field, 'DISCARD_PILE');
				card.field = 'DISCARD_PILE';

				action.ids.push(tableField.attack.id);
				this.discardPile.push(tableField.attack);
				tableField.attack = null;
			}

			if(tableField.defense){
				let card = tableField.defense;
				this.game.actions.logAction(card, 'DISCARD', card.field, 'DISCARD_PILE');
				card.field = 'DISCARD_PILE';

				action.ids.push(tableField.defense.id);
				this.discardPile.push(tableField.defense);
				tableField.defense = null;
			}

		});

		// Если карты были убраны, оповещаем игроков и переходим в фазу раздачи карт игрокам
		if(action.ids.length){

			// После первого сброса на стол можно класть больше карт
			if(this.table.fullLength < this.table.maxLength){
				this.table.fullLength++;
				this.log.info('First discard, field expanded to', this.table.fullLength);
				action.unlockedField = 'TABLE' + (this.table.fullLength - 1);
			}

			return action;
		}

		// Иначе раздаем карты и переходим в фазу конца хода
		else{
			return null;
		}
	}

	getAttackActions(hand, actions){
		// Находим значения карт, которые можно подбрасывать
		let validValues = [];
		this.table.forEach((tableField) => {
			if(tableField.attack){
				let card = tableField.attack;
				validValues.push(card.value);
			}
			if(tableField.defense){
				let card = tableField.defense;
				validValues.push(card.value);
			}
		});

		if(!validValues.length){
			validValues = null; 
		}

		let emptyTable = this.firstEmptyTable;

		// Выбираем подходящие карты из руки атакующего и собираем из них возможные действия
		hand.forEach((card) => {
			let cid = card.id;
			if(!validValues || ~validValues.indexOf(card.value)){		
				this.table.forEach((tableField) => {	
					let action = {
						type: 'ATTACK',
						cid: cid,
						field: tableField.id,
						linkedField: emptyTable.id
					};
					actions.push(action);
				});
			}
		});
	}

	getDefenseActions(hand, actions, defenseFields){

		// Создаем список возможных действий защищающегося
		defenseFields.forEach((defenseField) => {
			let fid = defenseField.id;
			hand.forEach((card) => {
				let cid = card.id;
				let otherCard = defenseField.attack;

				// Карты той же масти и большего значения, либо козыри, если битая карта не козырь,
				// иначе - козырь большего значения
				if( 
					card.suit == this.trumpSuit && otherCard.suit != this.trumpSuit ||
					card.suit == otherCard.suit && card.value > otherCard.value
				){			
					let action = {
						type: 'DEFENSE',
						cid: cid,
						field: fid
					};
					actions.push(action);
				}
			});
		});
	}

	getTransferActions(hand, actions, defenseFields){
		// Узнаем, можно ли переводить
		let attackers = this.game.players.attackers;
		let canTransfer = 
			this.hands[
				attackers[1] && attackers[1].id || attackers[0].id
			].length > this.table.usedFields;

		let attackField = this.table[this.table.usedFields];

		if(!canTransfer || !attackField)
			return;

		for(let fi = 0; fi < this.table.length; fi++){
			let tableField = this.table[fi];
			if(tableField.defense){
				canTransfer = false;
				break;
			}
		}

		if(!canTransfer)
			return;

		let defenseActionFields = actions.map((action) => action.field);

		let emptyTable = this.firstEmptyTable;

		for(let di = 0; di < defenseFields.length; di++){
			for(let ci = 0; ci < hand.length; ci++){
				let card = hand[ci];
				let cid = card.id;
				let otherCard = defenseFields[di].attack;

				if(card.value != otherCard.value)
					continue;

				// Все поля, которые уже не находятся в возможных действиях
				for(let fi = 0; fi < this.table.length; fi++){	
					let fid = this.table[fi].id;

					if(defenseActionFields.includes(fid))
						continue;

					let action = {
						type: 'ATTACK',
						cid: cid,
						field: fid,
						linkedField: emptyTable.id
					};
					actions.push(action);
				}
			}
		}
	}

	getDiscardAction(player){
		let pid = player.id;
		let cardsInfo = [];
		let actionType = 'TAKE';

		for(let fi = 0; fi < this.table.length; fi++){
			let tableField = this.table[fi];

			if(tableField.attack){

				let card = tableField.attack;
				this.game.actions.logAction(card, actionType, card.field, pid);
				card.field = pid;

				this.hands[pid].push(tableField.attack);
				tableField.attack = null;

				let cardToSend = {
					cid: card.id,
					suit: card.suit,
					value: card.value
				};

				cardsInfo.push(cardToSend);
			}

			if(tableField.defense){

				let card = tableField.defense;
				this.game.actions.logAction(card, actionType, card.field, pid);
				card.field = pid;

				this.hands[pid].push(tableField.defense);
				tableField.defense = null;

				let cardToSend = {
					cid: card.id,
					suit: card.suit,
					value: card.value
				};

				cardsInfo.push(cardToSend);
			}

		}
		return {
			type: actionType,
			cards: cardsInfo,
			pid: pid
		};
	}

}

module.exports = GameCards;