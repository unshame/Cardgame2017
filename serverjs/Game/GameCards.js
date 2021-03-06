'use strict';

const CardManager = reqfromroot('Card/CardManager');

class GameCards extends CardManager{
	constructor(game, config){
		super(game, config);

		this.normalHandSize = config.normalHandSize;	

		this.discardPile = [];
		this.hands = {};
		this.table = [];

	}
	static get [Symbol.species]() { return Array; }

	getInfo(reveal){

		let cardsToSend = {};

		let players = this.game.players;

		players.forEach((p) => {
			let pid = p.id;
			let cardsInfo = [];

			this.addDeckInfo(cardsInfo, pid, reveal);
			this.addHandInfo(cardsInfo, pid, reveal);
			this.addTableInfo(cardsInfo, pid, reveal);
			this.addDiscardPileInfo(cardsInfo, pid, reveal);

			cardsToSend[pid] = cardsInfo;
		});

		return cardsToSend;
	}

	addDeckInfo(cardsInfo, pid, reveal){
		this.deck.forEach((card) => {
			let newCard = card.info;

			if(!reveal){
				newCard.value = null;
				newCard.suit = null;			
			} 
			cardsInfo.unshift(newCard);
		});
	}

	addCardInfo(cardsInfo, card, pid, reveal){
		let newCard = card.info;

		if(card.field != pid && !reveal){
			newCard.value = null;
			newCard.suit = null;			
		} 

		cardsInfo.push(newCard);
	}

	addHandInfo(cardsInfo, pid, reveal){

		// Руки
		for(let hid in this.hands){
			if(!this.hands.hasOwnProperty(hid)){
				continue;
			}

			let hand = this.hands[hid];
			hand.forEach((c) => this.addCardInfo(cardsInfo, c, pid, reveal));
		}	
	}

	addTableInfo(cardsInfo, pid, reveal){
		this.table.forEach((card) => {
			cardsInfo.push(card.info);
		});
	}

	addDiscardPileInfo(cardsInfo, pid, reveal){
		this.discardPile.forEach((c) => {
			let newCard = c.info;
			if(!reveal){
				newCard.suit = null;
				newCard.value = null;
			}
			cardsInfo.push(newCard);
		});
	}

	// Обнуляет карты
	reset(hard){

		super.reset(hard);
		
		// Стопка сброса
		this.discardPile.length = 0;
		
		// Руки игроков (объекты с id карт по id игроков)		
		Object.keys(this.hands).forEach((key) => {
			delete this.hands[key];
		});			

		this.table.length = 0;
	}

	// Создает карты, поля и руки
	make(){
		const game = this.game;

		super.make();

		// Создаем руки
		game.players.forEach((p) => {
			this.hands[p.id] = [];
		});
	}

	// Раздает карты, возвращает карты для отправки клиентам
	deal(dealsIn){

		let dealsOut = [];

		for (let di = 0; di < dealsIn.length; di++) {

			let dealInfo = dealsIn[di];
			let numOfCards = dealInfo.numOfCards;
			while (numOfCards--) {
				if(!this.deck.length){
					break;
				}

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

		let action = this.moveCardsFromTable(this.discardPile, 'DISCARD_PILE', 'DISCARD', true);

		// Если карты были убраны, оповещаем игроков и переходим в фазу раздачи карт игрокам
		if(action.cards.length){
			return action;
		}
		// Иначе раздаем карты и переходим в фазу конца хода
		else{
			return null;
		}
	}

	moveCardsFromTable(field, fieldId, actionType, flipCards){
		let cardsInfo = [];
		// Убираем карты со всех позиций на столе
		this.table.forEach((card) => {
			this.game.actions.logAction(card, actionType, card.field, fieldId);

			card.field = fieldId;
			this.discardPile.push(card);			

			let cardToSend = {
				cid: card.id,
				suit: flipCards ? null : card.suit,
				value: flipCards ? undefined : card.value
			};
			cardsInfo.push(cardToSend);

		});
		this.table.length = 0;

		return {
			type: actionType,
			cards: cardsInfo,
			field: fieldId
		};
	}
}

module.exports = GameCards;