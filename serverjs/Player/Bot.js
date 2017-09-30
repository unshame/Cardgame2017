/*
	Серверные боты
*/

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

		if (difficulty) {
			this.difficulty = difficulty;
		} else {
			this.difficulty = 'HARD';
		}


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
				this.sendResponseSync(this.chooseBestAction(actions));

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

	chooseBestAction(actions) {
		/**
		 * Метод, возвращающий наиболее выгодное для бота действие.
		 */
		console.log('TABLE', this.game.table);

		let gameStage = this.defineGameStage(),
			minAction = this.findMinAction(actions),
			allowedCardsIDs = this.getAllowedCardsIDs(actions),
			passAction = this.findPassAction(actions),
			takeAction = this.findTakeAction(actions),
			maxQtyCard = this.findMaxQtyCard(minAction, allowedCardsIDs, gameStage),
			isMediumOrHardDifficulty = (this.difficulty === 'MEDIUM') || (this.difficulty === 'HARD'),
			isHardDifficulty = this.difficulty === 'HARD';
		//let trumpCardsQty = this.findTrumpCardsQty(); // NOTE trumpCardsQty не используется

		console.log('Min Action ', minAction);

		if (this.isAttackTurn()) {
			if (passAction && (isMediumOrHardDifficulty && ((!this.isAttackActionBeneficial(minAction, gameStage)) ||
					(this.isPassActionBeneficial(minAction, gameStage))))) {
				return passAction;
			}

			if (isHardDifficulty && maxQtyCard) {
				return this.changeCardIntoAction(actions, maxQtyCard);
			}

			return minAction;
		} else {
			let cardsOnTheTableValues = this.findCardsOnTheTableValues(),
				minActionWithValueOnTheTable = this.findMinAction(actions, cardsOnTheTableValues),
				bestTransferAction = this.findMinAction(actions, undefined, true);

			console.log('minActionWithValueOnTheTable: ', minActionWithValueOnTheTable);

			if (bestTransferAction && isMediumOrHardDifficulty && this.isTransferBeneficial(gameStage, bestTransferAction, actions)) {
				return bestTransferAction;
			}

			if ((!minAction) || this.isTakeActionBeneficial(gameStage, minAction, actions)) {
				return takeAction;
			}

			if (minActionWithValueOnTheTable && isMediumOrHardDifficulty && this.isMinActionWithValueOnTheTableBeneficial(gameStage, minActionWithValueOnTheTable)) {
				return minActionWithValueOnTheTable;
			}

			if (maxQtyCard && isHardDifficulty) {
				return this.changeCardIntoAction(actions, maxQtyCard);
			}

			return minAction;
		}
	}

	findMinAction(actions, cardsOnTheTableValues, isTransfer) {
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
					(cardsOnTheTableValues && ((!isDefense) || (!cardsOnTheTableValues.includes(actions[i].cvalue)))))) {
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

	// TODO Придумать как сократить код findMaxQtyCard
	findMaxQtyCard(minAction, allowedCardsIDs, gameStage) {
		/*
		 * Метод, находящий id пары или тройки карт одного типа, которые не являются козырными и меньше J.
		 * При этом разница между этой парой(тройкой) и минимальной картой, которой можно походить, не
		 * должна быть больше 2.
		 * В итоге выводится одно из этих действий. В приоритете выбор с самой частой мастью. Или мастью не равной самой редкой.
		 */
		if (!minAction) {
			return undefined;
		}

		let cardsInHand = this.game.hands[this.id],
			cardsByValue = {},
			isEndGame = gameStage === 'END_GAME',
			trumpSuit = this.game.cards.trumpSuit;

		function isTrump(card) {
			return card.suit === trumpSuit;
		}
		/*
		 * Заполяем объект cardsByValue
		 */
		for (let i = 0; i < cardsInHand.length; i++) {
			if ((!isTrump(cardsInHand[i])) && (isEndGame || (cardsInHand[i].value < 11)) &&
				(cardsInHand[i].value <= (minAction.cvalue + 2) && (allowedCardsIDs.includes(cardsInHand[i].id)))) {
				if (!cardsByValue[cardsInHand[i].value]) {
					cardsByValue[cardsInHand[i].value] = [];
				}

				cardsByValue[cardsInHand[i].value].push(cardsInHand[i]);
			}
		}

		let maxQtyCards = [];

		console.log('CARDS BY VALUE: ');
		console.log(cardsByValue);

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

		return valueQty ? true: false;
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

	findCardsOnTheTableValues() {
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
	isTransferBeneficial(gameStage, transferAction, actions) {
		/**
		 * Метод, определяющий эффективность перевода.
		 *
		 * В начале игры перевод выгоден, если бот не переводит козырем или козырем, меньшем 5.
		 */
		let trumpSuitQty = this.findTrumpCardsQty(),
			isEarlyGame = gameStage === 'EARLY_GAME',
			isTransferActionTrump = transferAction.csuit === this.game.cards.trumpSuit,
			usedField = this.game.table.usedFields,
			transferActionValue = transferAction.cvalue;

		if (isEarlyGame && ((!isTransferActionTrump) || ((transferActionValue < 5) && (trumpSuitQty > 1)) ||
				((transferActionValue < 11) && ((usedField > 1) || this.isBeatableOnlyByThis(transferAction, actions))))) {
			return true;
		}
		/**
		 * В конце игры перевод выгоден, если бот не переводит козырем или козырем, меньшем J.
		 */
		if (isEarlyGame && ((!isTransferActionTrump) || ((transferActionValue < 11) && ((trumpSuitQty > 0) ||
				this.isBeatableOnlyByThis(transferAction, actions))))) {
			return true;
		}

		return false;
	}

	// NOTE Game Stage не используется
	isAttackActionBeneficial(minAction, gameStage) {
		if (!minAction) {
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

	// NOTE Game Stage не используется
	isPassActionBeneficial(minAction, gameStage) {
		return (!minAction) ||  minAction.csuit === this.game.cards.trumpSuit || (minAction.cvalue > 10);
	}

	isTakeActionBeneficial(gameStage, minAction, actions) {
		let usedFields = this.game.table.usedFields,
			isMinActionTrump = minAction.csuit === this.game.cards.trumpSuit,
			isEndGame = gameStage === 'END_GAME',
			handLength = this.game.hands[this.id].length;

		if (this.isNotBeatable(actions) || ((!isEndGame) && isMinActionTrump &&
				(((usedFields === 1) && (handLength < 7)) ||
					((usedFields === 2) && (minAction.cvalue > 10))))) {
			return true;
		}

		return false;
	}

	isMinActionWithValueOnTheTableBeneficial(gameStage, minActionWithValueOnTheTable) {
		let minAction = minActionWithValueOnTheTable,
			isMinActionTrump = minAction.csuit === this.game.cards.trumpSuit,
			isEarlyGame = gameStage === 'EARLY_GAME';

		if ((minAction.value - (this.findAttackCardOnTheTable(minAction.field)).value <= 3) &&
			((isEarlyGame && (!isMinActionTrump)) || (minAction.value < 11) || (!isMinActionTrump))) {
			return true;
		}

		return false;
	}
}

module.exports = Bot;
