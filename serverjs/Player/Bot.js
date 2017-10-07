/*
	Серверные боты
*/

// TODO 1 on 1 mode
// TODO Cheater dfficulty Attack: uses cards that opponent can't beat
// TODO MaxQtyCard: problem with trump suit?????
//


'use strict';

const
	generateId = require('../generateId'),
	Log = require('../logger'),
	Player = require('./Player');


class Bot extends Player {
	constructor(randomNames, queueType, decisionTime, difficulty) {
		// Difficulties: EASY, MEDIUM, HARD
		super(null, null, null, false);
		this.id = 'bot_' + generateId();
		this.log = Log(module, this.id);
		this.type = 'bot';
		this.queueType = queueType;
		this.connected = true;
		this.actionTimeout = null;

		// NOTE difficulties: 0 - Easy, 1 - Medium, 2 - Hard, 3 - Cheater
		if (difficulty === undefined) {
			difficulty = 3;
		}

		this.difficulty = difficulty;

		if (typeof decisionTime != 'number' || isNaN(decisionTime)) {
			decisionTime = 1500;
		}
		this.decisionTime = decisionTime;

		let nameIndex = Math.floor(Math.random() * randomNames.length);
		if (randomNames.length) {
			this.name = randomNames[nameIndex];
			randomNames.splice(nameIndex, 1);
		} else {
			this.name = this.id;
		}
	}

	getDecisionTime(addedTime) {
		if (!this.game) {
			return 0;
		}
		let minTime = this.game.fakeDecisionTimer || 0;

		if (addedTime === undefined || minTime === 0) {
			addedTime = 0;
		}
		return Math.random() * addedTime + minTime;
	}


	// Получение действий //

	recieveGameInfo(info) {
		if (!info.noResponse) {
			this.sendDelayedResponse();
		}
	}

	recieveDeals(deals) {
		this.sendDelayedResponse();
	}

	recieveValidActions(actions, deadline, roles, turnIndex, turnStage) {
		clearTimeout(this.actionTimeout);
		if (actions.length) {
			this.actionTimeout = setTimeout(() => {
				if (!this.game || !this.game.active) {
					this.log.warn('No game or game is inactive');
					return;
				}
				console.log('RECEIVED ACTIONS: ', actions);
				console.log('Is Attack Turn', this.isAttackTurn());

				if (this.isAttackTurn()) {
					this.sendResponseSync(this.chooseAttack(actions));
				} else {
					this.sendResponseSync(this.choooseDefence(actions));
				}


			}, this.getDecisionTime(this.decisionTime));
		}
	}

	recieveCompleteAction(action) {
		if (!action.noResponse) {
			this.sendDelayedResponse();
		}
	}

	recieveNotification(action) {
		if (action.noResponse) {
			return;
		}
		clearTimeout(this.actionTimeout);
		if (action.actions) {
			let ai = (this.game && this.game.isTest || this.queueType == 'botmatch') ? 0 : 1;
			this.sendDelayedResponse(action.actions[ai]);
		}
	}


	// Отправка ответов //

	sendDelayedResponse(action) {
		clearTimeout(this.actionTimeout);
		this.actionTimeout = setTimeout(() => {
			this.sendResponseSync(action);
		}, this.getDecisionTime());
	}

	// Синхронно посылает синхронный ответ серверу
	// Асинхронность должна быть создана перед вызовом
	sendResponseSync(action) {
		if (!this.game) {
			this.log.warn('No game has been assigned', action);
			return;
		}
		if (!this.game.active) {
			return;
		}
		this.game.recieveResponseSync(this, action || null);
	}

	// Асинхронно посылает синхронный ответ серверу с коллбэком (для тестов)
	sendResponseWithCallback(action, callback) {
		if (!this.game) {
			this.log.warn('No game has been assigned', action);
			return;
		}
		clearTimeout(this.actionTimeout);
		this.actionTimeout = setTimeout(() => {
			this.sendResponseSync(action);
			if (callback) {
				callback();
			}
		}, 0);
	}

	/*
	 *
	 * Выбор действия бота
	 *
	 */

	chooseAttack(actions) {
		let minAction = this.findMinAction(actions),
			pass = this.findPassAction(actions),
			gameStage = this.defineGameStage(),
			maxQtyCard = this.findMaxQtyCard(minAction, actions, gameStage),
			cardToAction = this.changeCardIntoAction;

		console.log('MaxQtyCard: ', maxQtyCard);
		console.log('Min Action: ', minAction);

		// return this.isOneOnOne ? this.chooseOneOnOneAttack(actions) :
		return this.isPass(minAction, pass) ? pass :
			maxQtyCard ? cardToAction(actions, maxQtyCard) :
			minAction;
	}

	choooseDefence(actions) {
		let minAction = this.findMinAction(actions),
			tableCardsValues = this.findTableCardsValues(),
			transfer = this.findMinAction(actions, undefined, true),
			take = this.findTakeAction(actions),
			gameStage = this.defineGameStage(),
			maxQtyCard = this.findMaxQtyCard(minAction, actions, gameStage),
			minActionWithTableValue = this.findMinAction(actions, tableCardsValues),
			cardToAction = this.changeCardIntoAction;

		console.log('TRANSFER: ', transfer);
		console.log('MaxQtyCard: ', maxQtyCard);
		console.log('Min Action: ', minAction);

		//return this.isOneOnOne ? this.chooseOneOnOneDefence(actions, transfer) :
		return this.isTransfer(gameStage, transfer, actions) ? transfer :
			this.isTake(gameStage, minAction, actions) ? take :
			this.isMinActionWithTableValue(gameStage, minActionWithTableValue) ? minActionWithTableValue :
			maxQtyCard ? cardToAction(actions, maxQtyCard) :
			minAction;
	}

	chooseOneOnOneDefence(actions) {

	}

	chooseOneOnOneAttack(actions) {

	}



	findMinAction(actions, tableCardsValues, isTransfer) {
		/**
		 * Метод, возврающий наименьшую карту из тех, которыми можно походить.
		 */
		let minAction = {
			cvalue: Infinity
		};

		for (let i = 0; i < actions.length; i++) {
			let isDefense = actions[i].type === 'DEFENSE',
				isPass = actions[i].type === 'PASS',
				isTake = actions[i].type === 'TAKE';

			if (isTake || (isPass || (isTransfer && isDefense) ||
					(tableCardsValues && ((!isDefense) || (!tableCardsValues.includes(actions[i].cvalue)))))) {
				continue;
			}

			let isMinActionTrump = minAction.csuit === this.game.cards.trumpSuit,
				isActionTrump = actions[i].csuit === this.game.cards.trumpSuit;


			if (isMinActionTrump && (!isActionTrump)) {
				minAction = actions[i];
				continue;
			}

			if ((actions[i].cvalue < minAction.cvalue) &&
				(isActionTrump && (isMinActionTrump || (minAction.csuit === undefined))) ||
				((!isMinActionTrump) && (!isActionTrump))) {
				minAction = actions[i];
			}
		}
		/*
		 * Если наиболее выгодное действие было найдено,
		 * то метод возвращает его
		 */
		return (minAction.cvalue !== Infinity) ? minAction : undefined;
	}

	findPassAction(actions) {
		// Метод, возвращающий действие типа 'PASS', если такое есть. Иначе возвращается undefined.

		for (let i = 0; i < actions.length; i++) {
			if (actions[i].type === 'PASS') {
				return actions[i];
			}
		}
	}

	findTakeAction(actions) {
		// Метод, возвращающий действие типа 'TAKE', если такое есть. Иначе возвращается undefined.

		for (let i = 0; i < actions.length; i++) {
			if (actions[i].type === 'TAKE') {
				return actions[i];
			}
		}
	}

	isAttackTurn() {
		// Метод, определяющий тип действия, которое нужно совершить боту.

		return this.statuses.role === 'attacker';
	}

	defineGameStage() {
		/**
		 * Метод, определяющий стадию игры.
		 */
		let gameStages = ['EARLY_GAME', 'END_GAME'],
			deck = this.game.deck;

		return (deck.length < 5) ? gameStages[1] : gameStages[0];
	}

	findMaxQtyCard(minAction, actions, gameStage) {
		/*
		 * Метод, находящий id пары или тройки карт одного типа, которые не являются козырными и меньше J.
		 * При этом разница между этой парой(тройкой) и минимальной картой, которой можно походить, не
		 * должна быть больше 2.
		 * В итоге выводится одно из этих действий. В приоритете выбор с самой частой мастью. Или мастью не равной самой редкой.
		 */
		if ((!minAction) || (this.difficulty < 2)) {
			return undefined;
		}

		let cardsByValue = this.getCardsByValue(minAction, actions, gameStage),
			maxQtyCards = [];

		for (let value in cardsByValue) {
			if (cardsByValue[value].length > maxQtyCards.length) {
				maxQtyCards = cardsByValue[value];
			}
		}

		if (maxQtyCards.length) {
			let rareSuit = this.findRareSuit(),
				commonSuit = this.findCommonSuit();

			for (let i = 0; i < maxQtyCards.length; i++) {
				if (maxQtyCards[i].suit === commonSuit) {
					return maxQtyCards[i];
				}
			}

			for (let i = 0; i < maxQtyCards.length; i++) {
				if (maxQtyCards[i].suit !== rareSuit) {
					return maxQtyCards[i];
				}
			}

			return maxQtyCards[0];
		}
	}

	isThisValueOut(value) {
		/*
		 * Метод, проверяющий, вышли ли оставшиеся карты этого типа из игры (которых нету у этого бота в руке).
		 * Для проверки используются только данные этого бота и стопки сброса.
		 * НЕ ПРОТЕСТИРОВАНО
		 */
		let cardsInHand = this.game.hands[this.id],
			valueQty = 4,
			discardPile = this.game.discardPile;

		for (let i = 0; i < cardsInHand.length; i++) {
			if (cardsInHand[i].value === value) {
				valueQty--;
			}
		}

		for (let i = 0; i < discardPile.length; i++) {
			if (discardPile[i].value === value) {
				valueQty--;
			}
		}

		return valueQty ? true : false;
	}

	changeCardIntoAction(actions, card) {
		/*
		 * Метод, получающий из карты, доступное с ней действие.
		 */
		for (let i = 0; i < actions.length; i++) {
			if (actions[i].cid === card.id) {
				return actions[i];
			}
		}
	}

	getCardsByValue(minAction, actions, gameStage) {
		let cardsInHand = this.game.hands[this.id],
			allowedCardsIDs = this.getAllowedCardsIDs(actions),
			isEndGame = gameStage === 'END_GAME',
			trumpSuit = this.game.cards.trumpSuit,
			cardsByValue = {};

		function isTrump(card) {
			return card.suit === trumpSuit;
		}

		for (let i = 0; i < cardsInHand.length; i++) {
			if ((!isTrump(cardsInHand[i])) && (isEndGame || (cardsInHand[i].value < 11)) &&
				(cardsInHand[i].value <= (minAction.cvalue + 2) && (allowedCardsIDs.includes(cardsInHand[i].id)))) {

				if (!cardsByValue[cardsInHand[i].value]) {
					cardsByValue[cardsInHand[i].value] = [];
				}

				cardsByValue[cardsInHand[i].value].push(cardsInHand[i]);
			}
		}

		return cardsByValue;
	}

	getAllowedCardsIDs(actions) {
		let allowedCardsIDs = [];

		for (let i = 0; i < actions.length; i++) {
			if (!allowedCardsIDs.includes(actions[i].cid)) {
				allowedCardsIDs.push(actions[i].cid);
			}
		}

		return allowedCardsIDs;
	}

	getDefensePlayerID() {
		let players = this.game.players;

		for (let i = 0; i < players.length; i++) {
			if (players[i].statuses.role === 'defender') {
				return players[i].id;
			}
		}
	}

	/*
	 *
	 * Методы, работающие со столом.
	 *
	 */
	findAttackCardOnTheTable(field) {
		let table = this.game.table;

		for (let i = 0; i < table.length; i++) {
			if (table[i].id === field) {
				return table[i].attack;
			}
		}
	}

	findCardsOnTheTable() {
		/**
		 * Метод, возвращающий все карты на столе.
		 */
		let cards = [],
			table = this.game.table;

		for (let i = 0; i < table.length; i++) {
			if (table[i].attack !== null) {
				cards.push(table[i].attack);
			}

			if (table[i].defense !== null) {
				cards.push(table[i].defense);
			}
		}

		return cards;
	}

	findTableCardsValues() {
		/**
		 * Метод, возвращающий значения всех карт на столе.
		 */
		let cardsValues = [],
			table = this.game.table;

		for (let i = 0; i < table.length; i++) {
			if (table[i].attack !== null) {
				cardsValues.push(table[i].attack.value);
			}

			if (table[i].defense !== null) {
				cardsValues.push(table[i].defense.value);
			}
		}

		return cardsValues;
	}

	findNullDefenseCardsOnTheTable() {
		/**
		 * Метод, возвращающий карты атакующих на столе.
		 */
		let cards = [],
			table = this.game.table;

		for (let i = 0; i < table.length; i++) {
			if ((table[i].attack !== null) && (table[i].defense === null)) {
				cards.push(table[i].attack);
			}
		}

		return cards;
	}

	findDefenseCardsOnTheTable() {
		/**
		 * Метод, возвращающий карты защищающегося на столе.
		 */
		let cards = [],
			table = this.game.table;

		for (let i = 0; i < table.length; i++) {
			if (table[i].defense !== null) {
				cards.push(table[i].defense);
			}
		}

		return cards;
	}

	isBeatableOnlyByThis(cardAction, actions) {
		/*
		 * Метод, возвращающий true, если на столе есть карты, которые бьются только картой из cardAction.
		 */
		let cardsOnTheTable = this.findNullDefenseCardsOnTheTable(),
			beatableCards = [];

		for (let i = 0; i < actions.length; i++) {
			if ((actions[i].field !== cardAction.field) && (!beatableCards.includes(actions[i].field))) {
				beatableCards.push(actions[i].field);
			}
		}

		return (beatableCards.length === cardsOnTheTable.length) ? false : true;
	}

	isNotBeatable(actions) {
		/*
		 * Метод, возвращающий true, если на столе есть карты, которые нельзя побить.
		 */
		let cardsOnTheTable = this.findNullDefenseCardsOnTheTable(),
			beatableCards = [];

		for (let i = 0; i < actions.length; i++) {
			let field = actions[i].field;

			if ((!beatableCards.includes(field)) && (field !== undefined)) {
				beatableCards.push(field);
			}
		}

		console.log('Beatable Cards ', beatableCards);
		console.log('Beatable Cards length', beatableCards.length);
		console.log('Cards On TheTable length', cardsOnTheTable.length);

		return (beatableCards.length === cardsOnTheTable.length) ? false : true;
	}
	/*
	 *
	 * Методы, работающие с рукой бота.
	 *
	 */
	findRareSuit() {
		/**
		 * Метод, определяющий наиболее редкую масть в руке бота (помимо козыря).
		 */
		let cardsInHand = this.game.hands[this.id],
			suits = [0, 0, 0, 0];

		suits[this.game.cards.trumpSuit] = Infinity;

		for (let i = 0; i < cardsInHand.length; i++) {
			if (cardsInHand[i].suit !== this.game.cards.trumpSuit) {
				suits[cardsInHand[i].suit]++;
			}
		}

		return suits.indexOf(Math.min(suits[0], suits[1], suits[2], suits[3]));
	}

	findCommonSuit() {
		/**
		 * Метод, определяющий наиболее частую масть в руке бота (помимо козыря).
		 */
		let cardsInHand = this.game.hands[this.id],
			suits = [0, 0, 0, 0];

		suits[this.game.cards.trumpSuit] = -Infinity;

		for (let i = 0; i < cardsInHand.length; i++) {
			if (cardsInHand[i].suit !== this.game.cards.trumpSuit) {
				suits[cardsInHand[i].suit]++;
			}
		}

		return suits.indexOf(Math.max(suits[0], suits[1], suits[2], suits[3]));
	}

	findTrumpCardsQty() {
		/**
		 * Метод, находящий количество козырей в руке у бота.
		 */
		let cardsInHand = this.game.hands[this.id],
			trumpCardsQty = 0;

		for (let i = 0; i < cardsInHand.length; i++) {
			if (cardsInHand[i].suit === this.game.cards.trumpSuit) {
				trumpCardsQty++;
			}
		}

		return trumpCardsQty;
	}
	/*
	 *
	 * Методы, определяющие полезность чего-либо.
	 *
	 */
	isTransfer(gameStage, transfer, actions) {
		/**
		 * Метод, определяющий эффективность перевода.
		 */
		if ((!transfer) || (this.difficulty === 0)) {
			return false;
		}

		let trumpSuitQty = this.findTrumpCardsQty(),
			isEarlyGame = gameStage === 'EARLY_GAME',
			isTransferTrump = transfer.csuit === this.game.cards.trumpSuit,
			usedField = this.game.table.usedFields,
			transferValue = transfer.cvalue;

		if (isEarlyGame && ((!isTransferTrump) || ((transferValue < 5) && (trumpSuitQty > 1)) ||
				((transferValue < 11) && ((usedField > 1) || this.isBeatableOnlyByThis(transfer, actions))))) {
			return true;
		}
		/**
		 * В конце игры перевод выгоден, если бот не переводит козырем или козырем, меньшем J.
		 */
		if ((!isEarlyGame) && ((!isTransferTrump) || ((transferValue < 11) && ((trumpSuitQty > 0) ||
				this.isBeatableOnlyByThis(transfer, actions))))) {
			return true;
		}

		return false;
	}

	isAttack(minAction) {
		if ((!minAction) || (this.difficulty < 2)) {
			return false;
		}

		let defensePlayerCardsQty = this.game.hands[this.getDefensePlayerID()].length,
			isMinActionTrump = minAction.csuit === this.game.cards.trumpSuit,
			isFollowUp = this.game.turnStages.current === 'FOLLOWUP';

		if ((defensePlayerCardsQty < 3) && (!isFollowUp) &&
			((isMinActionTrump && (minAction.cvalue < 11)) || (!isMinActionTrump))) {
			return true;
		}

		if ((defensePlayerCardsQty < 4) && (!isFollowUp) &&
			((isMinActionTrump && (minAction.cvalue < 6)) || (!isMinActionTrump))) {
			return true;
		}

		if ((defensePlayerCardsQty < 5) && (!isFollowUp) && (!isMinActionTrump)) {
			return true;
		}

		return false;
	}

	isPass(minAction, passAction) {
		if ((!passAction) || this.isAttack(minAction)) {
			return false;
		}

		if ((!minAction) || (minAction.csuit === this.game.cards.trumpSuit) ||
			(this.difficulty > 0) || (minAction.cvalue > 10)) {
			return true;
		}

		return false;
	}

	isTake(gameStage, minAction, actions) {
		if (!minAction) {
			return true;
		}

		let usedFields = this.game.table.usedFields,
			isMinActionTrump = minAction.csuit === this.game.cards.trumpSuit,
			isEndGame = gameStage === 'END_GAME',
			handLength = this.game.hands[this.id].length,
			trumpCardsQty = this.findTrumpCardsQty(),
			minValue = minAction.cvalue;

		if (this.isNotBeatable(actions) || ((!isEndGame) && isMinActionTrump &&
				(trumpCardsQty < 3) && (((usedFields === 1) && (handLength < 7) && (minValue > 7)) || ((usedFields === 2) && (minValue > 10))))) {
			return true;
		}

		return false;
	}

	isMinActionWithTableValue(gameStage, minActionWithTableValue) {
		if ((!minActionWithTableValue) || (this.difficulty === 0)) {
			return false;
		}

		let minAction = minActionWithTableValue,
			isMinActionTrump = minAction.csuit === this.game.cards.trumpSuit,
			isEarlyGame = gameStage === 'EARLY_GAME';

		if ((minAction.value - (this.findAttackCardOnTheTable(minAction.field)).value <= 3) &&
			((isEarlyGame && (!isMinActionTrump)) || (minAction.value < 11) || (!isMinActionTrump))) {
			return true;
		}

		return false;
	}

	isOneOnOne(gameStage) {
		if ((this.difficulty < 2) || (gameStage === 'EARLY_GAME') ||
			this.game.players.length !== 2) {
			return false;
		}

		return true;
	}
}

module.exports = Bot;
