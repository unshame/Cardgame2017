'use strict';

const
	BetterArray = reqfromroot('BetterArray'),
	GameCards = reqfromroot('Game/GameCards'),
	Card = reqfromroot('Card/Card');

class DurakCards extends GameCards{
	constructor(game){
		super(game, {
			card: Card,
			normalHandSize: 6,
			lowestValue: 0,
			numOfSuits: 4,
			maxValue: 14
		});

		this.table = new BetterArray();
		this.table.usedFields = 0;
		this.table.maxLength = 6;
		this.table.fullLength = 0;
		this.table.zeroDiscardLength = Math.max(this.table.maxLength - 1, 1);

		this.trumpSuit = null;
	}

	static get [Symbol.species]() { return Array; }

	createValues(){
		const game = this.game;
		
		// Значения карт
		this.values.length = 0;
		
		// Задаем количество карт и минимальное значение карты
		if(game.players.length > 3){
			this.lowestValue = 2;
		}
		else{
			this.lowestValue = 6;
		}

		// Задаем значения карт
		for (let i = this.lowestValue; i <= this.maxValue; i++) {
			this.values.push(i);
		}	
	}

	// Стол

	// Возвращает первое свободное место на столе
	get firstEmptyTable(){
		let tableField = this.table.find((t, i) => {
			return i < this.table.fullLength && !t.attack && !t.defense;
		});
		return tableField;
	}

	// Возвращает столы с заполненным attackField, но пустым defendField
	get defenseTables(){
		let defenseTables = [];
		this.table.forEach((tableField) => {
			if(tableField.attack && !tableField.defense){
				defenseTables.push(tableField);
			} 
		});
		return defenseTables;
	}

	// Возвращает id закрытых столов
	get lockedTablesIds(){
		let lockedFields = [];
		for(let i = this.table.fullLength; i < this.table.maxLength; i++){
			lockedFields.push(this.table[i].id);
		}
		return lockedFields;
	}

	get emptyTables(){
		let emptyTables = [];
		this.table.forEach((tableField) => {
			if(!tableField.attack && !tableField.defense){
				emptyTables.push(tableField);
			} 
		});
		return emptyTables;
	}


	// Поля

	// Колода с козырной картой на дне
	addDeckInfo(cardsInfo, pid, reveal){
		this.deck.forEach((card) => {
			let newCard = card.info;

			// Игроки знают только о значении карты на дне колоды
			if(card.field != 'BOTTOM' && !reveal){
				newCard.value = null;
				newCard.suit = null;			
			} 
			if(newCard.field == 'BOTTOM'){
				newCard.field = 'DECK';
			}
			cardsInfo.unshift(newCard);
		});
	}

	// Стол с несколькими полями и attackField и defendField на каждом поле
	addTableInfo(cardsInfo, pid, reveal){
		this.table.forEach((tableField) => {
			if(tableField.attack){
				let card = tableField.attack;
				let newCard = card.info;
				cardsInfo.push(newCard);
			}
			if(tableField.defense){
				let card = tableField.defense;
				let newCard = card.info;
				cardsInfo.push(newCard);
			}		
		});
	}

	// Обнуляет карты или перемешивает их id
	reset(hard){

		super.reset(hard);
		
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
		super.make();

		// Запоминаем козырь
		this.findTrumpCard();
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
			if(!sequence.includes(p)){
				sequence.push(p);
			}
		});
		
		attackers.forEach((attacker) => {
			if(!sequence.includes(attacker)){
				sequence.push(attacker);
			}
		});

		if(!sequence.includes(defender)){
			sequence.push(defender);
		}

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

	// Убирает карты со стола в указанное поле
	// Возвращает действие с информацией об убранных картах
	moveCardsFromTable(field, fieldId, actionType, flipCards){
		let cardsInfo = [];
		this.table.forEach((tableField) => {

			if(tableField.attack){

				let card = tableField.attack;
				this.game.actions.logAction(card, actionType, card.field, fieldId);
				card.field = fieldId;

				field.push(tableField.attack);
				tableField.attack = null;

				let cardToSend = {
					cid: card.id,
					suit: flipCards ? null : card.suit,
					value: flipCards ? undefined : card.value
				};

				cardsInfo.push(cardToSend);
			}

			if(tableField.defense){

				let card = tableField.defense;
				this.game.actions.logAction(card, actionType, card.field, fieldId);
				card.field = fieldId;

				field.push(tableField.defense);
				tableField.defense = null;

				let cardToSend = {
					cid: card.id,
					suit: flipCards ? null : card.suit,
					value: flipCards ? undefined : card.value
				};

				cardsInfo.push(cardToSend);
			}

		});
		return {
			type: actionType,
			cards: cardsInfo,
			field: fieldId
		};
	}

	// Сбрасывает карты, возвращает карты для отправки клиентам
	discard(){
		let action = this.moveCardsFromTable(this.discardPile, 'DISCARD_PILE', 'DISCARD', true);

		// Если карты были убраны, оповещаем игроков и переходим в фазу раздачи карт игрокам
		if(action.cards.length){

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

	// Переносит карты в руку игрока, возвращает действие для отправки клиентам
	take(player){
		let action = this.moveCardsFromTable(this.hands[player.id], player.id, 'TAKE', false);
		action.pid = action.field;
		delete action.field;
		return action;
	}

	// Действия
	
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
				let action = {
					type: 'ATTACK',
					cid: cid,
					cvalue: card.value,
					csuit: card.suit,
					field: emptyTable.id
				};
				actions.push(action);
			}
		});
	}

	getDefenseActions(hand, actions, defenseTables){

		// Создаем список возможных действий защищающегося
		defenseTables.forEach((defenseField) => {
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
						cvalue: card.value,
						csuit: card.suit,
						field: fid
					};
					actions.push(action);
				}
			});
		});
	}

	getTransferActions(hand, actions, defenseTables){
		// Узнаем, можно ли переводить
		let attackers = this.game.players.attackers;
		let canTransfer = 
			this.hands[
				attackers[1] && attackers[1].id || attackers[0].id
			].length > this.table.usedFields;

		let attackField = this.table[this.table.usedFields];

		if(!canTransfer || !attackField){
			return;
		}

		for(let fi = 0; fi < this.table.length; fi++){
			let tableField = this.table[fi];
			if(tableField.defense){
				canTransfer = false;
				break;
			}
		}

		if(!canTransfer){
			return;
		}

		let emptyTable = this.firstEmptyTable; 

		for(let di = 0; di < defenseTables.length; di++){
			for(let ci = 0; ci < hand.length; ci++){
				let card = hand[ci];
				let cid = card.id; 
				let otherCard = defenseTables[di].attack;

				if(card.value != otherCard.value){
					continue;
				}

				let action = { 
				    type: 'ATTACK', 
				    cid: cid,
					cvalue: card.value,
					csuit: card.suit,
				    field: emptyTable.id
				}; 
				actions.push(action); 
			}
		}
	}
}

module.exports = DurakCards;
