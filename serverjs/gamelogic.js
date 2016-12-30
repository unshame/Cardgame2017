var utils = require('../serverjs/utils')

var Game = function(players){
	this.id = 'game_' + utils.generateID();
	this.players = players;	
	this.playersById = {};
	for(var pi in players){
		var player = players[pi];
		player.game = this;
		this.playersById[player.id] = player;
		player.meetOpponents(players);
	}

	this.gameNumber = 0;
	this.reset();
	this.make();
}

//Подготовка к игре
Game.prototype.make = function(){

	utils.echo('Game started', this.id)

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
	this.lastCard = this.cards[lastcid];
	this.lastCard.position = 'BOTTOM';
	this.trumpSuit = this.lastCard.suit;

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
	this.fullField = 5;
	this.skipCounter = 0;

	//Руки (объекты по id игроков, содержащие id карт)
	this.hands = {};
	this.normalHandSize = 6;

	this.playersActing = [];
	this.validActions = [];
	this.turnStarted = false;
	this.turnNumber = 1;
	this.turnStage = -1;
	this.defended = false;
	this.shouldDeal = false;

	this.attacker = null;
	this.defender = null;
	this.ally = null;
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

			//utils.echo(card.id, ':', 'DEAL', card.position, '=>', dealInfo.pid);
			utils.echo(card.suit, card.value, ':', 'DEAL', card.position, '=>', dealInfo.pid);

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

//Оповещает игроков о сбросе карт
Game.prototype.discardNotify = function(){

	var action = {
		type: 'DISCARD',
		ids: []
	};

	for(var fi in this.field){
		var fieldSpot = this.field[fi];
		if(fieldSpot.attack){
			var card = this.cards[fieldSpot.attack];
			utils.echo(card.suit, card.value, ':', 'DISCARD', card.position, '=>', 'DISCARDPILE');
			card.position = 'DISCARDPILE';

			action.ids.push({
				id:fieldSpot.attack
			});
			this.discardPile.push(fieldSpot.attack);
			fieldSpot.attack = null;
		}
		if(fieldSpot.defense){
			var card = this.cards[fieldSpot.defense];
			utils.echo(card.suit, card.value, ':', 'DISCARD', card.position, '=>', 'DISCARDPILE');
			card.position = 'DISCARDPILE';

			action.ids.push(fieldSpot.defense);
			this.discardPile.push(fieldSpot.defense);
			fieldSpot.defense = null;
		}
	}
	if(action.length){
		this.shouldDeal = true;
		this.waitForResponse(5, this.players);
		for (var pi in this.players) {
			var player = this.players[pi];
			player.recieveAction(action);
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
	//utils.echo('Waiting for response from', players.length, 'players')
	//utils.echo('Waiting for response from: ', players.map((p) => p.id))
	this.setResponseTimer(time)
}

//Таймер ожидания ответа игроков 
Game.prototype.setResponseTimer = function(time){

	if(this.timer)
		clearTimeout(this.timer);
	
	this.timer = setTimeout(() => {

		if(this.validActions){
			this.processAction(this.playersActing[0], this.validActions[0]);
			this.playersById[this.playersActing[0]].handleLateness()
		}
		this.validActions = []; 

		var stringToLog = '';
		for(var pi in this.playersActing){
			var pid = this.playersActing[pi];
			stringToLog += pid + ' ';
		}
		utils.echo('Players timed out: ', stringToLog);

		this.playersActing = [];
		this.continueTurn();	

	}, time * 1000)
}

//Получает ответ от игрока
Game.prototype.recieveResponse = function(player, action){

	var pi = this.playersActing.indexOf(player.id);
	if(!~pi){
		utils.echo(player.id, 'Late or uncalled response');
		return
	}
	if(this.validActions.length && !action){
		utils.echo('Wating for action but no action recieved')
		return;
	}
	//utils.echo('Response from', player.id, action ? action : '');
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
		utils.echo('Invalid player or action');
		return;
	}

	switch(action.type){
		case 'ATTACK':
			utils.echo(player.name, "attacks")
			var ci = this.hands[player.id].indexOf(action.cid);
			var card = this.cards[action.cid];

			utils.echo(card.suit, card.value, ':', action.type, card.position, '=>', action.position );
			card.position = action.position;

			this.hands[player.id].splice(ci, 1);
			this.fieldSpots[action.position].attack = action.cid;

			action.value = card.value;
			action.suit = card.suit;

			this.fieldUsedSpots++;
			break;

		case 'DEFENSE':
			utils.echo(player.name, "defends")
			var ci = this.hands[player.id].indexOf(action.cid);
			var card = this.cards[action.cid];

			utils.echo(card.suit, card.value, ':', action.type, card.position, '=>', action.position );
			card.position = action.position;

			this.hands[player.id].splice(ci, 1);
			this.fieldSpots[action.position].defense = action.cid;

			action.value = card.value;
			action.suit = card.suit;
			break;

		case 'SKIP':
			utils.echo(player.name, "skips turn")
			this.skipCounter++;
			if(this.skipCounter < 2 && this.activePlayers.length > 2){
				this.turnStage++;
			}

			break;

		case 'TAKE':
			utils.echo(player.name, "takes")
			action.ids = [];
			for(var fi in this.field){
				var fieldSpot = this.field[fi];
				if(fieldSpot.attack){

					var card = this.cards[fieldSpot.attack];
					utils.echo(card.suit, card.value, ':', action.type, card.position, '=>', player.id);
					card.position = player.id;

					this.hands[player.id].push(fieldSpot.attack);
					fieldSpot.attack = null;

					action.ids.push(card.id);
				}
				if(fieldSpot.defense){

					var card = this.cards[fieldSpot.defense];
					utils.echo(card.suit, card.value, ':', action.type, card.position, '=>', player.id);
					card.position = player.id;


					this.hands[player.id].push(fieldSpot.defense);
					fieldSpot.defense = null;

					action.ids.push(card.id);
				}
			}
			this.defended = true;
			break;

		default:
			utils.echo('Unknown action')
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
		utils.echo('Player to go first: ', this.attacker, minTCard)

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
						ai = 0
				}

				utils.echo(pid, 'is out of the game');	

			}
		}
		if(this.activePlayers.length <= 1){			
			return false;
		}
	}

	var attacker = this.activePlayers[ai + 1];
	var defender = this.activePlayers[ai + 2];
	if(this.players.length > 2)
		var support = this.activePlayers[ai + 3];

	this.attacker = attacker ? attacker : this.activePlayers[0];
	this.defender = defender ? defender : attacker ? this.activePlayers[0] : this.activePlayers[1];
	if(this.players.length > 2)
		this.ally = support ? support : defender ? attacker ? this.activePlayers[0] : this.activePlayers[1] : this.activePlayers[2];
	else
		this.ally = null;
	return true;
}

//Отправляет атакующему возможные ходы
Game.prototype.letAttack = function(pid){	

	var player = this.playersById[pid];

	if(this.fieldUsedSpots >= this.fullField){
		utils.echo('Field is full');
		this.turnStage++;
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

	if(this.turnStage % 4){
		var action = {
			type: 'SKIP'
		}
		actions.push(action)
	}
	this.validActions = actions;
	this.turnStage++;
	this.waitForResponse(15, [player])
	player.recieveValidActions(actions);	
	return;
}

//Отправляет защищающемуся возможные ходы
Game.prototype.letDefend = function(pid){	

	var player = this.playersById[pid];

	var defenseSpot = null;

	for(var fi in this.field){
		var fieldSpot = this.field[fi];
		if(fieldSpot.attack && !fieldSpot.defense){
			defenseSpot = fieldSpot;
			break;
		} 
	}

	if(!defenseSpot){
		utils.echo(pid, 'successfully defended');

		this.defended = true;
		this.continueTurn();
		return;
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
	this.turnStage++;
	this.waitForResponse(15, [player])
	player.recieveValidActions(actions);	
}

//Завершает ход и убирает битые карты в сброс
Game.prototype.endTurn = function(){
	this.turnStarted = false;
	this.fieldUsedSpots = 0;
	this.turnStage = 0;
	this.skipCounter = 0;

	this.discardNotify();

	utils.echo('Turn Ended')
}


//Выбирает следующую стадию игры
Game.prototype.continueTurn = function(){

	//Находим игрока, делающего первый ход в игре
	if(!this.attacker){
		this.findPlayerToGoFirst();		
		return;		
	}

	//Раздаем карты после окончания хода
	if(this.shouldDeal){
		this.shouldDeal = false;
		this.dealTillFullHand();
		return;
	}

	//Начинаем ход
	if(!this.turnStarted){	
		
		if(!this.findPlayerToGoNext()){
			utils.echo('Game ended', this.id, '\n\n');
			if(this.gameNumber < 10){
				this.reset();
				this.make();
			}
			return;
		}

		utils.echo('\nTurn', this.turnNumber, this.attacker, '\nCards in deck:', this.deck.length);
		
		for(var pid in this.hands){
			utils.echo(pid, this.hands[pid].length);
		}
		this.turnNumber++;	
		this.turnStarted = true;
		this.defended = false;		
		this.letAttack(this.attacker);
		return;
	}	

	//Даем игрокам ходить
	if(!this.defended){
		switch(this.turnStage % 4){
			case 0:
				this.letAttack(this.attacker);
				break;
			case 1:
				this.letDefend(this.defender);
				break;
			case 2:
				this.letAttack(this.ally ? this.ally : this.attacker)
				break;
			case 3:
				this.letDefend(this.defender);
				break;
			default:
				utils.echo('Invalid turn stage', this.turnStage % 4);
				break;
		}
		return;
	}

	//Завершаем ход
	else{
		this.endTurn();
		return;
	}
}

exports.Game = Game