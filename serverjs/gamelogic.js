var utils = require('../serverjs/utils')

var Game = function(players){

	//Генерируем айди игры
	this.id = 'game_' + utils.generateID();

	//Сохраняем ссылки на игроков локально
	this.players = players.slice();	

	//Создаем массив игроков по айди
	this.playersById = {};
	for(var pi in players){
		var player = players[pi];
		player.game = this;
		this.playersById[player.id] = player;

		//Сообщаем игрокам о соперниках
		player.meetOpponents(players.map(
			(p) => {
				var o = {
					id: p.id,
					name: p.name
				}
				return o;
			}
		));
	}

	this.gameNumber = 0;

	//Запускаем игру
	this.reset();
	this.make();
}

//Ресет игры
Game.prototype.reset = function(){

	this.gameNumber++;

	this.cardValues = []
	this.numOfSuits = 4;
	this.maxCardValue = 14;

	//Карты (объекты)
	this.cards = [];

	//Перемешанная колода (id карт)
	this.deck = [];

	//Сброс (id карт)
	this.discardPile = [];

	//Карты 'в игре' (id карт)
	this.field = [];
	this.fieldSpots = {};
	for (var i = 0; i <= 6; i++) {
		var id = 'FIELD'+i;
		var fieldSpot = {
			attack: null,
			defense: null,
			id: id
		}
		this.field.push(fieldSpot);
		this.fieldSpots[id] = fieldSpot;
	}
	this.fieldUsedSpots = 0;
	this.fullField = this.zeroDiscardFieldSize = 5;
	this.skipCounter = 0;

	//Руки (объекты по id игроков, содержащие id карт)
	this.hands = {};
	this.normalHandSize = 6;

	this.playersActing = [];
	this.validActions = [];
	this.turnNumber = 1;
	this.turnStage = null;
	this.lastTurnStage = null;
	this.shouldDeal = false;

	this.attacker = null;
	this.defender = null;
	this.ally = null;
}

//Подготовка к игре
Game.prototype.make = function(){

	utils.log('Game started', this.id)

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
	for(var valueI in this.cardValues){

		for(var suitI = 0; suitI < this.numOfSuits; suitI++){
			var id = 'card_' + utils.generateID();
			var card = {
				id: id,
				value: this.cardValues[valueI],
				suit: suitI,
				position: 'DECK'
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
	this.cards[lastcid].position = 'BOTTOM';
	this.trumpSuit = this.cards[lastcid].suit;

	//Сообщаем игрокам о составе колоды
	this.deckNotify();

	//Раздаем карты
	for (var pi in this.players) {
		this.hands[this.players[pi].id] = []
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
Game.prototype.dealTillFullHand = function(dealsIn){
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
		return;
	}
	else{
		this.continueTurn();
		return;
	}
}

//Раздает карты
Game.prototype.deal = function(dealsIn){

	var dealsOut = [];

	for (var dealN = 0; dealN < dealsIn.length; dealN++) {

		var dealInfo = dealsIn[dealN];
		var numOfCards = dealInfo.numOfCards;
		while (numOfCards--) {
			if(!this.deck.length)
				break;

			var card = this.cards[this.deck[0]];

			//utils.log(card.id, ':', 'DEAL', card.position, '=>', dealInfo.pid);
			this.logAction(card, 'DEAL', card.position, dealInfo.pid);

			this.hands[dealInfo.pid].push(card.id);
			card.position = dealInfo.pid;

			var dealFullInfo = {
				pid: dealInfo.pid,
				cardPosition: card.position,
				cid: card.id
			}

			dealsOut.push(dealFullInfo);
			
			this.deck.shift();
		}
	}
	if(dealsOut){
		this.waitForResponse(5, this.players);
		this.dealNotify(dealsOut);
	}
	else{
		this.continueTurn();
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
		player.recieveCards(dealsToSend)
		
	}	
}

//Оповещает игроков о колоде
Game.prototype.deckNotify = function(){

	var deckToSend = [];

	for(var ci in this.deck){

		var cid = this.deck[ci];
		var card = this.cards[cid];

		deckToSend[ci] = utils.copyObject(card);

		//Игроки знают только о значении карты на дне колоды
		if(card.position != 'BOTTOM'){
			deckToSend[ci].value = null;
			deckToSend[ci].suit = null;			
		} 
	}

	for (var pi in this.players) {
		this.players[pi].recieveDeck(deckToSend)
	}	
}

//Сбрасывает карты и оповещает игроков
Game.prototype.discardAndNotify = function(){

	var action = {
		type: 'DISCARD',
		ids: []
	};

	for(var fi in this.field){
		var fieldSpot = this.field[fi];
		if(fieldSpot.attack){
			var card = this.cards[fieldSpot.attack];
			this.logAction(card, 'DISCARD', card.position, 'DISCARDPILE');
			card.position = 'DISCARDPILE';

			action.ids.push(fieldSpot.attack);
			this.discardPile.push(fieldSpot.attack);
			fieldSpot.attack = null;
		}
		if(fieldSpot.defense){
			var card = this.cards[fieldSpot.defense];
			this.logAction(card, 'DISCARD', card.position, 'DISCARDPILE');
			card.position = 'DISCARDPILE';

			action.ids.push(fieldSpot.defense);
			this.discardPile.push(fieldSpot.defense);
			fieldSpot.defense = null;
		}
	}
	if(action.ids.length){

		if(this.fullField <= this.zeroDiscardFieldSize){
			this.fullField++;
			utils.log('First discard, field expanded to', this.fullField);
		}

		this.turnStage = 'ENDDEAL';
		this.waitForResponse(5, this.players);
		for (var pi in this.players) {
			var player = this.players[pi];
			player.recieveAction(null,action);
		}
		return;
	}
	else{
		this.dealTillFullHand();
		return;
	}
}

//Ждет ответа об окончании анимации от игроков
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
	
	this.timer = setTimeout(() => {

		if(this.validActions.length){
			var player = this.playersById[this.playersActing[0]];
			this.processAction(player, this.validActions[0]);
			player.handleLateness()
		}
		this.validActions = []; 

		var stringToLog = '';
		for(var pi in this.playersActing){
			var pid = this.playersActing[pi];
			stringToLog += pid + ' ';
		}
		utils.log('Players timed out: ', stringToLog);

		this.playersActing = [];
		this.continueTurn();	

	}, time * 1000)
}

//Получает ответ от игрока
Game.prototype.recieveResponse = function(player, action){

	var pi = this.playersActing.indexOf(player.id);
	if(!~pi){
		utils.log(player.id, 'Late or uncalled response');
		return
	}
	if(this.validActions.length && !action){
		utils.log('Wating for action but no action recieved')
		return;
	}
	//utils.log('Response from', player.id, action ? action : '');
	if(action){
		this.processAction(player, action);
	}
	this.playersActing.splice(pi, 1);
	if(!this.playersActing.length){
		clearTimeout(this.timer);
		this.continueTurn();
	}
}

//Обрабатывает полученное от игрока действие
Game.prototype.processAction = function(player, action){

	var ai = this.validActions.indexOf(action);
	var pi = this.playersActing.indexOf(player.id);

	if( !~ai || !~pi ){
		clearTimeout(this.timer);
		utils.log('Invalid player or action', player.id, action);
		return;
	}

	switch(action.type){
		case 'ATTACK':
			utils.log(player.name, this.lastTurnStage == 'FOLLOWUP' ? 'follows up' : 'attacks')
			var ci = this.hands[player.id].indexOf(action.cid);
			var card = this.cards[action.cid];

			this.logAction(card, action.type, card.position, action.position );
			card.position = action.position;

			this.hands[player.id].splice(ci, 1);
			this.fieldSpots[action.position].attack = action.cid;

			action.value = card.value;
			action.suit = card.suit;

			this.fieldUsedSpots++;

			if(this.lastTurnStage == 'FOLLOWUP')
				this.setTurnStage('FOLLOWUP')
			else
				this.skipCounter = 0;

			break;

		case 'DEFENSE':
			utils.log(player.name, 'defends')
			var ci = this.hands[player.id].indexOf(action.cid);
			var card = this.cards[action.cid];

			this.logAction(card, action.type, card.position, action.position );
			card.position = action.position;

			this.hands[player.id].splice(ci, 1);
			this.fieldSpots[action.position].defense = action.cid;

			action.value = card.value;
			action.suit = card.suit;
			break;

		case 'SKIP':
			utils.log(player.name, 'skips turn');
			if(this.activePlayers.length > 2 && !this.ally){
				utils.log('More than 2 players but no ally assigned')
			}
			if(this.ally){
				switch(this.lastTurnStage){

					case 'FOLLOWUP':
						if(!this.skipCounter){
							this.skipCounter++;
							this.setTurnStage('FOLLOWUP');
						}
						break;

					case 'INITIALATTACK':
						this.setTurnStage('SUPPORT');
						break;

					default:
						this.skipCounter++;
						if(this.skipCounter < 2){
							if(this.lastTurnStage == 'SUPPORT')
								this.setTurnStage('ATTACK');
							else
								this.setTurnStage('SUPPORT');
						}
						break;
				}
			}
			break;

		case 'TAKE':
			utils.log(player.name, "takes")
			this.skipCounter = 0;
			this.setTurnStage('FOLLOWUP');
			break;

		default:
			utils.log('Unknown action')
			break;
	}

	this.validActions = [];

	this.waitForResponse(5, this.players);
	for(var pi in this.players){
		var p = this.players[pi];
		p.recieveAction(player.id, action)
	}
}

//Находит игрока, начинающего игру, по минимальному козырю в руке
Game.prototype.findPlayerToGoFirst = function(){
	var minTCards = [];

	for(var hid in this.hands){
		if(this.hands.hasOwnProperty(hid)){
			var hand = this.hands[hid];
			var minTCard = {
				pid: hid,
				value: this.maxCardValue + 1
			};
			for(var ci in hand){
				var cid = hand[ci];
				var card = this.cards[cid];
				if(card.suit == this.trumpSuit && card.value < minTCard.value){
					minTCard.pid = card.position;
					minTCard.value = card.value;
				}
			}
			if(minTCard.value <= this.maxCardValue){
				minTCards.push(minTCard);
			}
		}
	}

	if(minTCards.length){
		var minTCard = {
			pid: null,
			value: this.maxCardValue + 1
		};

		for(var ci in minTCards){
			if(minTCards[ci].value < minTCard.value){
				minTCard = minTCards[ci];
			}
		}

		var pid = minTCard.pid;
		var defender = this.players[this.playersById[pid] + 1];
		var support = this.players[this.playersById[pid] + 2];

		this.attacker = minTCard.pid;
		this.defender = defender && defender.id || this.players[0].id;
		this.ally = support && support.id || defender ? this.players[0].id : this.players[1].id; 
		utils.log('Player to go first: ', this.playersById[this.attacker].name)

		this.waitForResponse(5, this.players);
		for(var pi in this.players){
			this.players[pi].recieveMinTrumpCards(minTCards, minTCard)
		}		
	}
	else{
		this.attacker = this.players[0].id;
		this.defender = this.players[1].id;
		this.ally = this.players[2].id; 
		this.continueTurn();
	}
}

//Находит игрока, начинающего следующий ход и проверяет окончание игры
Game.prototype.findPlayerToGoNext = function(){

	var ai = this.activePlayers.indexOf(this.attacker);

	if(!this.deck.length){
		var pi = this.activePlayers.length;
		while(pi--){
			var pid = this.activePlayers[pi];
			if(!this.hands[pid].length){
				this.activePlayers.splice(pi,1);

				var newai = this.activePlayers.indexOf(this.attacker);
				if(this.activePlayers[ai] != this.attacker){					
					if(~newai)
						ai = newai
					else if(!this.activePlayers[ai])
						ai = this.activePlayers.length - 1
				}

				utils.log(pid, 'is out of the game');	

			}
		}
		if(this.activePlayers.length <= 1){			
			return false;
		}
	}

	var attacker = this.activePlayers[ai + 1];
	var defender = this.activePlayers[ai + 2];
	var support = this.activePlayers[ai + 3];

	this.attacker = attacker ? attacker : this.activePlayers[0];
	this.defender = defender ? defender : attacker ? this.activePlayers[0] : this.activePlayers[1];
	if(this.activePlayers.length > 2)
		this.ally = support ? support : defender ? attacker ? this.activePlayers[0] : this.activePlayers[1] : this.activePlayers[2];
	else
		this.ally = null;
	return true;
}

//Устанавливает текущую фазу хода и запоминает предыдущую
//INITIALATTACK -> DEFENSE -> SUPPORT -> DEFENSE -> ATTACK -> DEFENSE -> ... -> FOLLOWUP -> DEFENSE -> [ENDDEAL] -> ENDED
Game.prototype.setTurnStage = function(stage){
	this.lastTurnStage = this.turnStage;
	this.turnStage = stage;
}

//Отправляет атакующему возможные ходы
Game.prototype.letAttack = function(pid){	

	var player = this.playersById[pid];

	if(this.fieldUsedSpots >= this.fullField){
		utils.log('Field is full');
		this.setTurnStage('DEFENSE');
		this.continueTurn();
		return;
	}

	var actions = [];
	var hand = this.hands[pid];

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

	var position = 'FIELD' + this.fieldUsedSpots;

	for(var ci in hand){
		var cid = hand[ci];
		var card = this.cards[cid];
		if(!validValues || ~validValues.indexOf(card.value)){			
			var action = {
				type: 'ATTACK',
				cid: cid,
				position: position
			}
			actions.push(action);
		}
	}

	if(this.turnStage != 'INITIALATTACK'){
		var action = {
			type: 'SKIP'
		}
		actions.push(action)		
	}
	
	this.setTurnStage('DEFENSE');

	this.validActions = actions;
	this.waitForResponse(15, [player])
	player.recieveValidActions(actions);	
	return;
}

//Отправляет защищающемуся возможные ходы
Game.prototype.letDefend = function(pid){	

	var player = this.playersById[pid];

	var defenseSpot = null;

	if(this.lastTurnStage == 'FOLLOWUP'){
		var action = {
			type: 'TAKE',
			ids:[]
		}
		for(var fi in this.field){
			var fieldSpot = this.field[fi];
			if(fieldSpot.attack){

				var card = this.cards[fieldSpot.attack];
				this.logAction(card, action.type, card.position, player.id);
				card.position = player.id;

				this.hands[player.id].push(fieldSpot.attack);
				fieldSpot.attack = null;

				action.ids.push(card.id);
			}
			if(fieldSpot.defense){

				var card = this.cards[fieldSpot.defense];
				this.logAction(card, action.type, card.position, player.id);
				card.position = player.id;

				this.hands[player.id].push(fieldSpot.defense);
				fieldSpot.defense = null;

				action.ids.push(card.id);
			}
		}

		this.attacker = player.id;
		this.setTurnStage('END');

		this.waitForResponse(5, this.players);
		for(var pi in this.players){
			var p = this.players[pi];
			p.recieveAction(player.id, action)
		}
		return;
	}

	for(var fi in this.field){
		var fieldSpot = this.field[fi];
		if(fieldSpot.attack && !fieldSpot.defense){
			defenseSpot = fieldSpot;
			break
		} 
	}

	if(!defenseSpot){
		utils.log(this.playersById[pid].name, 'successfully defended');

		this.setTurnStage('END');
		this.continueTurn();
		return
	}

	var actions = [];
	var hand = this.hands[pid];

	var position = defenseSpot.id;

	for(var ci in hand){
		var cid = hand[ci];
		var card = this.cards[cid];
		var otherCard = this.cards[defenseSpot.attack];

		if( card.suit == this.trumpSuit && otherCard.suit != this.trumpSuit || card.suit == otherCard.suit && card.value > otherCard.value){			
			var action = {
				type: 'DEFENSE',
				cid: cid,
				position: position
			}
			actions.push(action);
		}
	}
	var action = {
		type: 'TAKE'
	}
	actions.push(action)

	this.validActions = actions;

	if(this.lastTurnStage == 'INITIALATTACK' || this.lastTurnStage == 'SUPPORT')
		this.setTurnStage('ATTACK');
	else
		this.setTurnStage('SUPPORT');

	this.waitForResponse(15, [player]);
	player.recieveValidActions(actions);	
}

//Завершает ход и убирает битые карты в сброс
Game.prototype.endTurn = function(){
	this.fieldUsedSpots = 0;
	this.turnStage = 'ENDED';
	this.lastTurnStage = null;
	this.skipCounter = 0;

	this.discardAndNotify();

	utils.log('Turn Ended')
}

//Выбирает следующую стадию игры
Game.prototype.continueTurn = function(){

	//Находим игрока, делающего первый ход в игре
	if(!this.attacker){
		this.findPlayerToGoFirst();		
		return;		
	}

	//Раздаем карты после окончания хода
	if(this.turnStage == 'ENDDEAL'){
		this.turnStage = 'ENDED';
		this.dealTillFullHand();
		return;
	}

	//Начинаем ход
	if(!this.turnStage || this.turnStage == 'ENDED'){	
		
		if(!this.findPlayerToGoNext()){
			utils.log('Game ended', this.id, '\n\n');
			if(this.gameNumber < 10){
				this.reset();
				this.make();
			}
			return;
		}

		utils.log('\nTurn', this.turnNumber, this.playersById[this.attacker].name, '\nCards in deck:', this.deck.length);
		
		for(var pid in this.hands){
			utils.log(this.playersById[pid].name, this.hands[pid].length);
		}
		this.turnNumber++;	
		this.setTurnStage('INITIALATTACK');	
		this.continueTurn();
		return;
	}	

	//Стадии хода
	switch(this.turnStage){
		case 'INITIALATTACK':
			this.letAttack(this.attacker);
			break;

		case 'ATTACK':
			this.letAttack(this.attacker);
			break;

		case 'SUPPORT':
			this.letAttack(this.ally || this.attacker)
			break;

		case 'FOLLOWUP':
			this.letAttack(!this.skipCounter ? this.attacker : this.ally || this.attacker);
			break;

		case 'DEFENSE':
			this.letDefend(this.defender);
			break;

		case 'END':
			this.endTurn();
			break;

		default:
			utils.log('Invalid turn stage', this.turnStage);
			break;
	}
	return;
}

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