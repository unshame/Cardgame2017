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

class Game{
	constructor(players, canTransfer){
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

		//Можно ли переводить карты
		this.canTransfer = canTransfer;

		//Номер игры
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
		this.resetGame();
		this.startGame();
	}


	//Методы игры

	//Ресет игры
	resetGame(){

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
	startGame(){

		utils.log('Game started', this.id, this.gameNumber);

		this.gameState = 'SHOULD_START';

		//Перемешиваем игроков
		this.players.shuffle();

		//Создаем карты, поля и колоду
		this.cards.make();

		//Начинаем игру
		this.continueGame();
	}

	//Заканчивает игру, оповещает игроков и позволяет им голосовать за рематч
	endGame(){

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
		this.resetGame();
		
		this.validActions.push(actionAccept);
		this.validActions.push(actionDecline);

		this.waitForResponse(this.timeouts.gameEnd, this.players);
		this.players.notify(note, this.validActions.slice());
	}

	//Перезапускает игру 
	rematchGame(voteResults){
		utils.log('Rematch');

		//Оповещаем игроков о результате голосования
		
		this.players.notify(voteResults);

		this.validActions = [];
		this.storedActions = [];

		this.startGame();
	}

	//Возвращает игру в лобби
	backToLobby(voteResults){
		//Оповещаем игроков о результате голосования
		this.players.notify(voteResults);

		utils.log('No rematch');

		//TODO: оповестить лобби
	}


	//Методы хода

	//Сбрасываем счетчики и стадию игры
	resetTurn(){

		utils.log('Turn Ended');
		
		this.field.usedSpots = 0;
		this.skipCounter = 0;
		this.turnStage = null;
		this.nextTurnStage = null;	
		this.playerTook = false;

		this.players.resetTurn();
	}

	//Начинает ход
	startTurn(){
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


	//Методы выбора статуса игры и стадии хода

	//Устанавливает следующую фазу хода и запоминает текущую
	//INITIAL_ATTACK -> DEFENSE -> REPEATING_ATTACK -> DEFENSE -> REPEATING_ATTACK -> DEFENSE -> ... ->
	//SUPPORT -> DEFENSE -> ATTACK -> DEFENSE -> ... -> FOLLOWUP -> DEFENSE -> END -> END_DEAL -> ENDED
	setNextTurnStage(stage){
		this.turnStage = this.nextTurnStage;
		this.nextTurnStage = stage;
	}

	//Выбирает следующую стадию игры
	continueGame(){

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

		//Сообщаем игрокам о колоде и друг друге
		case 'SHOULD_START':		
			this.gameState = 'STARTING';
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
			break;

		//Раздаем карты в начале игры
		case 'STARTING':
			this.gameState = 'STARTED';
			let dealsOut = this.cards.dealStartingHands();
			if(dealsOut.length){
				this.waitForResponse(this.timeouts.deal, this.players);
				this.players.dealNotify(dealsOut);
			}
			else{
				this.continueGame();
			}
			break;

		//Находим игрока, делающего первый ход в игре или продолжаем ход
		case 'STARTED':
			if(!this.players.attacker){

				let [minTCards, minTCard] = this.players.findToGoFirst();	

				//Сообщаем игрокам о минимальных козырях
				if(minTCard){				
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
	doTurn(){

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
			let discarded = this.cards.discard();
			if(discarded){
				this.waitForResponse(this.timeouts.discard, this.players);
				this.players.completeActionNotify(discarded);
			}
			else{
				this.continueGame();
			}
			break;

		//Раздаем карты после окончания хода
		case 'END_DEAL':
			this.setNextTurnStage('ENDED');
			let dealsOut = this.cards.dealTillFullHand();
			if(dealsOut.length){
				this.waitForResponse(this.timeouts.deal, this.players);
				this.players.dealNotify(dealsOut);
			}
			else{
				this.continueGame();
			}
			break;

		//Конец конца хода
		//находим следующего игрока, ресетим ход и проверяем, закончилась ли игра
		case 'ENDED':

			//Если защищающийся брал, сдвигаем айди, по которому будет искаться атакующий
			if(this.playerTook)
				this.players.attacker = this.players.defender;

			let currentAttackerIndex = this.players.findInactive();
			this.resetTurn();
			//Turn stage: null

			if(!this.deck.length && this.players.notEnoughActive()){
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


	//Методы передачи и обработки действий, установки таймера действий

	//Ждет ответа от игроков
	waitForResponse(time, players){

		this.players.working = players;
		this.setResponseTimer(time)
	}

	//Таймер ожидания ответа игроков 
	setResponseTimer(time){

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
	recieveResponse(player, action){

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

			//Останавливаем игру, если игрок отключился
			if(this.players.getWithFirst('connected',false)){
				return
			}

			this.continueGame();
		}
	}

	//Обрабатывает полученное от игрока действие, возвращает исходящее действие
	processAction(player, incomingAction){

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
			utils.log(
				'ERROR: Invalid action',
				player.id,
				incomingAction && incomingAction.type,
				incomingAction,
				this.validActions
			);
			return null;
		}

		let cardsById = this.cards.byId;
		let fieldSpots = this.field.byKey('id');
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

			card = cardsById[action.cid];
			ci = this.hands[player.id].indexOf(card);

			this.logAction(card, action.type, card.spot, action.spot );

			//Перемещаем карту на стол и убираем карту из руки
			card.spot = action.spot;
			this.hands[player.id].splice(ci, 1);
			fieldSpots[action.spot].attack = card;

			//Добавляем информацию о карте в действие
			action.value = card.value;
			action.suit = card.suit;

			//Увеличиваем кол-во занятых мест на столе
			this.field.usedSpots++;

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

			card = cardsById[action.cid];
			ci = this.hands[player.id].indexOf(card);

			this.logAction(card, action.type, card.spot, action.spot );

			//Перемещаем карту на стол и убираем карту из руки
			card.spot = action.spot;
			this.hands[player.id].splice(ci, 1);
			fieldSpots[action.spot].defense = card;

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
	storeAction(player, action){

		let ai = this.validActions.indexOf(action);

		//Проверка действия
		if( !~ai ){
			utils.log('ERROR: Invalid action', player.id, action.type, action);
			return;
		}

		this.storedActions[player.id] = utils.copyObject(action);
	}

	//Считает сохраненные голоса и возвращает результаты
	checkStoredActions(){

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
	letAttack(player){

		//В данный момент происходит переход между стадиями хода
		//Откомментировать по необходимости
		let turnStage = this.nextTurnStage;
		//let lastTurnStage = this.turnStage;
		
		let pid = player.id;
		let hand = this.hands[pid];
		let defHand = this.hands[this.players.defender.id];

		if(
			this.field.usedSpots >= this.field.fullLength || 
			!hand.length ||
			turnStage != 'FOLLOWUP' && !defHand.length
		){
			utils.log(
				this.field.usedSpots >= this.field.fullLength && 'Field is full' ||
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
				let card = fieldSpot.attack;
				validValues.push(card.value)
			}
			if(fieldSpot.defense){
				let card = fieldSpot.defense;
				validValues.push(card.value)
			}
		}
		if(!validValues.length)
			validValues = null;

		//Выбираем первую незаполненную позицию на столе
		let spot = 'FIELD' + this.field.usedSpots;

		//Выбираем подходящие карты из руки атакующего и собираем из них возможные действия
		for(let ci = 0; ci < hand.length; ci++){
			let card = hand[ci];
			let cid = card.id;
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
	}

	//Отправляет защищающемуся возможные ходы
	letDefend(player){

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
		let canTransfer = 
			this.canTransfer && 
			this.hands[
				this.players.ally && this.players.ally.id || this.players.attacker.id
			].length > this.field.usedSpots;

		let attackSpot = this.field[this.field.usedSpots];

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
				let card = hand[ci];
				let cid = card.id;
				let otherCard = defenseSpots[di].attack;

				//Карты той же масти и большего значения, либо козыри, если битая карта не козырь,
				//иначе - козырь большего значения
				if(
					card.suit == this.cards.trumpSuit && otherCard.suit != this.cards.trumpSuit ||
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
	letTake(player){

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

				let card = fieldSpot.attack;
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

				let card = fieldSpot.defense;
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

		this.playerTook = true;
		this.setNextTurnStage('END');

		action.pid = pid;

		this.waitForResponse(this.timeouts.take, this.players);
		this.players.takeNotify(action);
	}


	//Записывает действие над картой в лог
	logAction(card, actionType, from, to){
		let playersById = this.players.byId;
		utils.log(
			card.suit, card.value, ':', 
			actionType,
			playersById[from] ? playersById[from].name : from,
			'=>',
			playersById[to] ? playersById[to].name : to
		);
	}
}

module.exports = Game