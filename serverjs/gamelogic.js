/*
* Конструктор игры
* Раздает карты и управляет правилами игры
*
* Отправляет информацию игрокам через экземпляры игроков (Player)
* После каждого отправления ожидает ответа от игроков (waitForResponse)
* После ответа игроков (recieveResponse) или по истечении времени (setResponseTimer)
* автоматически продолжает игру (continueGame)
*/

'use strict';

const 
	utils = require('./utils'),
	Bot = require('./bots');

var Game = function(players, canTransfer){

	if(!players || !players.length){
		utils.log('ERROR: Can\'t start a game without players');
	}

	//Генерируем айди игры
	this.id = 'game_' + utils.generateId();

	//Сохраняем ссылки на игроков локально
	this.players = players.slice();	
	if(this.players.length < 2){
		this.players.push(new Bot(['addedBot']));
		utils.log('WARNING: Only one player at the start of the game, adding a bot');
	}

	//Можно ли переводить карты
	this.canTransfer = canTransfer;

	//Счет побед и проигрышей игроков (объекты по id игроков)
	this.scores = {};

	//Создаем массив игроков по айди
	this.playersById = {};

	//Сообщаем игрокам о соперниках
	let opponents = [];
	for(let pi = 0; pi < this.players.length; pi++){
		let p = this.players[pi];
		let o = {
			id: p.id,
			name: p.name
		}
		opponents.push(o);
	}

	for(let pi = 0; pi < this.players.length; pi++){
		let player = this.players[pi];
		player.game = this;
		this.playersById[player.id] = player;
		this.scores[player.id] = {
			wins: 0,
			losses: 0,
			cardsWhenLost: 0
		};

		if(opponents.length){
			try{
				player.meetOpponents(opponents);
			}
			catch(e){
				console.log(e);
				utils.log('ERROR: Couldn\' notify', player, 'about opponents')
			}
		}
	}

	this.disconnectedPlayers = [];

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

	//Свойства карт
	this.cardValues = [];
	this.numOfSuits = 4;
	this.maxCardValue = 14;

	//Карты (объекты)
	this.cards = [];

	//Перемешанная колода (id карт)
	this.deck = [];

	//Сброс (id карт)
	this.discardPile = [];

	//Карты на столе (в игре) (объекты, содержащие id карт)
	this.field = [];
	this.fieldSpots = {};
	this.fieldSize = 6;
	this.fieldUsedSpots = 0;
	this.fullField = this.zeroDiscardFieldSize = this.fieldSize - 1;
	for(let i = 0; i < this.fieldSize; i++) {
		let id = 'FIELD'+i;
		let fieldSpot = {
			attack: null,
			defense: null,
			id: id
		}
		this.field.push(fieldSpot);
		this.fieldSpots[id] = fieldSpot;
	}

	//Руки (объекты по id игроков, содержащие id карт)
	this.hands = {};
	this.normalHandSize = 6;

	//'Действующие' игроки (id игроков)
	this.playersActing = [];

	//Счетчик пропущенных ходов
	this.skipCounter = 0;

	//Невышедшие и вышедшие из игры игроки
	this.activePlayers = [];
	this.inactivePlayers = [];

	//Возможные действия игроков
	this.validActions = [];
	this.storedActions = [];

	//Свойства хода
	this.turnNumber = 1;
	this.nextTurnStage = null;
	this.turnStage = null;

	//Учавствующие в ходе игроки (id игроков)
	this.attacker = null;
	this.defender = null;
	this.ally = null;

	//Запоминаем атакующих при переводе
	this.originalAttackers = [];
}

//Подготовка к игре
Game.prototype.make = function(){

	utils.log('Game started', this.id, this.gameNumber)

	//Перемешиваем игроков
	this.players = utils.shuffleArray(this.players);

	//Игроки, которые еще не закончили игру
	this.activePlayers = this.players.map((p) => p.id);

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

	this.shuffleDeck();

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
	this.gameStartNotify();	// --> continueGame()
}

//Оповещает игроков о колоде
Game.prototype.gameStartNotify = function(){

	let deckToSend = [];
	let playersToSend = [];

	for(let ci = 0; ci < this.deck.length; ci++){

		let cid = this.deck[ci];
		let card = this.cards[cid];

		deckToSend[ci] = utils.copyObject(card);

		deckToSend[ci].cid = deckToSend[ci].id;
		delete deckToSend[ci].id;

		//Игроки знают только о значении карты на дне колоды
		if(card.spot != 'BOTTOM'){
			deckToSend[ci].value = null;
			deckToSend[ci].suit = null;			
		} 
	}

	for(let pi = 0; pi < this.players.length; pi++){
		let player = this.players[pi];
		playersToSend.push({
			id: player.id,
			name: player.name
		});
	}

	this.gameStateNotify(this.players, true, true, false, false);
}

//Оповещает игрокам о состоянии игры
Game.prototype.gameStateNotify = function(players, sendCards, sendPlayers, sendSuit, sendDiscard){

	let cardsToSend = [];
	let playersToSend = [];

	if(sendCards){
		for(let ci = 0; ci < this.deck.length; ci++){

			let cid = this.deck[ci];
			let card = this.cards[cid];
			let newCard = utils.copyObject(card);

			//Игроки знают только о значении карты на дне колоды
			if(card.spot != 'BOTTOM'){
				newCard.value = null;
				newCard.suit = null;			
			} 

			cardsToSend.push(newCard);
		}

		for(let pi = 0; pi < this.players.length; pi++){

			let p = this.players[pi];
			let pid = p.id;
			let hand = this.hands[pid];
			if(!hand)
				continue;
			for(let ci = 0; ci < hand.length; ci++){

				let cid = hand[ci];
				let card = this.cards[cid];
				let newCard = utils.copyObject(card);

				if(card.spot != player.id){
					newCard.value = null;
					newCard.suit = null;			
				} 

				cardsToSend.push(newCard);
			}
		}

		for(let fi = 0; fi < this.field.length; fi++){

			let fieldSpot = this.field[fi];
			if(fieldSpot.attack){
				let card = this.cards[fieldSpot.attack];
				let newCard = utils.copyObject(card);
				cardsToSend.push(newCard);
			}
			if(fieldSpot.defense){
				let card = this.cards[fieldSpot.defense];
				let newCard = utils.copyObject(card);
				cardsToSend.push(newCard);
			}		
		}
		for(let ci = 0; ci < cardsToSend.length; ci++){
			let card = cardsToSend[ci];
			card.cid = card.id;
			delete card.id;
		}
	}

	if(sendPlayers){
		for(let pi = 0; pi < this.players.length; pi++){
			let player = this.players[pi];
			playersToSend.push({
				id: player.id,
				name: player.name
			});
		}
	}

	try{
		for (let pi = 0; pi < players.length; pi++) {		
			players[pi].recieveGameInfo(
				sendCards && cardsToSend,
				sendPlayers && playersToSend,
				sendSuit && this.trumpSuit,
				sendDiscard && this.discardPile.length
			);
		}	
	}
	catch(e){
		console.log(e);
		utils.log('ERROR: Couldn\'t send game info');
	}
}

//Размешивает колоду
Game.prototype.shuffleDeck = function(){

	/*for (let ci = this.deck.length; ci; ci--) {

		let randomIndex = Math.floor(Math.random() * ci);
		let temp = this.deck[ci - 1];

		this.deck[ci - 1] = this.deck[randomIndex];
		this.deck[randomIndex] = temp;

	}*/
	this.deck = utils.shuffleArray(this.deck);
}

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
		this.dealNotify(dealsOut);
	}
	else{
		this.continueGame();
	}
}

//Оповещает игроков о розданных картах
Game.prototype.dealNotify = function(deals){
	for (let pi = 0; pi < this.players.length; pi++) {

		let dealsToSend = [];
		let player = this.players[pi];

		for(let i = 0; i < deals.length; i++){

			let deal = deals[i];

			dealsToSend[i] = {
				pid: deal.pid,
				cid: deal.cid
			}

			//Игроки знают только о значении своих карт
			if(deal.pid == player.id){
				dealsToSend[i].value = this.cards[deal.cid].value;
				dealsToSend[i].suit = this.cards[deal.cid].suit;
			}
		}

		try{
			player.recieveDeals(dealsToSend);
		}
		catch(e){
			console.log(e);
			utils.log('ERROR: Couldn\'t send deals to', player);
		}
	}	
}

//Раздает карты пока у всех не по 6 карт или пока колода не закончится
Game.prototype.dealTillFullHand = function(){
	let deals = [];

	let sequence = [];
	for(let oi = 0; oi < this.originalAttackers.length; oi++){
		let pid = this.originalAttackers[oi];
		if(!~sequence.indexOf(pid))
			sequence.push(pid);
	}
	if(!~sequence.indexOf(this.attacker))
		sequence.push(this.attacker);

	if(this.ally && !~sequence.indexOf(this.ally))
		sequence.push(this.ally);

	if(!~sequence.indexOf(this.defender))
		sequence.push(this.defender);

	for(let si = 0; si < sequence.length; si++){
		let player = this.playersById[sequence[si]];
		let cardsInHand = this.hands[player.id].length;
		if(cardsInHand < this.normalHandSize){
			let dealInfo = {
				pid: player.id,
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
		for (let pi = 0; pi < this.players.length; pi++) {
			let player = this.players[pi];
			try{
				player.recieveAction(action);
			}
			catch(e){
				console.log(e);
				utils.log('ERROR: Couldn\'t send action to', player);
			}
		}
	}

	//Иначе раздаем карты и переходим в фазу конца хода
	else{
		this.continueGame();
	}
}

//Отправляет сообщение игрокам с опциональными действиями
Game.prototype.notify = function(players, note, actions){
	for(let pi = 0; pi < players.length; pi++){

		let player = players[pi];

		try{
			player.recieveNotification(utils.copyObject(note) || null, actions || null);
		}
		catch(e){
			console.log(e);
			utils.log('ERROR: Couldn\'t notify', player.name, note && ('of ' + note.message) || '');
		}
	}
}

//Ждет ответа от игроков
Game.prototype.waitForResponse = function(time, players){

	for(let pi = 0; pi < players.length; pi++){
		let player = players[pi];

		//Если игрок отключился, заканчиваем игру, остановив таймер
		if(!player.connected)
			return;

		this.playersActing.push(player.id);
	}

	//utils.log('Waiting for response from', players.length, 'players')
	//utils.log('Waiting for response from: ', players.map((p) => p.id))
	this.setResponseTimer(time)
}

//Таймер ожидания ответа игроков 
Game.prototype.setResponseTimer = function(time){

	if(this.timer)
		clearTimeout(this.timer);

	for(let pi = 0; pi < this.players.length; pi++){

		let player = this.players[pi];
		let pid = player.id;

		if(~this.disconnectedPlayers.indexOf(pid)){
			utils.log(player.name, 'hasn\'t reconnected');
			continue;
		}

		if(!player.connected){
			if(time != 30)
				time = 30;
			this.disconnectedPlayers.push(pid)
			utils.log('Waiting for', player.name, 'to reconnect');
		}
		
	}
	
	this.timer = setTimeout(() => {

		let names = '';
		for(let pi = 0; pi < this.playersActing.length; pi++){
			let pid = this.playersActing[pi];
			let name = this.playersById[pid].name;
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
			let player = this.playersById[this.playersActing[0]];	

			let outgoingAction = this.processAction(player, this.validActions[actionIndex]);

			//Убираем игрока из списка действующих
			this.playersActing = [];

			this.waitForResponse(this.timeouts.actionComplete, this.players);
			//Отправляем оповещение о том, что время хода вышло
			try{
				player.handleLateness();
				for(let pi = 0; pi < this.players.length; pi++){
					let p = this.players[pi];
					p.recieveAction(outgoingAction)
				}				
			}
			catch(e){
				console.log(e);
				utils.log('ERROR: Couldn\'t notify');
			}
		}

		//Иначе, обнуляем действующих игроков, возможные действия и продолжаем ход
		else{
			this.playersActing = [];
			this.validActions = [];
			this.continueGame();
		}		

	}, time * 1000) //TODO: заменить на 1000 в финальной версии
}

//Получает ответ от игрока
Game.prototype.recieveResponse = function(player, action){

	//Проверяем валидность ответа
	let pi = this.playersActing.indexOf(player.id);
	if(!~pi){
		utils.log('ERROR:', this.playersById[player.id].name, 'Late or uncalled response');
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
				this.playersActing = [];
				
				//Сообщаем игрокам о действии
				this.waitForResponse(this.timeouts.actionComplete, this.players);
				for(let pi = 0; pi < this.players.length; pi++){
					let p = this.players[pi];
					p.recieveAction(outgoingAction)
				}
				
			}

			//Сообщаем игроку, что действие нелегально
			else{
				this.notify([player], {
					message: 'INVALID_ACTION',
					action: action
				})
			}
			return;			
		}

		//Если игра закончена, действовать могут все
		else
			this.storeAction(player, action);
	}

	//Убираем игрока из списка действующих
	this.playersActing.splice(pi, 1);	

	//Если больше нет действующих игроков, перестаем ждать ответа и продолжаем ход
	if(!this.playersActing.length){
		clearTimeout(this.timer);
		this.continueGame();
	}

}

//Обрабатывает полученное от игрока действие, возвращает исходящее действие
Game.prototype.processAction = function(player, incomingAction){

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

			this.originalAttackers.push(this.attacker);
			if(this.checkGameEnded()){
				this.gameState = 'ENDED';
			}
			else{
				let currentAttackerIndex = this.activePlayers.indexOf(this.attacker);
				this.findNextPlayer(currentAttackerIndex);
				this.setNextTurnStage('DEFENSE');
			}			
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
		if(this.activePlayers.length > 2 && !this.ally){
			utils.log('ERROR: More than 2 players but no ally assigned')
		}

		//Если есть помогающий игрок
		if(this.ally){
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

//Проверяет, закончилась ли игра
Game.prototype.checkGameEnded = function(){
	if(this.deck.length)
		return false;

	//Если осталось меньше двух игроков, завершаем игру
	if(this.activePlayers.length < 2){		

		//Находим проигравшего
		if(this.activePlayers.length == 1){

			let pid = this.activePlayers[0]

			this.gameResult.loser = pid;
			this.scores[pid].losses++;
			this.scores[pid].cardsWhenLost += this.hands[pid].length;

			utils.log(this.playersById[pid].name, 'is the loser');
		}
		else{
			utils.log('Draw');
		}

		return true;
	}
}

//Сбрасываем счетчики и стадию игры
Game.prototype.resetTurn = function(){

	utils.log('Turn Ended');
	
	this.fieldUsedSpots = 0;
	this.skipCounter = 0;
	this.turnStage = null;
	this.nextTurnStage = null;	
	this.playerTaken = false;
	this.originalAttackers = [];
}

//Начинает ход
Game.prototype.startTurn = function(){
	utils.log(
		'\nTurn',
		this.turnNumber,
		this.playersById[this.attacker].name,
		this.playersById[this.defender].name,
		this.ally ? this.playersById[this.ally].name : null,
		'\nCards in deck:', this.deck.length
	);
	utils.stats.line += 2;
	
	for(let pi = 0; pi < this.players.length; pi++){
		let pid = this.players[pi].id;
		utils.log(this.playersById[pid].name, this.hands[pid].length);
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
		scores: utils.copyObject(this.scores),
		results: utils.copyObject(this.gameResult)				 
	};
	let actionAccept = {
		type: 'ACCEPT'
	}
	let actionDecline = {
		type: 'DECLINE'
	}

	this.reset();
	
	this.validActions.push(actionAccept);
	this.validActions.push(actionDecline);

	this.waitForResponse(this.timeouts.gameEnd, this.players);
	this.notify(this.players, note, this.validActions.slice());
}

//Перезапускает игру 
Game.prototype.rematchGame = function(voteResults){
	utils.log('Rematch');

	//Оповещаем игроков о результате голосования
	
	this.notify(this.players, voteResults);

	this.validActions = [];
	this.storedActions = [];
	this.gameState = 'SHOULD_START';

	this.make();
}

//Возвращает игру в лобби
Game.prototype.backToLobby = function(voteResults){
	//Оповещаем игроков о результате голосования
	this.notify(this.players, voteResults);

	utils.log('No rematch');

	//TODO: оповестить лобби
}

//Устанавливает игроков, вышедших из игры, возвращает индекс текущего игрока
Game.prototype.findInactivePlayers = function(){
	//Current attacker index
	let ai = this.activePlayers.indexOf(this.attacker);	

	if(this.deck.length)
		return ai;

	let pi = this.activePlayers.length;

	while(pi--){
		let pid = this.activePlayers[pi];

		//Если у игрока пустая рука
		if(!this.hands[pid].length){

			//Убираем его из списка играющих
			this.activePlayers.splice(pi,1);

			//Находим предыдущего ходящего в сдвинутом массиве
			let newai = this.activePlayers.indexOf(this.attacker);
			if(this.activePlayers[ai] != this.attacker){	

				//Если предыдущий ходящий был сдвинут, переставляем индекс на его новую позицию				
				if(~newai)
					ai = newai

				//Если предыдущий ходящий вышел из игры и он был последним в списке,
				//переставляем индекс предыдущего ходящего в конец измененного списка
				else if(!this.activePlayers[ai])
					ai = this.activePlayers.length - 1
				else
					ai--;
			}

			utils.log(this.playersById[pid].name, 'is out of the game');	

		}
	}

	//Находим игроков, только что вышедших из игры
	let newInactivePlayers = [];

	for(let pi = 0; pi < this.players.length; pi++){

		let p = this.players[pi];
		let pid = p.id;			

		if( !~this.activePlayers.indexOf(pid) && !~this.inactivePlayers.indexOf(pid) ){
			newInactivePlayers.push(pid);
		}
	}

	if(newInactivePlayers.length){

		//Находим победителей
		if(!this.inactivePlayers.length){

			for(let i = 0; i < newInactivePlayers.length; i++){

				let pid = newInactivePlayers[i];

				this.scores[pid].wins++;
				this.gameResult.winners.push(pid);

				utils.log(this.playersById[pid].name, 'is a winner');
			}
			
		}

		//Запоминаем вышедших из игры игроков
		this.inactivePlayers = this.inactivePlayers.concat(newInactivePlayers);
	}
	return ai;
}

//Находит игрока, начинающего игру, по минимальному козырю в руке
//Отправляет информацию о козырях игрокам
Game.prototype.findFirstPlayer = function(){
	let minTCards = [];

	//Находим минимальный козырь в каждой руке
	for(let hid in this.hands){
		if(this.hands.hasOwnProperty(hid)){
			let hand = this.hands[hid];
			let minTCard = {
				pid: hid,
				cid: null,
				value: this.maxCardValue + 1,
				suit: this.trumpSuit
			};
			for(let ci = 0; ci < hand.length; ci++){
				let cid = hand[ci];
				let card = this.cards[cid];
				if(card.suit == this.trumpSuit && card.value < minTCard.value){
					minTCard.pid = card.spot;
					minTCard.cid = card.id;
					minTCard.value = card.value;
				}
			}
			//Если в руке есть козырь
			if(minTCard.value <= this.maxCardValue){
				minTCards.push(minTCard);
			}
		}
	}

	//Если есть хотя бы один козырь
	if(minTCards.length){
		let minTCard = {
			pid: null,
			cid: null,
			value: this.maxCardValue + 1,
			suit: this.trumpSuit
		};

		//Находим минимальный из них
		for(let ci = 0; ci < minTCards.length; ci++){
			if(minTCards[ci].value < minTCard.value){
				minTCard = minTCards[ci];
			}
		}

		//Находим игроков, учавствующих в первом ходе
		let pid = minTCard.pid;
		let pi = this.activePlayers.indexOf(pid);

		let numInvolved = Math.min(this.activePlayers.length, 3);
		let involved = [];
		let i = pi;
		while(numInvolved--){
			if(i >= this.activePlayers.length)
				i = 0;
			involved.push(this.activePlayers[i]);
			i++;
		}
		this.attacker = involved[0];
		this.defender = involved[1];
		this.ally = involved[2] || null;
				
		utils.log('Player to go first: ', this.playersById[this.attacker].name)

		//Сообщаем игрокам о минимальных козырях
		this.waitForResponse(this.timeouts.trumpCards, this.players);
		for(let pi = 0; pi < this.players.length; pi++){
			this.players[pi].recieveMinTrumpCards(minTCards, minTCard.pid)
		}		
	}

	//В противном случае, берем первого попавшегося игрока и начинаем ход
	else{
		this.attacker = this.players[0].id;
		this.defender = this.players[1].id;
		if(this.players.length > 2)
			this.ally = this.players[2].id
		else
			this.ally = null;
		this.continueGame();
	}
}

//Находит игрока, начинающего следующий ход
Game.prototype.findNextPlayer = function(currentAttackerIndex){	

	//Находим участников нового хода
	let numInvolved = Math.min(this.activePlayers.length, 3);
	let involved = [];
	let i = currentAttackerIndex + 1;
	while(numInvolved--){
		if(i >= this.activePlayers.length)
			i = 0;
		involved.push(this.activePlayers[i]);
		i++
	}
	this.attacker = involved[0];
	this.defender = involved[1];
	this.ally = involved[2] || null;
}

//Устанавливает текущую фазу хода и запоминает предыдущую
//INITIAL_ATTACK -> DEFENSE -> REPEATING_ATTACK -> DEFENSE -> REPEATING_ATTACK -> DEFENSE -> ... ->
//SUPPORT -> DEFENSE -> ATTACK -> DEFENSE -> ... -> FOLLOWUP -> DEFENSE -> END -> END_DEAL -> ENDED
Game.prototype.setNextTurnStage = function(stage){
	this.turnStage = this.nextTurnStage;
	this.nextTurnStage = stage;
}

//Отправляет атакующему возможные ходы
Game.prototype.letAttack = function(pid){

	//В данный момент происходит переход между стадиями хода
	//Откомментировать по необходимости
	let turnStage = this.nextTurnStage;
	//let lastTurnStage = this.turnStage;

	let player = this.playersById[pid];
	let hand = this.hands[pid];
	let defHand = this.hands[this.defender];

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
Game.prototype.letDefend = function(pid){

	//В данный момент происходит переход между стадиями хода
	//Откомментировать по необходимости
	//let turnStage = this.nextTurnStage;
	let lastTurnStage = this.turnStage;

	let player = this.playersById[pid];

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
		utils.log(this.playersById[pid].name, 'successfully defended');

		this.setNextTurnStage('END');
		this.continueGame();
		return
	}

	//Узнаем, можно ли переводить
	let canTransfer = this.canTransfer && this.hands[this.ally || this.attacker].length > this.fieldUsedSpots;
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
Game.prototype.letTake = function(pid){

	//В данный момент происходит переход между стадиями хода
	//Откомментировать по необходимости
	//let turnStage = this.nextTurnStage;
	//let lastTurnStage = this.turnStage;

	let player = this.playersById[pid];

	let action = {
		type: 'TAKE',
		cards:[]
	}
	for(let fi = 0; fi < this.field.length; fi++){
		let fieldSpot = this.field[fi];

		if(fieldSpot.attack){

			let card = this.cards[fieldSpot.attack];
			this.logAction(card, action.type, card.spot, player.id);
			card.spot = player.id;

			this.hands[player.id].push(fieldSpot.attack);
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
			this.logAction(card, action.type, card.spot, player.id);
			card.spot = player.id;

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

	action.pid = player.id;

	this.waitForResponse(this.timeouts.take, this.players);
	for(let pi = 0; pi < this.players.length; pi++){

		let newAction = {
			type: 'TAKE'
		};
		let p = this.players[pi];

		if(p.id != action.pid){

			newAction.pid = action.pid;
			newAction.cards = [];

			for(let ci = 0; ci < action.cards.length; ci++){
				
				let card = utils.copyObject(action.cards[ci]);
				delete card.value;
				delete card.suit;
				
				newAction.cards.push(card);
			}
		}
		else{
			newAction = action;
		}
		p.recieveAction(newAction)
	}
}

//Выбирает следующую стадию игры
Game.prototype.continueGame = function(){

	/*this.notify({
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
		if(!this.attacker)
			this.findFirstPlayer();	
		else
			this.doTurn();	
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
		this.letAttack(this.attacker);
		//Turn stage: DEFENSE
		break;

	//Атакующий игрок атакует повторно
	case 'REPEATING_ATTACK':
		this.letAttack(this.attacker);
		//Turn stage: DEFENSE
		break;

	//Атакующий игрок атакует после помогающего игрока
	case 'ATTACK':
		this.letAttack(this.attacker);
		//Turn stage: DEFENSE
		break;

	//Помогающий игрок атакует
	case 'SUPPORT':

		//Debug
		if(!this.ally)
			utils.log('ERROR: No ally assigned, but turn stage is SUPPORT');

		this.letAttack(this.ally || this.attacker);
		//Turn stage: DEFENSE
		break;

	//Подкладывание карт в догонку
	case 'FOLLOWUP':
		this.letAttack(!this.skipCounter ? this.attacker : (this.ally || this.attacker));
		//Turn stage: DEFENSE
		break;

	//Защищающийся игрок ходит
	case 'DEFENSE':

		//Если мы были в стадии подкидывания в догонку, передаем все карты со стола
		//защищающемуся и сообщаем всем игрокам об этом
		if(this.turnStage == 'FOLLOWUP')
			this.letTake(this.defender);
		//Иначе даем защищаться
		else
			this.letDefend(this.defender);
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
			this.attacker = this.defender;

		let currentAttackerIndex = this.findInactivePlayers();
		this.resetTurn();
		//Turn stage: null

		if(this.checkGameEnded()){
			this.endGame();
			return
		}

		this.findNextPlayer(currentAttackerIndex);
		this.continueGame();
		break;

	//Debug
	default:
		utils.log('ERROR: Invalid turn stage', this.nextTurnStage);
		break;
	}
}

//Записывает действие над картой в лог
Game.prototype.logAction = function(card, actionType, from, to){
	utils.log(
		card.suit, card.value, ':', 
		actionType,
		this.playersById[from] ? this.playersById[from].name : from,
		'=>',
		this.playersById[to] ? this.playersById[to].name : to
	);
}

module.exports = Game