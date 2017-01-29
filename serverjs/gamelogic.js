/*
* Конструктор игры
* Раздает карты и управляет правилами игры
*
* Отправляет информацию игрокам через экземпляры игроков (Player)
* После каждого отправления ожидает ответа от игроков (waitForResponse)
* После ответа игроков (recieveResponse) или по истечении времени (setResponseTimer)
* автоматически продолжает игру (continueGame)
*/

var utils = require('./utils')

var Game = function(players){

	//Генерируем айди игры
	this.id = 'game_' + utils.generateId();

	//Сохраняем ссылки на игроков локально
	this.players = players.slice();	

	//Счет побед и проигрышей игроков (объекты по id игроков)
	this.scores = {};

	//Создаем массив игроков по айди
	this.playersById = {};
	for(var pi in this.players){
		var player = this.players[pi];
		player.game = this;
		this.playersById[player.id] = player;
		this.scores[player.id] = {
			wins: 0,
			losses: 0,
			cardsWhenLost: 0
		};

		//Сообщаем игрокам о соперниках
		var opponents = [];
		for(var pi in this.players){
			var p = this.players[pi];
			if(p.id != player.id){
				var o = {
					id: p.id,
					name: p.name
				}
				opponents.push(o)
			}
		}
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
	for (var i = 0; i < this.fieldSize; i++) {
		var id = 'FIELD'+i;
		var fieldSpot = {
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
	this.turnStage = null;
	this.lastTurnStage = null;

	//Учавствующие в ходе игроки (id игроков)
	this.attacker = null;
	this.defender = null;
	this.ally = null;
}

//Подготовка к игре
Game.prototype.make = function(){

	utils.log('Game started', this.id, this.gameNumber)

	//Игроки, которые еще не закончили игру
	this.activePlayers = this.players.map((p) => p.id);

	//Задаем количество карт и минимальное значение карты
	if(this.players.length > 4){
		this.lowestCardValue = 2;
		this.numOfCards = 52
	}
	else{
		this.lowestCardValue = 6;
		this.numOfCards = 36;
	}

	//Задаем значения карт
	for (var i = this.lowestCardValue; i <= this.maxCardValue; i++) {
		this.cardValues.push(i);
	}

	//Создаем колоду
	for(var vi in this.cardValues){

		for(var si = 0; si < this.numOfSuits; si++){
			var id = 'card_' + utils.generateId();
			var card = {
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
	for(var ci in this.deck){

		var thiscid = this.deck[ci];
		var othercid = this.deck[this.deck.length - 1];

		if(this.cards[thiscid].value != this.maxCardValue){
			this.deck[this.deck.length - 1] = thiscid;
			this.deck[ci] = othercid;
			break;
		}
	}	

	//Запоминаем козырь
	var lastcid = this.deck[this.deck.length - 1];
	this.cards[lastcid].spot = 'BOTTOM';
	this.trumpSuit = this.cards[lastcid].suit;

	//Сообщаем игрокам о составе колоды и запускаем игру
	this.waitForResponse(5, this.players);
	this.deckNotify();	// --> continueGame()
}

//Размешивает колоду
Game.prototype.shuffleDeck = function(){

	for (var ci = this.deck.length; ci; ci--) {

		var randomIndex = Math.floor(Math.random() * ci);
		var temp = this.deck[ci - 1];

		this.deck[ci - 1] = this.deck[randomIndex];
		this.deck[randomIndex] = temp;

	}
}

//Раздает карты пока у всех не по 6 карт или пока колода не закончится
Game.prototype.dealTillFullHand = function(){
	var deals = [];

	var handsLeft = this.players.length;

	var currentHand = this.players.indexOf(this.playersById[this.attacker]);

	while(handsLeft){		
		if(!this.players[currentHand]){
			currentHand = 0;
		}
		var player = this.players[currentHand];
		var cardsInHand = this.hands[player.id].length;
		if(cardsInHand < this.normalHandSize){
			var dealInfo = {
				pid: player.id,
				numOfCards: this.normalHandSize - cardsInHand
			}
			deals.push(dealInfo);
		}
		handsLeft--;
		currentHand++;
	}
	if(deals.length){
		this.deal(deals);
	}
	else{
		this.continueGame();
	}
}

//Раздает карты
Game.prototype.deal = function(dealsIn){

	var dealsOut = [];

	for (var di = 0; di < dealsIn.length; di++) {

		var dealInfo = dealsIn[di];
		var numOfCards = dealInfo.numOfCards;
		while (numOfCards--) {
			if(!this.deck.length)
				break;

			var card = this.cards[this.deck[0]];

			//utils.log(card.id, ':', 'DEAL', card.spot, '=>', dealInfo.pid);
			this.logAction(card, 'DEAL', card.spot, dealInfo.pid);

			this.hands[dealInfo.pid].push(card.id);
			card.spot = dealInfo.pid;

			var dealFullInfo = {
				pid: dealInfo.pid,
				cardPosition: card.spot,
				cid: card.id
			}

			dealsOut.push(dealFullInfo);
			 
			this.deck.shift();
		}
	}
	if(dealsOut.length){
		this.waitForResponse(3, this.players);
		this.dealNotify(dealsOut);
	}
	else{
		this.continueGame();
	}
}

//Оповещает игроков о розданных картах
Game.prototype.dealNotify = function(deals){
	for (var pi in this.players) {

		var dealsToSend = [];
		var player = this.players[pi];

		for(var i in deals){

			var deal = deals[i];

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

//Оповещает игроков о колоде
Game.prototype.deckNotify = function(){

	var deckToSend = [];

	for(var ci in this.deck){

		var cid = this.deck[ci];
		var card = this.cards[cid];

		deckToSend[ci] = utils.copyObject(card);

		deckToSend[ci].cid = deckToSend[ci].id;
		delete deckToSend[ci].id;

		//Игроки знают только о значении карты на дне колоды
		if(card.spot != 'BOTTOM'){
			deckToSend[ci].value = null;
			deckToSend[ci].suit = null;			
		} 
	}

	for (var pi in this.players) {
		this.players[pi].recieveCards(deckToSend)
	}	
}

//Оповещает игрока о состоянии игры (для реконнекта)
Game.prototype.gameStateNotify = function(player){

	var cardsToSend = [];

	for(var ci in this.deck){

		var cid = this.deck[ci];
		var card = this.cards[cid];
		var newCard = utils.copyObject(card);

		//Игроки знают только о значении карты на дне колоды
		if(card.spot != 'BOTTOM'){
			newCard.value = null;
			newCard.suit = null;			
		} 

		cardsToSend.push(newCard);
	}

	for(var pi in this.players){

		var p = this.players[pi];
		var pid = p.id;

		for(var ci in this.hands[pid]){

			var cid = this.hands[pid][ci];
			var card = this.cards[cid];
			var newCard = utils.copyObject(card);

			if(card.spot != player.id){
				newCard.value = null;
				newCard.suit = null;			
			} 

			cardsToSend.push(newCard);
		}
	}

	for(var fi in this.field){

		var fieldSpot = this.field[fi];
		if(fieldSpot.attack){
			var card = this.cards[fieldSpot.attack];
			var newCard = utils.copyObject(card);
			cardsToSend.push(newCard);
		}
		if(fieldSpot.defense){
			var card = this.cards[fieldSpot.defense];
			var newCard = utils.copyObject(card);
			cardsToSend.push(newCard);
		}		
	}
	for(var ci in cardsToSend){
		var card = cardsToSend[ci];
		card.cid = card.id;
		delete card.id;
	}
	try{
		player.recieveCards(cardsToSend, this.trumpSuit, this.discardPile.length);
	}
	catch(e){
		console.log(e);
		utils.log('ERROR: Couldn\'t send cards to', player);
	}
}

//Сбрасывает карты и оповещает игроков
Game.prototype.discardAndNotify = function(){

	//Сбрасываем счетчики и забываем предыдущую стадию хода
	this.lastTurnStage = null;
	this.fieldUsedSpots = 0;
	this.skipCounter = 0;

	var action = {
		type: 'DISCARD',
		ids: []
	};

	//Убираем карты со всех позиций на столе
	for(var fi in this.field){

		var fieldSpot = this.field[fi];

		if(fieldSpot.attack){
			var card = this.cards[fieldSpot.attack];
			this.logAction(card, 'DISCARD', card.spot, 'DISCARD_PILE');
			card.spot = 'DISCARD_PILE';

			action.ids.push(fieldSpot.attack);
			this.discardPile.push(fieldSpot.attack);
			fieldSpot.attack = null;
		}

		if(fieldSpot.defense){
			var card = this.cards[fieldSpot.defense];
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

		this.turnStage = 'END_DEAL';

		this.waitForResponse(2, this.players);
		for (var pi in this.players) {
			var player = this.players[pi];
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
		this.turnStage = 'ENDED';
		this.dealTillFullHand();
	}
}

//Заканчивает игру, оповещает игроков и позволяет им голосовать за рематч
Game.prototype.endGameAndNotify = function(){

	utils.log('Game ended', this.id, '\n\n');
	
	var note = {
		message: 'GAME_ENDED',
		scores: utils.copyObject(this.scores),
		results: utils.copyObject(this.gameResult)				 
	};
	var actionAccept = {
		type: 'ACCEPT'
	}
	var actionDecline = {
		type: 'DECLINE'
	}

	this.reset();
	
	this.validActions.push(actionAccept);
	this.validActions.push(actionDecline);

	this.waitForResponse(5, this.players);
	this.notify(note, this.validActions.slice());
}

//Отправляет сообщение игрокам с опциональными действиями
Game.prototype.notify = function(note, actions){

	for(var pi in this.players){

		var player = this.players[pi];

		try{
			player.recieveNotification(utils.copyObject(note) || null, actions || null);
		}
		catch(e){
			console.log(e);
			utils.log('ERROR: Couldn\'t notify', player.name, note && ('of ' + note.message) || '' );
		}
	}
}

//Ждет ответа от игроков
Game.prototype.waitForResponse = function(time, players){

	for(var pi in players){
		var player = players[pi];
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

	for(var pi in this.players){

		var player = this.players[pi];
		var pid = player.id;

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

		var names = '';
		for(var pi in this.playersActing){
			var pid = this.playersActing[pi];
			var name = this.playersById[pid].name;
			names += name + ' ';
		}
		utils.log('Players timed out: ', names);


		//Если есть действия, выполняем первое попавшееся действие
		if(this.validActions.length && this.gameState == 'STARTED'){
			var actionIndex = 0;
			for(var ai in this.validActions){
				var action = this.validActions[ai];
				if(action.type == 'SKIP' || action.type == 'TAKE'){
					actionIndex = ai;
					break
				}
			}

			//У нас поддерживается только одно действие от одного игрока за раз
			var player = this.playersById[this.playersActing[0]];	
			this.processAction(player, this.validActions[actionIndex]);

			//Отправляем оповещение о том, что время хода вышло
			try{
				player.handleLateness();
			}
			catch(e){
				console.log(e);
				utils.log('ERROR: Couldn\'t notify', player, 'about lateness');
			}

			//Убираем игрока из списка действующих
			this.playersActing.splice(0,1);
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
	var pi = this.playersActing.indexOf(player.id);
	if(!~pi){
		utils.log('ERROR:', this.playersById[player.id].name, 'Late or uncalled response');
		return
	}
	if(this.validActions.length && !action){
		utils.log('ERROR: Wating for action but no action recieved')
		return;
	}

	//utils.log('Response from', player.id, action ? action : '');

	//Выполняем действие
	if(action){
		if(this.gameState == 'STARTED')
			this.processAction(player, action)
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

//Обрабатывает полученное от игрока действие и пересылает его остальным игрокам
Game.prototype.processAction = function(player, action){

	var ai = this.validActions.indexOf(action);

	//Проверка действия
	if( !~ai ){
		clearTimeout(this.timer);
		utils.log('ERROR: Invalid action', player.id, action.type, action);
		return;
	}

	switch(action.type){

		//Игрок походил
		case 'ATTACK':

			utils.log(player.name, this.lastTurnStage == 'FOLLOWUP' ? 'follows up' : 'attacks')

			var ci = this.hands[player.id].indexOf(action.cid);
			var card = this.cards[action.cid];

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
			if(this.lastTurnStage == 'FOLLOWUP')
				this.setTurnStage('FOLLOWUP')
			else
				this.skipCounter = 0;	//Если же это просто ход, сбрасываем счетчик пропущенных ходов

			break;

		//Игрок отбивается
		case 'DEFENSE':

			utils.log(player.name, 'defends')

			var ci = this.hands[player.id].indexOf(action.cid);
			var card = this.cards[action.cid];

			this.logAction(card, action.type, card.spot, action.spot );

			//Перемещаем карту на стол и убираем карту из руки
			card.spot = action.spot;
			this.hands[player.id].splice(ci, 1);
			this.fieldSpots[action.spot].defense = action.cid;

			//Добавляем информацию о карте в действие
			action.value = card.value;
			action.suit = card.suit;

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
				switch(this.lastTurnStage){

					//Если игра в режиме докладывания карт в догонку и только ходящий игрок походил,
					//даем возможность другому игроку доложить карты
					case 'FOLLOWUP':
						if(!this.skipCounter){
							this.skipCounter++;
							this.setTurnStage('FOLLOWUP');
						}
						break;

					//Атакующий не доложил карту, переходим к помогающему
					case 'REPEATING_ATTACK':
						this.skipCounter++;
						this.setTurnStage('SUPPORT');
						break;

					default:
						//Если кто-то из игроков еще не походил, даем ему возможность 
						this.skipCounter++;
						if(this.skipCounter < 2){

							if(this.lastTurnStage == 'SUPPORT')
								this.setTurnStage('ATTACK')

							else if(this.lastTurnStage == 'ATTACK')
								this.setTurnStage('SUPPORT')

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
			this.setTurnStage('FOLLOWUP');
			break;

		default:
			utils.log('ERROR: Unknown action', action.type)
			break;
	}

	//Обнуляем возможные действия
	this.validActions = [];

	action.pid = player.id;

	//Сообщаем игрока о действии
	this.waitForResponse(1, this.players);
	for(var pi in this.players){
		var p = this.players[pi];
		p.recieveAction(action)
	}
}

Game.prototype.storeAction = function(player, action){

	var ai = this.validActions.indexOf(action);

	//Проверка действия
	if( !~ai ){
		clearTimeout(this.timer);
		utils.log('ERROR: Invalid action', player.id, action.type, action);
		return;
	}

	this.storedActions[player.id] = utils.copyObject(action);
}

//Находит игрока, начинающего игру, по минимальному козырю в руке
Game.prototype.findPlayerToGoFirst = function(){
	var minTCards = [];

	//Находим минимальный козырь в каждой руке
	for(var hid in this.hands){
		if(this.hands.hasOwnProperty(hid)){
			var hand = this.hands[hid];
			var minTCard = {
				pid: hid,
				cid: null,
				value: this.maxCardValue + 1,
				suit: this.trumpSuit
			};
			for(var ci in hand){
				var cid = hand[ci];
				var card = this.cards[cid];
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
		var minTCard = {
			pid: null,
			cid: null,
			value: this.maxCardValue + 1,
			suit: this.trumpSuit
		};

		//Находим минимальный из них
		for(var ci in minTCards){
			if(minTCards[ci].value < minTCard.value){
				minTCard = minTCards[ci];
			}
		}

		//Находим игроков, учавствующих в первом ходе
		var pid = minTCard.pid;
		var pi = this.players.indexOf(this.playersById[pid]);
		var defender = this.players[pi + 1];
		var ally = this.players[pi + 2];

		this.attacker = minTCard.pid;
		this.defender = defender && defender.id || this.players[0].id;
		if(this.activePlayers.length > 2){
			if(ally)
				this.ally = ally.id
			else
				if(defender)
					this.ally = this.players[0].id
				else
					this.ally = this.players[1].id;
		}
		
		utils.log('Player to go first: ', this.playersById[this.attacker].name)

		//Сообщаем игрокам о минимальных козырях
		this.waitForResponse(1, this.players);
		for(var pi in this.players){
			this.players[pi].recieveMinTrumpCards(minTCards, minTCard.pid)
		}		
	}

	//В противном случае, берем первого попавшегося игрока и начинаем ход
	else{
		this.attacker = this.players[0].id;
		this.defender = this.players[1].id;
		this.ally = this.players[2].id; 
		this.continueGame();
	}
}

//Находит игрока, начинающего следующий ход и проверяет окончание игры
//Возвращает true, если игра продолжается и false, если игра закончилась
Game.prototype.findPlayerToGoNext = function(){

	var ai = this.activePlayers.indexOf(this.attacker);

	//Если в колоде нет карт, проверяем, вышли ли игроки из игры
	if(!this.deck.length){
		var pi = this.activePlayers.length;

		while(pi--){
			var pid = this.activePlayers[pi];

			//Если у игрока пустая рука
			if(!this.hands[pid].length){

				//Убираем его из списка играющих
				this.activePlayers.splice(pi,1);

				//Находим предыдущего ходящего в сдвинутом массиве
				var newai = this.activePlayers.indexOf(this.attacker);
				if(this.activePlayers[ai] != this.attacker){	

					//Если предыдущий ходящий был сдвинут, переставляем индекс на его новую позицию				
					if(~newai)
						ai = newai - 1

					//Если предыдущий ходящий вышел из игры и он был последним в списке,
					//переставляем индекс предыдущего ходящего в конец измененного списка
					else if(!this.activePlayers[ai])
						ai = this.activePlayers.length - 1
				}

				utils.log(this.playersById[pid].name, 'is out of the game');	

			}
		}

		//Находим игроков, только что вышедших из игры
		var newInactivePlayers = [];

		for(var pi in this.players){

			var p = this.players[pi];
			var pid = p.id;			

			if( !~this.activePlayers.indexOf(pid) && !~this.inactivePlayers.indexOf(pid) ){
				newInactivePlayers.push(pid);
			}
		}

		if(newInactivePlayers.length){

			//Находим победителей
			if(!this.inactivePlayers.length){

				for(var i in newInactivePlayers){

					var pid = newInactivePlayers[i];

					this.scores[pid].wins++;
					this.gameResult.winners.push(pid);

					utils.log(this.playersById[pid].name, 'is a winner');
				}
				
			}

			//Запоминаем вышедших из игры игроков
			this.inactivePlayers = this.inactivePlayers.concat(newInactivePlayers);
		}

		//Если осталось меньше двух игроков, завершаем игру
		if(this.activePlayers.length < 2){		

			//Находим проигравшего
			if(this.activePlayers.length == 1){

				var pid = this.activePlayers[0]

				this.gameResult.loser = pid;
				this.scores[pid].losses++;
				this.scores[pid].cardsWhenLost += this.hands[pid].length;

				utils.log(this.playersById[pid].name, 'is the loser');
			}
			else{
				utils.log('Draw');
			}

			return false;
		}
	}

	//Находим участников нового хода
	var attacker = this.activePlayers[ai + 1];
	var defender = this.activePlayers[ai + 2];
	var ally = this.activePlayers[ai + 3];

	this.attacker = attacker ? attacker : this.activePlayers[0];
	this.defender = defender ? defender : attacker ? this.activePlayers[0] : this.activePlayers[1];

	//Помогающий есть только когда в игре осталось более двух игроков
	if(this.activePlayers.length > 2){
		if(ally)
			this.ally = ally
		else if(defender)
			this.ally = this.activePlayers[0]
		else
			if(attacker)
				this.ally = this.activePlayers[1]
			else
				this.ally = this.activePlayers[2];
		

	}
	else
		this.ally = null;

	return true;
}

//Устанавливает текущую фазу хода и запоминает предыдущую
//INITIAL_ATTACK -> DEFENSE -> REPEATING_ATTACK -> DEFENSE -> REPEATING_ATTACK -> DEFENSE -> ... ->
//SUPPORT -> DEFENSE -> ATTACK -> DEFENSE -> ... -> FOLLOWUP -> DEFENSE -> END -> [END_DEAL] -> ENDED
Game.prototype.setTurnStage = function(stage){
	this.lastTurnStage = this.turnStage;
	this.turnStage = stage;
}

//Отправляет атакующему возможные ходы
Game.prototype.letAttack = function(pid){

	var player = this.playersById[pid];

	if(this.fieldUsedSpots >= this.fullField || this.turnStage != 'FOLLOWUP' && !this.hands[this.defender].length){
		utils.log('Field is full or defender has no cards');
		this.setTurnStage('DEFENSE');
		this.continueGame();
		return;
	}

	var actions = [];
	var hand = this.hands[pid];

	//Находим значения карт, которые можно подбрасывать
	var validValues = [];
	for(var fi in this.field){
		var fieldSpot = this.field[fi];
		if(fieldSpot.attack){
			var card = this.cards[fieldSpot.attack];
			validValues.push(card.value)
		}
		if(fieldSpot.defense){
			var card = this.cards[fieldSpot.defense];
			validValues.push(card.value)
		}
	}
	if(!validValues.length)
		validValues = null;

	//Выбираем первую незаполненную позицию на столе
	var spot = 'FIELD' + this.fieldUsedSpots;

	//Выбираем подходящие карты из руки атакующего и собираем из них возможные действия
	for(var ci in hand){
		var cid = hand[ci];
		var card = this.cards[cid];
		if(!validValues || ~validValues.indexOf(card.value)){			
			var action = {
				type: 'ATTACK',
				cid: cid,
				spot: spot
			}
			actions.push(action);
		}
	}

	//Добавляем возможность пропустить ход, если это не атака в начале хода
	if(this.turnStage != 'INITIAL_ATTACK'){
		var action = {
			type: 'SKIP'
		}
		actions.push(action)		
	}
	
	//Меняем стадию на стадию защиты
	this.setTurnStage('DEFENSE');

	this.validActions = actions;
	this.waitForResponse(5, [player])
	try{
		player.recieveValidActions(actions.slice());	
	}
	catch(e){
		console.log(e);
		utils.log('ERROR: Couldn\'t send possible actions to', player);
	}
	return
}

//Отправляет защищающемуся возможные ходы
Game.prototype.letDefend = function(pid){

	var player = this.playersById[pid];

	var defenseSpot = null;

	//Если мы были в стадии подкидывания в догонку, передаем все карты со стола защищающемуся и сообщаем всем игрокам об этом
	if(this.lastTurnStage == 'FOLLOWUP'){
		var action = {
			type: 'TAKE',
			cards:[]
		}
		for(var fi in this.field){
			var fieldSpot = this.field[fi];

			if(fieldSpot.attack){

				var card = this.cards[fieldSpot.attack];
				this.logAction(card, action.type, card.spot, player.id);
				card.spot = player.id;

				this.hands[player.id].push(fieldSpot.attack);
				fieldSpot.attack = null;

				var cardToSend = {
					cid: card.id,
					suit: card.suit,
					value: card.value
				};

				action.cards.push(cardToSend);
			}

			if(fieldSpot.defense){

				var card = this.cards[fieldSpot.defense];
				this.logAction(card, action.type, card.spot, player.id);
				card.spot = player.id;

				this.hands[player.id].push(fieldSpot.defense);
				fieldSpot.defense = null;

				var cardToSend = {
					cid: card.id,
					suit: card.suit,
					value: card.value
				};

				action.cards.push(cardToSend);
			}

		}

		this.attacker = player.id;
		this.setTurnStage('END');

		action.pid = player.id;

		this.waitForResponse(5, this.players);
		for(var pi in this.players){

			var newAction = {
				type: 'TAKE'
			};
			var p = this.players[pi];

			if(p.id != action.pid){

				newAction.pid = action.pid;
				newAction.cards = [];

				for(var ci in action.cards){
					
					var card = utils.copyObject(action.cards[ci]);
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
		return;
	}

	//Находим карту, которую нужно отбивать
	for(var fi in this.field){
		var fieldSpot = this.field[fi];

		if(fieldSpot.attack && !fieldSpot.defense){
			defenseSpot = fieldSpot;
			break
		} 

	}

	//Если ни одной карты не найдено, значит игрок успешно отбился, можно завершать ход
	if(!defenseSpot){
		utils.log(this.playersById[pid].name, 'successfully defended');

		this.setTurnStage('END');
		this.continueGame();
		return
	}

	var actions = [];
	var hand = this.hands[pid];
	var spot = defenseSpot.id;

	//Создаем список возможных действий защищающегося
	for(var ci in hand){
		var cid = hand[ci];
		var card = this.cards[cid];
		var otherCard = this.cards[defenseSpot.attack];

		//Карты той же масти и большего значения, либо козыри, если битая карта не козырь, иначе - козырь большего значения
		if(
			card.suit == this.trumpSuit && otherCard.suit != this.trumpSuit ||
			card.suit == otherCard.suit && card.value > otherCard.value
		){			
			var action = {
				type: 'DEFENSE',
				cid: cid,
				spot: spot
			}
			actions.push(action);
		}
	}

	//Добавляем возможность взять карты
	var action = {
		type: 'TAKE'
	}
	actions.push(action)

	this.validActions = actions;

	//Выставляем новую стадию хода в зависимости от предыдущей
	switch(this.lastTurnStage){

		case 'INITIAL_ATTACK':
			this.setTurnStage('REPEATING_ATTACK');
			break;

		case 'REPEATING_ATTACK':
			this.setTurnStage('REPEATING_ATTACK');
			break;

		case 'SUPPORT':
			this.setTurnStage('ATTACK');
			break;

		case 'ATTACK':
			this.setTurnStage('SUPPORT');
			break;		

		//Debug
		default:
			utils.log('ERROR: Invalid lastTurnStage', this.lastTurnStage);
			break;
	}

	this.waitForResponse(5, [player]);
	try{
		player.recieveValidActions(actions);	
	}
	catch(e){
		console.log(e);
		utils.log('ERROR: Couldn\'t send possible actions to', player);
	}
	return;
}

//Выбирает следующую стадию игры
Game.prototype.continueGame = function(){

	//Проверяем, нужно ли перезапускать игру
	if(this.gameState == 'NOT_STARTED'){

		//Считаем голоса
		var numAccepted = 0;
		var minAcceptedNeeded = Math.ceil(this.players.length / 2); //TODO: заменить на this.players.length в финальной версии
		
		for(var pi in this.players){

			var pid = this.players[pi].id;
			var action = this.storedActions[pid];

			if(action && action.type == 'ACCEPT')
				numAccepted++;
		}

		utils.log(numAccepted, 'out of', this.players.length, 'voted for rematch')

		var note = {
			message: 'VOTE_RESULTS',
			results: utils.copyObject(this.storedActions)
		}

		//Если голосов хватает, запускаем игру
		if(numAccepted >= minAcceptedNeeded){

			utils.log('Rematch');

			//Оповещаем игроков о результате голосования
			note.successful = true;
			this.notify(note);

			this.validActions = [];
			this.storedActions = [];
			this.gameState = 'SHOULD_START';

			this.make();
		}

		//Иначе, не запускаем игру
		else{

			//Оповещаем игроков о результате голосования
			note.successful = false;
			this.notify(note);

			utils.log('No rematch');

			//TODO: оповестить лобби
		}			

		return
	}

	//Раздаем карты в начале игры
	if(this.gameState == 'SHOULD_START'){
		this.gameState = 'STARTED';
		for (var pi in this.players) {
			this.hands[this.players[pi].id] = [];
		}
		var deals = [];

		for (var cardN = 0; cardN < this.normalHandSize; cardN++) {
			for(var pi in this.players){
				var dealInfo = {
					pid: this.players[pi].id,
					numOfCards: 1
				}
				deals.push(dealInfo);
			}
		}
		this.deal(deals);
		return
	}

	//Находим игрока, делающего первый ход в игре
	if(!this.attacker){
		this.findPlayerToGoFirst();		
		return	
	}

	//Раздаем карты после окончания хода
	if(this.turnStage == 'END_DEAL'){
		this.turnStage = 'ENDED';
		this.dealTillFullHand();
		return
	}

	//Находим следующего игрока и проверяем, закончилась ли игра
	if(this.turnStage == 'ENDED'){

		utils.log('Turn Ended');

		var shouldContinue = this.findPlayerToGoNext();

		if(!shouldContinue){
			this.endGameAndNotify();
			return
		}

		this.turnStage = null;
	}

	//Начинаем ход
	if(!this.turnStage){		

		utils.log('\nTurn', this.turnNumber, this.playersById[this.attacker].name, this.playersById[this.defender].name, this.ally ? this.playersById[this.ally].name : null, '\nCards in deck:', this.deck.length);
		
		for(var pi in this.players){
			var pid = this.players[pi].id;
			utils.log(this.playersById[pid].name, this.hands[pid].length);
		}

		//Увеличиваем счетчик ходов, меняем стадию игры на первую атаку и продолжаем ход
		this.turnNumber++;	
		this.setTurnStage('INITIAL_ATTACK');	
		this.continueGame();
		return
	}	

	//Стадии хода
	switch(this.turnStage){

		//Первая атака
		case 'INITIAL_ATTACK': 
			this.letAttack(this.attacker);
			break;

		//Атакующий игрок атакует повторно
		case 'REPEATING_ATTACK':
			this.letAttack(this.attacker);
			break;

		//Атакующий игрок атакует после помогающего игрока
		case 'ATTACK':
			this.letAttack(this.attacker);
			break;

		//Помогающий игрок атакует
		case 'SUPPORT':

			//Debug
			if(!this.ally)
				utils.log('ERROR: No ally assigned, but turn stage is SUPPORT');

			this.letAttack(this.ally || this.attacker)
			break;

		//Подкладывание карт в догонку
		case 'FOLLOWUP':
			this.letAttack(!this.skipCounter ? this.attacker : this.ally || this.attacker);
			break;

		//Защищающийся игрок ходит
		case 'DEFENSE':
			this.letDefend(this.defender);
			break;

		//Конец хода
		case 'END':
			this.discardAndNotify();
			break;

		//Debug
		default:
			utils.log('ERROR: Invalid turn stage', this.turnStage);
			break;
	}
	return;
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

exports.Game = Game