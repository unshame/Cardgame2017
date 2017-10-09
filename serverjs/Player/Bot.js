/*
	Серверные боты
*/

// TODO 1 on 1 mode && cheater difficulty defence
//


'use strict';

const
	generateId = require('../generateId'),
	Log = require('../logger'),
	Player = require('./Player');


class Bot extends Player {
	constructor(randomNames, queueType, decisionTime, difficulty) {
		super(null, null, null, false);
		this.id = 'bot_' + generateId();
		this.log = Log(module, this.id);
		this.type = 'bot';
		this.queueType = queueType;
		this.connected = true;
		this.actionTimeout = null;

		// NOTE difficulties: 0 - Easy, 1 - Medium, 2 - Hard, 3 - Cheater
		if (typeof difficulty !== 'number' || isNaN(difficulty) || difficulty > 3) {
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
		let gameStage = this.defineGameStage();

		if (this.isOneOnOne(gameStage)) {
			return this.chooseOneOnOneAttack(actions);
		}

		let minAction = this.findMinAction(actions),
			opponentsHand = this.game.hands[this.getDefencePlayerID()],
			unbeatableAction = this.findMinUnbeatableAction(actions, opponentsHand),
			untransferableAction = this.findMinUntransferableAction(actions, opponentsHand),
			pass = this.findPassAction(actions),
			maxQtyCard = this.findMaxQtyCard(minAction, actions, gameStage);

		if ((!this.isFirstAttack()) && this.isPass(minAction, pass)) {
			if (pass) {
				return pass;
			} else {
				return null;
			}
		}

		return this.isUnbeatableAction(unbeatableAction, minAction, opponentsHand) ? unbeatableAction :
			maxQtyCard ? this.changeCardIntoAction(actions, maxQtyCard) :
			this.isUntransferableAction(untransferableAction, minAction) ? untransferableAction :
			minAction;
	}

	choooseDefence(actions) {
		let minAction = this.findMinAction(actions),
			tableCardsValues = this.findTableCardsValues(),
			transfer = this.findMinTransfer(actions, undefined, true),
			take = this.findTakeAction(actions),
			gameStage = this.defineGameStage(),
			maxQtyCard = this.findMaxQtyCard(minAction, actions, gameStage),
			minActionWithTableValue = this.findMinTableCardAction(actions, tableCardsValues),
			cardToAction = this.changeCardIntoAction;

		//return this.isOneOnOne ? this.chooseOneOnOneDefence(actions, transfer) :
		return this.isTransfer(gameStage, transfer, actions) ? transfer :
			this.isTake(gameStage, minAction, actions) ? take :
			this.isMinActionWithTableValue(gameStage, minActionWithTableValue) ? minActionWithTableValue :
			maxQtyCard ? cardToAction(actions, maxQtyCard) :
			minAction;
	}

	chooseOneOnOneDefence(actions, minAction, transfer, take) {
		let opponentsHand = this.game.hands[this.getAnotherPlayerID()];

		return minAction;
	}

	chooseOneOnOneAttack(actions) {
		let hand = this.game.hands[this.id],
			minAction = this.findMinAction(actions),
			pass = this.findPassAction(actions),
			opponentsHand = this.game.hands[this.getAnotherPlayerID()],
			unbeatableAction = this.findMinUnbeatableAction(actions, opponentsHand),
			isTransferable = this.isTransferableByOpponent(unbeatableAction, opponentsHand),
			untransferableAction = this.findMinUntransferableAction(actions, opponentsHand);

		if (unbeatableAction && (!isTransferable) && (opponentsHand.length < 4) && (hand.length < 5) &&
			((unbeatableAction.cvalue < 11) || (unbeatableAction.suit !== this.game.cards.trumpSuit) ||
				(opponentsHand.length === 1))) {
			return unbeatableAction;
		}

		if ((!this.isFirstAttack()) && this.isPass(minAction, pass)) {
			if (pass) {
				return pass;
			} else {
				return null;
			}
		}

		return this.isUntransferableAction(untransferableAction, minAction) ? untransferableAction :
			minAction;
	}
	/*
	 *
	 *	Методы нахождения чего-либо в массиве доступных действий
	 *
	 */
	findMinUnbeatableAction(actions, opponentsHand) {
		let minAction = {
			cvalue: Infinity,
			csuit: this.game.cards.trumpSuit
		};

		for (let i = 0; i < actions.length; i++) {
			let isPass = actions[i].type === 'PASS';

			if (isPass) {
				continue;
			}

			if ((!this.isBeatableByOpponent(actions[i], opponentsHand)) &&
				this.isLesserAction(actions[i], minAction)) {
				minAction = actions[i];
			}
		}

		return (minAction.cvalue !== Infinity) ? minAction : undefined;
	}

	findMinUntransferableAction(actions, opponentsHand) {
		let minAction = {
			cvalue: Infinity,
			csuit: this.game.cards.trumpSuit
		};

		for (let i = 0; i < actions.length; i++) {
			let isPass = actions[i].type === 'PASS';

			if (isPass) {
				continue;
			}

			if ((!this.isTransferableByOpponent(actions[i], opponentsHand)) &&
				this.isLesserAction(actions[i], minAction)) {
				minAction = actions[i];
			}
		}

		return (minAction.cvalue !== Infinity) ? minAction : undefined;
	}

	findMinAction(actions, tableCardsValues) {
		/**
		 * Метод, возврающий наименьшую карту из тех, которыми можно проатаковать / защититься.
		 */

		let minAction = {
			cvalue: Infinity,
			csuit: this.game.cards.trumpSuit
		};

		for (let i = 0; i < actions.length; i++) {
			let isPass = actions[i].type === 'PASS',
				isTake = actions[i].type === 'TAKE';

			if (isTake || isPass) {
				continue;
			}

			if (this.isLesserAction(actions[i], minAction)) {
				minAction = actions[i];
			}
		}

		return (minAction.cvalue !== Infinity) ? minAction : undefined;
	}

	findMinTableCardAction(actions, tableCardsValues) {
		let minAction = {
			cvalue: Infinity,
			csuit: this.game.cards.trumpSuit
		};

		for (let i = 0; i < actions.length; i++) {
			let isTransfer = actions[i].type === 'ATTACK',
				isTake = actions[i].type === 'TAKE',
				isOnTheTable = tableCardsValues.includes(actions[i].cvalue);

			if (isTransfer || isTake || (!isOnTheTable)) {
				continue;
			}

			if (this.isLesserAction(actions[i], minAction)) {
				minAction = actions[i];
			}
		}

		return (minAction.cvalue !== Infinity) ? minAction : undefined;
	}

	findMinTransfer(actions) {
		let minAction = {
			cvalue: Infinity,
			csuit: this.game.cards.trumpSuit
		};

		for (let i = 0; i < actions.length; i++) {
			let isDefense = actions[i].type === 'DEFENSE',
				isTake = actions[i].type === 'TAKE';

			if (isDefense || isTake) {
				continue;
			}

			if (this.isLesserAction(actions[i], minAction)) {
				minAction = actions[i];
			}
		}

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

		let cardsByValue = this.getBeneficialCardsByValue(minAction, actions, gameStage),
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

	getBeneficialCardsByValue(minAction, actions, gameStage) {
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
				((cardsInHand[i].value <= (minAction.cvalue + 2)) && (allowedCardsIDs.includes(cardsInHand[i].id)))) {

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

	getDefencePlayerID() {
		let players = this.game.players;

		for (let i = 0; i < players.length; i++) {
			if (players[i].statuses.role === 'defender') {
				return players[i].id;
			}
		}
	}

	getAnotherPlayerID() {
		let players = this.game.players;

		for (let i = 0; i < players.length; i++) {
			if (players[i].id !== this.id) {
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

	findNullDefenceCardsOnTheTable() {
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

	findDefenceCardsOnTheTable() {
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
			let cardSuit = cardsInHand[i].suit;

			if (cardSuit !== this.game.cards.trumpSuit) {
				suits[cardSuit]++;
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
	 * Методы, определяющие что-либо.
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

	isAttack(action) {
		if ((!action) || (this.difficulty < 2)) {
			return false;
		}

		let defensePlayerCardsQty = this.game.hands[this.getDefencePlayerID()].length,
			isActionTrump = action.csuit === this.game.cards.trumpSuit,
			isFollowUp = this.game.turnStages.current === 'FOLLOWUP';

		if (!isFollowUp) {
			switch (defensePlayerCardsQty) {
				case 1:
				case 2:
					if ((isActionTrump && (action.cvalue < 11)) ||
						(!isActionTrump)) {
						return true;
					}

					break;

				case 3:
					if ((isActionTrump && (action.cvalue < 6)) ||
						(!isActionTrump)) {
						return true;
					}

					break;

				case 4:
					if (!isActionTrump) {
						return true;
					}

					break;

				default:
					return false;
			}
		}

		return false;
	}

	isPass(minAction, passAction) {
		if (this.isAttack(minAction)) {
			return false;
		}

		if ((this.difficulty > 0) && ((!minAction) || (minAction.csuit === this.game.cards.trumpSuit) ||
				(minAction.cvalue > 10))) {
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
			(this.game.players.length !== 2)) {
			return false;
		}

		return true;
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

	isBeatableOnlyByThis(cardAction, actions) {
		/*
		 * Метод, возвращающий true, если на столе есть карты, которые бьются только картой из cardAction.
		 */
		let cardsOnTheTable = this.findNullDefenceCardsOnTheTable(),
			beatableCards = [];

		for (let i = 0; i < actions.length; i++) {
			if ((actions[i].field !== cardAction.field) && (!beatableCards.includes(actions[i].field))) {
				beatableCards.push(actions[i].field);
			}
		}

		return beatableCards.length !== cardsOnTheTable.length;
	}

	isNotBeatable(actions) {

		/*
		 * Метод, возвращающий true, если на столе есть карты, которые нельзя побить.
		 */
		let cardsOnTheTable = this.findNullDefenceCardsOnTheTable(),
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

		return beatableCards.length !== cardsOnTheTable.length;
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

	isLesserAction(action, minAction) {
		let isMinActionTrump = minAction.csuit === this.game.cards.trumpSuit,
			isActionTrump = action.csuit === this.game.cards.trumpSuit;


		if (isMinActionTrump && (!isActionTrump)) {
			return true;
		}

		if ((action.cvalue < minAction.cvalue) &&
			(isActionTrump === isMinActionTrump)) {
			return true;
		}

		return false;
	}

	isBeatableByOpponent(action, opponentsHand) {
		if (!action) {
			return false;
		}

		for (let i = 0; i < opponentsHand.length; i++) {
			let isOpponentsCardTrump = opponentsHand[i].suit === this.game.cards.trumpSuit,
				isActionTrump = action.csuit === this.game.cards.trumpSuit;


			if (isOpponentsCardTrump && (!isActionTrump)) {
				return true;
			}

			if ((action.cvalue < opponentsHand[i].value) &&
				(isActionTrump === isOpponentsCardTrump)) {
				return true;
			}
		}

		return false;
	}

	isTransferableByOpponent(action, opponentsHand) {
		if (!action || this.findDefenceCardsOnTheTable()) {
			return false;
		}

		for (let i = 0; i < opponentsHand.length; i++) {
			if (action.cvalue === opponentsHand[i].value) {
				return true;
			}
		}

		return false;
	}

	isUnbeatableAction(unbeatableAction, minAction, opponentsHand) {
		if (!unbeatableAction) {
			return false;
		}

		let isTransferable = this.isTransferableByOpponent(unbeatableAction, opponentsHand);

		if ((unbeatableAction.cvalue <= minAction.cvalue + 3) &&
			(unbeatableAction.csuit === minAction.csuit) &&
			this.isAttack(unbeatableAction) &&
			(this.difficulty === 3) && (!isTransferable)) {
			console.log('UNBEATABLE ACTION: ', true);
			return true;
		}

		return false;
	}

	isUntransferableAction(untransferableAction, minAction) {
		if (!untransferableAction) {
			return false;
		}

		if ((untransferableAction.cvalue <= minAction.cvalue + 2) &&
			(untransferableAction.csuit === minAction.csuit) &&
			this.isAttack(untransferableAction) && (this.difficulty === 3)) {
			console.log('UNTRANSFERABLE ACTION: ', true);
			return true;
		}

		return false;
	}

	isFirstAttack() {
		return this.game.turnStages.current === 'INITIAL_ATTACK';
	}
}

module.exports = Bot;