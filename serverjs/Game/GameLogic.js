/*
 * Конструктор игры
 * Раздает карты и управляет правилами игры
 *
 * Отправляет информацию игрокам через экземпляры игроков (Player) и группу игроков (GamePlayers)
 * После каждого отправления ожидает ответа от игроков (waitForResponse)
 * После ответа игроков (recieveResponse) или по истечении времени (setResponseTimer)
 * автоматически продолжает игру (continueGame)
 */

'use strict';

const 
	utils = require('../utils'),
	Bot = require('../Players/Bot'),
	GameCards = require('./GameCards'),
	GamePlayers = require('./GamePlayers');

var Game = function(players, canTransfer){

	if(!players || !players.length){
		utils.log('ERROR: Can\'t start a game without players');
	}

	//Генерируем айди игры
	this.id = 'game_' + utils.generateId();

	//Сохраняем ссылки на игроков локально
	if(players.length < 2){
		players.push(new Bot(['addedBot']));
		utils.log('WARNING: Only one player at the start of the game, adding a bot');
	}
	this.players = new GamePlayers(this, players.slice());

	//Сообщаем игрокам о соперниках
	this.players.opponentsNotify();

	//Карты
	this.cards = new GameCards(this);

	//Колода
	this.deck = this.cards.deck;

	//Сброс 
	this.discardPile = this.cards.discardPile;

	//Карты на столе (в игре)
	this.field = this.cards.field;

	//Руки
	this.hands = this.cards.hands;

	//Можно ли переводить карты
	this.canTransfer = canTransfer;

	this.gameNumber = -1;

	//Время ожидания сервера
	this.timeouts = {
		gameStart: 20,
		gameEnd: 20,
		trumpCards: 20,
		deal: 20,
		discard: 20,
		take: 20,
		actionComplete: 20,
		actionAttack: 15,
		actionDefend: 15
	}

	//Запускаем игру
	this.reset();
	this.gameState = 'SHOULD_START';
	this.make();
}

//Ресет игры
Game.prototype.reset = function(){

	//Свойства игры
	this.gameNumber++;
	this.gameState = 'NOT_STARTED';
	this.gameResult = {
		winners: [],
		loser: null
	}

	//Ресет карт
	this.cards.reset();

	//Счетчик пропущенных ходов
	this.skipCounter = 0;

	//Возможные действия игроков
	this.validActions = [];
	this.storedActions = [];

	//Свойства хода
	this.turnNumber = 1;
	this.nextTurnStage = null;
	this.turnStage = null;
}

//Подготовка к игре
Game.prototype.make = function(){

	utils.log('Game started', this.id, this.gameNumber)

	//Перемешиваем игроков
	this.players.shuffle();

	//Задаем количество карт и минимальное значение карты
	if(this.players.length > 3){
		this.lowestCardValue = 2;
		this.numOfCards = 52
	}
	else{
		this.lowestCardValue = 6;
		this.numOfCards = 36;
	}

	//Задаем значения карт
	for (let i = this.lowestCardValue; i <= this.maxCardValue; i++) {
		this.cardValues.push(i);
	}

	//Создаем колоду
	for(let vi = 0; vi < this.cardValues.length; vi++){

		for(let si = 0; si < this.numOfSuits; si++){
			let id = 'card_' + utils.generateId();
			let card = {
				id: id,
				value: this.cardValues[vi],
				suit: si,
				spot: 'DECK'
			}
			this.cards[id] = card;
			this.deck.push(card.id);
		}		
	}

	this.deck.shuffle();

	//Находим первый попавшийся не туз и кладем его на дно колоды, это наш козырь
	for(let ci = 0; ci < this.deck.length; ci++){

		let thiscid = this.deck[ci];
		let othercid = this.deck[this.deck.length - 1];

		if(this.cards[thiscid].value != this.maxCardValue){
			this.deck[this.deck.length - 1] = thiscid;
			this.deck[ci] = othercid;
			break;
		}
	}	

	//Запоминаем козырь
	let lastcid = this.deck[this.deck.length - 1];
	this.cards[lastcid].spot = 'BOTTOM';
	this.trumpSuit = this.cards[lastcid].suit;

	//Сообщаем игрокам о колоде и друг друге и запускаем игру
	this.waitForResponse(this.timeouts.gameStart, this.players);
	this.players.gameStateNotify(
		this.players,
		{
			cards: true,
			players: true,
			suit: false,
			discard: false
		}
	);
	// --> continueGame()
}

//Сбрасываем счетчики и стадию игры
Game.prototype.resetTurn = function(){

	utils.log('Turn Ended');
	
	this.fieldUsedSpots = 0;
	this.skipCounter = 0;
	this.turnStage = null;
	this.nextTurnStage = null;	
	this.playerTaken = false;

	this.players.resetTurn();
}

//Начинает ход
Game.prototype.startTurn = function(){
	utils.log(
		'\nTurn',
		this.turnNumber,
		this.players.attacker.name,
		this.players.defender.name,
		this.players.ally ? this.players.ally.name : null,
		'\nCards in deck:', this.deck.length
	);
	utils.stats.line += 2;
	
	for(let pi = 0; pi < this.players.length; pi++){
		let p = this.players[pi];
		let pid = p.id;
		utils.log(p.name, this.hands[pid].length);
	}

	//Увеличиваем счетчик ходов, меняем стадию игры на первую атаку и продолжаем ход
	this.turnNumber++;	

	this.setNextTurnStage('INITIAL_ATTACK');	
	this.continueGame();
}

//Заканчивает игру, оповещает игроков и позволяет им голосовать за рематч
Game.prototype.endGame = function(){

	utils.log('Game ended', this.id, '\n\n');
	utils.stats.line += 2;
	
	let note = {
		message: 'GAME_ENDED',
		scores: this.players.scores,
		results: utils.copyObject(this.gameResult)				 
	};
	let actionAccept = {
		type: 'ACCEPT'
	}
	let actionDecline = {
		type: 'DECLINE'
	}

	this.players.resetGame();
	this.reset();
	
	this.validActions.push(actionAccept);
	this.validActions.push(actionDecline);

	this.waitForResponse(this.timeouts.gameEnd, this.players);
	this.players.notify(note, this.validActions.slice());
}

//Перезапускает игру 
Game.prototype.rematchGame = function(voteResults){
	utils.log('Rematch');

	//Оповещаем игроков о результате голосования
	
	this.players.notify(voteResults);

	this.validActions = [];
	this.storedActions = [];
	this.gameState = 'SHOULD_START';

	this.make();
}

//Возвращает игру в лобби
Game.prototype.backToLobby = function(voteResults){
	//Оповещаем игроков о результате голосования
	this.players.notify(voteResults);

	utils.log('No rematch');

	//TODO: оповестить лобби
}


//Методы выбора статуса игры и стадии хода

//Устанавливает следующую фазу хода и запоминает текущую
//INITIAL_ATTACK -> DEFENSE -> REPEATING_ATTACK -> DEFENSE -> REPEATING_ATTACK -> DEFENSE -> ... ->
//SUPPORT -> DEFENSE -> ATTACK -> DEFENSE -> ... -> FOLLOWUP -> DEFENSE -> END -> END_DEAL -> ENDED
Game.prototype.setNextTurnStage = function(stage){
	this.turnStage = this.nextTurnStage;
	this.nextTurnStage = stage;
}

//Выбирает следующую стадию игры
Game.prototype.continueGame = function(){

	/*this.players.notify({
		gameState: this.gameState,
		nextTurnStage: this.nextTurnStage
	})*/

	switch(this.gameState){

	//Проверяем, нужно ли перезапускать игру
	case 'NOT_STARTED':
		//Проверяем результаты голосования
		let voteResults = this.checkStoredActions();

		//Если голосов хватает, запускаем игру
		if(voteResults.successful)
			this.rematchGame(voteResults)

		//Иначе, не запускаем игру
		else
			this.backToLobby(voteResults);	

		break;

	//Раздаем карты в начале игры
	case 'SHOULD_START':
		this.gameState = 'STARTED';
		this.dealStartingHands();
		break;

	//Находим игрока, делающего первый ход в игре или продолжаем ход
	case 'STARTED':
		if(!this.players.attacker){

			let [minTCards, minTCard] = this.players.findToGoFirst();	

			//Сообщаем игрокам о минимальных козырях
			if(minTCardPid){				
				this.waitForResponse(this.timeouts.trumpCards, this.players);
				this.players.minTrumpCardsNotify(minTCards, minTCard.pid);
			}

			//Иначе продолжаем игру
			else{
				this.continueGame();
			}
		}
		else{
			this.doTurn();	
		}
		break;

	default:
		utils.log('ERROR: Invalid game state', this.gameState);
		break;
	}
}

//Выбирает следующую стадию хода
Game.prototype.doTurn = function(){

	//Стадии хода
	switch(this.nextTurnStage){

	//Начинаем ход
	case null:
		this.startTurn();
		//Turn stage: INITIAL_ATTACK
		break;

	//Первая атака
	case 'INITIAL_ATTACK': 
		this.letAttack(this.players.attacker);
		//Turn stage: DEFENSE
		break;

	//Атакующий игрок атакует повторно
	case 'REPEATING_ATTACK':
		this.letAttack(this.players.attacker);
		//Turn stage: DEFENSE
		break;

	//Атакующий игрок атакует после помогающего игрока
	case 'ATTACK':
		this.letAttack(this.players.attacker);
		//Turn stage: DEFENSE
		break;

	//Помогающий игрок атакует
	case 'SUPPORT':

		//Debug
		if(!this.players.ally)
			utils.log('ERROR: No ally assigned, but turn stage is SUPPORT');

		this.letAttack(this.players.ally || this.players.attacker);
		//Turn stage: DEFENSE
		break;

	//Подкладывание карт в догонку
	case 'FOLLOWUP':
		this.letAttack(!this.skipCounter ? this.players.attacker : (this.players.ally || this.players.attacker));
		//Turn stage: DEFENSE
		break;

	//Защищающийся игрок ходит
	case 'DEFENSE':

		//Если мы были в стадии подкидывания в догонку, передаем все карты со стола
		//защищающемуся и сообщаем всем игрокам об этом
		if(this.turnStage == 'FOLLOWUP')
			this.letTake(this.players.defender);
		//Иначе даем защищаться
		else
			this.letDefend(this.players.defender);
		//Turn stage: REPEATING_ATTACK, ATTACK, SUPPORT, END
		break;

	//Начало конца хода, убираем карты со стола
	case 'END':
		this.setNextTurnStage('END_DEAL');
		this.discard();
		break;

	//Раздаем карты после окончания хода
	case 'END_DEAL':
		this.setNextTurnStage('ENDED');
		this.dealTillFullHand();
		break;

	//Конец конца хода
	//находим следующего игрока, ресетим ход и проверяем, закончилась ли игра
	case 'ENDED':

		//Если защищающийся брал, сдвигаем айди, по которому будет искаться атакующий
		if(this.playerTaken)
			this.players.attacker = this.players.defender;

		let currentAttackerIndex = this.players.findInactive();
		this.resetTurn();
		//Turn stage: null

		if(!game.deck.length && this.players.notEnoughActive()){
			this.endGame();
			return
		}

		this.players.findToGoNext(currentAttackerIndex);
		this.continueGame();
		break;

	//Debug
	default:
		utils.log('ERROR: Invalid turn stage', this.nextTurnStage);
		break;
	}
}



//MOVE
//Раздает карты
Game.prototype.deal = function(dealsIn){

	let dealsOut = [];

	for (let di = 0; di < dealsIn.length; di++) {

		let dealInfo = dealsIn[di];
		let numOfCards = dealInfo.numOfCards;
		while (numOfCards--) {
			if(!this.deck.length)
				break;

			let card = this.cards[this.deck[0]];

			//utils.log(card.id, ':', 'DEAL', card.spot, '=>', dealInfo.pid);
			this.logAction(card, 'DEAL', card.spot, dealInfo.pid);

			this.hands[dealInfo.pid].push(card.id);
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
	if(dealsOut.length){
		this.waitForResponse(this.timeouts.deal, this.players);
		this.players.dealNotify(dealsOut);
	}
	else{
		this.continueGame();
	}
}

//MOVE
//Раздает карты пока у всех не по 6 карт или пока колода не закончится
Game.prototype.dealTillFullHand = function(){
	let deals = [];
	let origAttackers = this.players.origAttackers;

	let sequence = [];
	for(let oi = 0; oi < origAttackers.length; oi++){
		let p = origAttackers[oi];
		if(!~sequence.indexOf(p))
			sequence.push(p);
	}
	if(!~sequence.indexOf(this.players.attacker))
		sequence.push(this.players.attacker);

	if(this.players.ally && !~sequence.indexOf(this.players.ally))
		sequence.push(this.players.ally);

	if(!~sequence.indexOf(this.players.defender))
		sequence.push(this.players.defender);

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
		this.deal(deals);
	}
	else{
		this.continueGame();
	}
}

//MOVE
//Раздает начальные руки
Game.prototype.dealStartingHands = function(){
	for (let pi = 0; pi < this.players.length; pi++) {
		this.hands[this.players[pi].id] = [];
	}
	let deals = [];

	for (let cardN = 0; cardN < this.normalHandSize; cardN++) {
		for(let pi = 0; pi < this.players.length; pi++){
			let dealInfo = {
				pid: this.players[pi].id,
				numOfCards: 1
			}
			deals.push(dealInfo);
		}
	}
	this.deal(deals);
}

//MOVE
//Сбрасывает карты и оповещает игроков
Game.prototype.discard = function(){

	let action = {
		type: 'DISCARD',
		ids: []
	};

	//Убираем карты со всех позиций на столе
	for(let fi = 0; fi < this.field.length; fi++){

		let fieldSpot = this.field[fi];

		if(fieldSpot.attack){
			let card = this.cards[fieldSpot.attack];
			this.logAction(card, 'DISCARD', card.spot, 'DISCARD_PILE');
			card.spot = 'DISCARD_PILE';

			action.ids.push(fieldSpot.attack);
			this.discardPile.push(fieldSpot.attack);
			fieldSpot.attack = null;
		}

		if(fieldSpot.defense){
			let card = this.cards[fieldSpot.defense];
			this.logAction(card, 'DISCARD', card.spot, 'DISCARD_PILE');
			card.spot = 'DISCARD_PILE';

			action.ids.push(fieldSpot.defense);
			this.discardPile.push(fieldSpot.defense);
			fieldSpot.defense = null;
		}

	}

	//Если карты были убраны, оповещаем игроков и переходим в фазу раздачи карт игрокам
	if(action.ids.length){

		//После первого сброса на стол можно класть больше карт
		if(this.fullField <= this.zeroDiscardFieldSize){
			this.fullField++;
			utils.log('First discard, field expanded to', this.fullField);
		}

		this.waitForResponse(this.timeouts.discard, this.players);
		this.players.completeActionNotify(action);
	}

	//Иначе раздаем карты и переходим в фазу конца хода
	else{
		this.continueGame();
	}
}


//Методы передачи и обработки действий, установки таймера действий

//Ждет ответа от игроков
Game.prototype.waitForResponse = function(time, players){

	this.players.working = players;
	this.setResponseTimer(time)
}

//Таймер ожидания ответа игроков 
Game.prototype.setResponseTimer = function(time){

	if(this.timer)
		clearTimeout(this.timer);
	
	this.timer = setTimeout(() => {

		let playersWorking = this.players.working;
		let names = '';
		for(let pi = 0; pi < playersWorking.length; pi++){
			let name = playersWorking[pi].name;
			names += name + ' ';
		}
		utils.log('Players timed out: ', names);


		//Если есть действия, выполняем первое попавшееся действие
		if(this.validActions.length && this.gameState == 'STARTED'){
			let actionIndex = 0;
			for(let ai = 0; ai < this.validActions.length; ai++){
				let action = this.validActions[ai];
				if(action.type == 'SKIP' || action.type == 'TAKE'){
					actionIndex = ai;
					break
				}
			}

			//У нас поддерживается только одно действие от одного игрока за раз
			let player = playersWorking[0];	

			let outgoingAction = this.processAction(player, this.validActions[actionIndex]);

			//Убираем игрока из списка действующих
			this.players.working = [];

			this.waitForResponse(this.timeouts.actionComplete, this.players);
			//Отправляем оповещение о том, что время хода вышло
			player.handleLateness();
			this.players.completeActionNotify(outgoingAction);
		}

		//Иначе, обнуляем действующих игроков, возможные действия и продолжаем ход
		else{
			this.players.working = [];
			this.validActions = [];
			this.continueGame();
		}		

	}, time * 1000) //TODO: заменить на 1000 в финальной версии
}

//Получает ответ от игрока
Game.prototype.recieveResponse = function(player, action){

	//Проверяем валидность ответа
	let playersWorking = this.players.working;
	let pi = playersWorking.indexOf(player);
	if(!~pi){
		utils.log('ERROR:', player.name, 'Late or uncalled response');
		return
	}
	if(this.validActions.length && !action){
		utils.log('ERROR: Wating for action but no action recieved')
		return;
	}

	//utils.log('Response from', player.id, action ? action : '');

	//Выполняем или сохраняем действие
	if(action){
		let outgoingAction;

		//Во время игры один игрок действует за раз
		if(this.gameState == 'STARTED'){

			outgoingAction = this.processAction(player, action);

			//Если действие легально
			if(outgoingAction){

				//Убираем игрока из списка действующих (он там один)
				this.players.working = [];
				
				//Сообщаем игрокам о действии
				this.waitForResponse(this.timeouts.actionComplete, this.players);
				this.players.completeActionNotify(outgoingAction);
				
			}

			//Сообщаем игроку, что действие нелегально
			else{
				this.players.notify(
					{
						message: 'INVALID_ACTION',
						action: action
					},
					[player]
				)
			}
			return;			
		}

		//Если игра закончена, действовать могут все
		else
			this.storeAction(player, action);
	}

	//Убираем игрока из списка действующих
	playersWorking.splice(pi, 1);	
	this.players.working = playersWorking;

	//Если больше нет действующих игроков, перестаем ждать ответа и продолжаем ход
	if(!playersWorking.length){
		clearTimeout(this.timer);
		this.continueGame();
	}
}

//Обрабатывает полученное от игрока действие, возвращает исходящее действие
Game.prototype.processAction = function(player, incomingAction){

	let activePlayers = this.players.active;

	let action;
	for(let ai = 0; ai < this.validActions.length; ai++){
		let validAction = this.validActions[ai];
		if(
			incomingAction.type == validAction.type &&
			(!validAction.cid || incomingAction.cid == validAction.cid) &&
			(!validAction.spot || incomingAction.spot == validAction.spot)
		){
			action = validAction;
			break;
		}
	}
	let ai = this.validActions.indexOf(action);

	//Проверка действия
	if( !~ai ){
		utils.log('ERROR: Invalid action', player.id, incomingAction && incomingAction.type, incomingAction, this.validActions);
		return null;
	}

	let ci, card;
	switch(action.type){	

	//Игрок походил
	case 'ATTACK':

		let str;
		if(this.turnStage == 'FOLLOWUP')
			str = 'follows up'
		else if(this.turnStage == 'DEFENSE')
			str = 'transfers'
		else
			str = 'attacks';

		utils.log(player.name,  str)

		ci = this.hands[player.id].indexOf(action.cid);
		card = this.cards[action.cid];

		this.logAction(card, action.type, card.spot, action.spot );

		//Перемещаем карту на стол и убираем карту из руки
		card.spot = action.spot;
		this.hands[player.id].splice(ci, 1);
		this.fieldSpots[action.spot].attack = action.cid;

		//Добавляем информацию о карте в действие
		action.value = card.value;
		action.suit = card.suit;

		//Увеличиваем кол-во занятых мест на столе
		this.fieldUsedSpots++;

		//Если игрок клал карту в догонку, даем ему воможность положить еще карту
		if(this.turnStage == 'FOLLOWUP'){
			this.setNextTurnStage('FOLLOWUP');
		}
		else if(this.turnStage == 'DEFENSE'){
			this.players.setOrigAttackers([this.players.attacker]);
				let currentAttackerIndex = activePlayers.indexOf(this.players.attacker);
				this.players.findToGoNext(currentAttackerIndex);
				this.setNextTurnStage('DEFENSE');	
		}
		else{
			this.skipCounter = 0;//Если же это просто ход, сбрасываем счетчик пропущенных ходов
		}

		break;

	//Игрок отбивается
	case 'DEFENSE':

		utils.log(player.name, 'defends')

		ci = this.hands[player.id].indexOf(action.cid);
		card = this.cards[action.cid];

		this.logAction(card, action.type, card.spot, action.spot );

		//Перемещаем карту на стол и убираем карту из руки
		card.spot = action.spot;
		this.hands[player.id].splice(ci, 1);
		this.fieldSpots[action.spot].defense = action.cid;

		//Добавляем информацию о карте в действие
		action.value = card.value;
		action.suit = card.suit;

		for(let di = 0; di < this.field.length; di++){
			let fieldSpot = this.field[di];
			if(fieldSpot.attack && !fieldSpot.defense){
				this.setNextTurnStage('DEFENSE');
				break;
			}
		}

		break;

	//Ходящий игрок пропустил ход
	case 'SKIP':

		utils.log(player.name, 'skips turn');

		//Debug
		if(activePlayers.length > 2 && !this.players.ally){
			utils.log('ERROR: More than 2 players but no ally assigned')
		}

		//Если есть помогающий игрок
		if(this.players.ally){
			switch(this.turnStage){

				//Если игра в режиме докладывания карт в догонку и только ходящий игрок походил,
				//даем возможность другому игроку доложить карты
				case 'FOLLOWUP':
					if(!this.skipCounter){
						this.skipCounter++;
						this.setNextTurnStage('FOLLOWUP');
					}
					break;

				//Атакующий не доложил карту, переходим к помогающему
				case 'REPEATING_ATTACK':
					this.skipCounter++;
					this.setNextTurnStage('SUPPORT');
					break;

				default:
					//Если кто-то из игроков еще не походил, даем ему возможность 
					this.skipCounter++;
					if(this.skipCounter < 2){

						if(this.turnStage == 'SUPPORT')
							this.setNextTurnStage('ATTACK')

						else if(this.turnStage == 'ATTACK')
							this.setNextTurnStage('SUPPORT')

						//Debug
						else
							utils.log('ERROR: Invalid action', action.type);

					}
					break;
			}
		}
		break;

	//Защищающийся берет карты
	case 'TAKE':
		utils.log(player.name, "takes")
		this.skipCounter = 0;
		this.setNextTurnStage('FOLLOWUP');
		break;

	default:
		utils.log('ERROR: Unknown action', action.type)
		break;
	}

	//Обнуляем возможные действия
	this.validActions = [];

	action.pid = player.id;

	return action;
}

//Сохраняет полученное действие игрока
Game.prototype.storeAction = function(player, action){

	let ai = this.validActions.indexOf(action);

	//Проверка действия
	if( !~ai ){
		utils.log('ERROR: Invalid action', player.id, action.type, action);
		return;
	}

	this.storedActions[player.id] = utils.copyObject(action);
}

//Считает сохраненные голоса и возвращает результаты
Game.prototype.checkStoredActions = function(){

	//Считаем голоса
	let numAccepted = 0;

	//TODO: заменить на this.players.length в финальной версии
	let minAcceptedNeeded = Math.ceil(this.players.length / 2); 
	
	for(let pi = 0; pi < this.players.length; pi++){

		let pid = this.players[pi].id;
		let action = this.storedActions[pid];

		if(action && action.type == 'ACCEPT')
			numAccepted++;
	}

	utils.log(numAccepted, 'out of', this.players.length, 'voted for rematch')

	let note = {
		message: 'VOTE_RESULTS',
		results: utils.copyObject(this.storedActions)
	}

	if(numAccepted >= minAcceptedNeeded)
		note.successful = true
	else
		note.successful = false;

	return note
}


//Методы, позволяющие игрокам выполнить действия
//Во время их выполнения происходит переход между стадиями хода

//Отправляет атакующему возможные ходы
Game.prototype.letAttack = function(player){

	//В данный момент происходит переход между стадиями хода
	//Откомментировать по необходимости
	let turnStage = this.nextTurnStage;
	//let lastTurnStage = this.turnStage;
	
	let pid = player.id;
	let hand = this.hands[pid];
	let defHand = this.hands[this.players.defender.id];

	if(
		this.fieldUsedSpots >= this.fullField || 
		!hand.length ||
		turnStage != 'FOLLOWUP' && !defHand.length
	){
		utils.log(
			this.fieldUsedSpots >= this.fullField && 'Field is full' ||
			!this.hands[pid].length && 'Attacker has no cards' ||
			turnStage != 'FOLLOWUP' && !defHand.length && 'Defender has no cards'
		);
		this.setNextTurnStage('DEFENSE');
		this.continueGame();
		return;
	}

	let actions = [];	

	//Находим значения карт, которые можно подбрасывать
	let validValues = [];
	for(let fi = 0; fi < this.field.length; fi++){
		let fieldSpot = this.field[fi];
		if(fieldSpot.attack){
			let card = this.cards[fieldSpot.attack];
			validValues.push(card.value)
		}
		if(fieldSpot.defense){
			let card = this.cards[fieldSpot.defense];
			validValues.push(card.value)
		}
	}
	if(!validValues.length)
		validValues = null;

	//Выбираем первую незаполненную позицию на столе
	let spot = 'FIELD' + this.fieldUsedSpots;

	//Выбираем подходящие карты из руки атакующего и собираем из них возможные действия
	for(let ci = 0; ci < hand.length; ci++){
		let cid = hand[ci];
		let card = this.cards[cid];
		if(!validValues || ~validValues.indexOf(card.value)){			
			let action = {
				type: 'ATTACK',
				cid: cid,
				spot: spot
			}
			actions.push(action);
		}
	}

	//Добавляем возможность пропустить ход, если это не атака в начале хода
	if(turnStage != 'INITIAL_ATTACK'){
		let action = {
			type: 'SKIP'
		}
		actions.push(action)		
	}
	
	//Меняем стадию на стадию защиты
	this.setNextTurnStage('DEFENSE');

	this.validActions = actions;
	this.waitForResponse(this.timeouts.actionAttack, [player])
	try{
		player.recieveValidActions(actions.slice(), this.timeouts.actionAttack);	
	}
	catch(e){
		console.log(e);
		utils.log('ERROR: Couldn\'t send possible actions to', player);
	}
	return
}

//Отправляет защищающемуся возможные ходы
Game.prototype.letDefend = function(player){

	//В данный момент происходит переход между стадиями хода
	//Откомментировать по необходимости
	//let turnStage = this.nextTurnStage;
	let lastTurnStage = this.turnStage;

	let pid = player.id;

	let defenseSpots = [];

	//Находим карту, которую нужно отбивать
	for(let fi = 0; fi < this.field.length; fi++){
		let fieldSpot = this.field[fi];

		if(fieldSpot.attack && !fieldSpot.defense){
			defenseSpots.push(fieldSpot);
		} 

	}

	//Если ни одной карты не найдено, значит игрок успешно отбился, можно завершать ход
	if(!defenseSpots.length){
		utils.log(player.name, 'successfully defended');

		this.setNextTurnStage('END');
		this.continueGame();
		return
	}

	//Узнаем, можно ли переводить
	let canTransfer = this.canTransfer && this.hands[this.players.ally && this.players.ally.id || this.players.attacker.id].length > this.fieldUsedSpots;
	let attackSpot = this.field[this.fieldUsedSpots];
	if(canTransfer){
		for(let fi = 0; fi < this.field.length; fi++){
			let fieldSpot = this.field[fi];
			if(fieldSpot.defense){
				canTransfer = false;
				break;
			}
		}
	}

	let actions = [];
	let hand = this.hands[pid];
	

	//Создаем список возможных действий защищающегося
	for(let di = 0; di < defenseSpots.length; di++){
		let spot = defenseSpots[di].id;
		for(let ci = 0; ci < hand.length; ci++){
			let cid = hand[ci];
			let card = this.cards[cid];
			let otherCard = this.cards[defenseSpots[di].attack];

			//Карты той же масти и большего значения, либо козыри, если битая карта не козырь,
			//иначе - козырь большего значения
			if(
				card.suit == this.trumpSuit && otherCard.suit != this.trumpSuit ||
				card.suit == otherCard.suit && card.value > otherCard.value
			){			
				let action = {
					type: 'DEFENSE',
					cid: cid,
					spot: spot
				}
				actions.push(action);
			}

			//Возожность перевода
			if(canTransfer && attackSpot && card.value == otherCard.value){
				let action = {
					type: 'ATTACK',
					cid: cid,
					spot: attackSpot.id
				}
				actions.push(action);
			}
		}
	}

	//Добавляем возможность взять карты
	let action = {
		type: 'TAKE'
	}
	actions.push(action)

	this.validActions = actions;

	//Выставляем новую стадию хода в зависимости от предыдущей
	switch(lastTurnStage){

	case 'INITIAL_ATTACK':
		this.setNextTurnStage('REPEATING_ATTACK');
		break;

	case 'REPEATING_ATTACK':
		this.setNextTurnStage('REPEATING_ATTACK');
		break;

	case 'SUPPORT':
		this.setNextTurnStage('ATTACK');
		break;

	case 'ATTACK':
		this.setNextTurnStage('SUPPORT');
		break;		

	//Debug
	default:
		utils.log('ERROR: Invalid turnStage', lastTurnStage);
		break;
	}

	this.waitForResponse(this.timeouts.actionDefend, [player]);
	try{
		player.recieveValidActions(actions.slice(), this.timeouts.actionDefend);	
	}
	catch(e){
		console.log(e);
		utils.log('ERROR: Couldn\'t send possible actions to', player);
	}
	return;
}

//Игрок берет карты со стола
Game.prototype.letTake = function(player){

	//В данный момент происходит переход между стадиями хода
	//Откомментировать по необходимости
	//let turnStage = this.nextTurnStage;
	//let lastTurnStage = this.turnStage;

	let pid = player.id;

	let action = {
		type: 'TAKE',
		cards:[]
	}
	for(let fi = 0; fi < this.field.length; fi++){
		let fieldSpot = this.field[fi];

		if(fieldSpot.attack){

			let card = this.cards[fieldSpot.attack];
			this.logAction(card, action.type, card.spot, pid);
			card.spot = pid;

			this.hands[pid].push(fieldSpot.attack);
			fieldSpot.attack = null;

			let cardToSend = {
				cid: card.id,
				suit: card.suit,
				value: card.value
			};

			action.cards.push(cardToSend);
		}

		if(fieldSpot.defense){

			let card = this.cards[fieldSpot.defense];
			this.logAction(card, action.type, card.spot, pid);
			card.spot = pid;

			this.hands[player.id].push(fieldSpot.defense);
			fieldSpot.defense = null;

			let cardToSend = {
				cid: card.id,
				suit: card.suit,
				value: card.value
			};

			action.cards.push(cardToSend);
		}

	}

	this.playerTaken = true;
	this.setNextTurnStage('END');

	action.pid = pid;

	this.waitForResponse(this.timeouts.take, this.players);
	this.players.takeNotify(action);
}



//Записывает действие над картой в лог
Game.prototype.logAction = function(card, actionType, from, to){
	let playersById = this.players.byId;
	utils.log(
		card.suit, card.value, ':', 
		actionType,
		playersById[from] ? playersById[from].name : from,
		'=>',
		playersById[to] ? playersById[to].name : to
	);
}

module.exports = Game