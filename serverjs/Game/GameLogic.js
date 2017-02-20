/*
 * Конструктор игры
 * Раздает карты и управляет правилами игры
 *
 * Отправляет информацию игрокам через экземпляры игроков (Player) и группу игроков (GamePlayers)
 * После каждого отправления ожидает ответа от игроков (waitForResponse)
 * После ответа игроков (recieveResponse) или по истечении времени (setResponseTimer)
 * автоматически продолжает игру (continue)
 */

'use strict';

const 
	utils = require('../utils'),
	Bot = require('../Players/Bot'),
	GameCards = require('./GameCards'),
	GamePlayers = require('./GamePlayers'),
	GameStates = require('./GameStates'),
	GameTurnStages = require('./GameTurnStages'),
	GameReactions = require('./GameReactions');

class Game{
	constructor(players, canTransfer, isTest){
		if(!players || !players.length){
			utils.log('ERROR: Can\'t start a game without players');
		}

		this.test = isTest || false;

		//Генерируем айди игры
		this.id = 'game_' + utils.generateId();

		this.states = new GameStates(this);
		this.turnStages = new GameTurnStages(this);
		this.reactions = new GameReactions();

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
		};

		//Запускаем игру
		this.reset();
		this.start();
	}


	//Методы игры

	//Ресет игры
	reset(){

		//Свойства игры
		this.gameNumber++;
		this.states.current = 'NOT_STARTED';
		this.gameResult = {
			winners: [],
			loser: null
		};

		//Ресет игроков
		this.players.resetGame();

		//Ресет карт
		this.cards.reset();

		//Счетчик пропущенных ходов
		this.skipCounter = 0;

		//Возможные действия игроков
		this.validActions = [];
		this.storedActions = [];

		//Свойства хода
		this.turnNumber = 1;
		this.turnStages.next = 'DEFAULT';
	}

	//Подготовка к игре
	start(){

		utils.log('Game started', this.id, this.gameNumber);

		this.states.current = 'SHOULD_START';

		//Перемешиваем игроков
		this.players.shuffle();

		//Создаем карты, поля и колоду
		this.cards.make();

		//Начинаем игру
		this.continue();
	}

	//Заканчивает игру, оповещает игроков и позволяет им голосовать за рематч
	end(){

		utils.log('Game ended', this.id, '\n\n');
		utils.stats.line += 2;
		
		let note = {
			message: 'GAME_ENDED',
			scores: this.players.scores,
			results: utils.copyObject(this.gameResult)				 
		};
		let actionAccept = {
			type: 'ACCEPT'
		};
		let actionDecline = {
			type: 'DECLINE'
		};

		this.reset();
		
		this.validActions.push(actionAccept);
		this.validActions.push(actionDecline);

		this.waitForResponse(this.timeouts.gameEnd, this.players);
		this.players.notify(note, this.validActions.slice());
	}

	//Перезапускает игру 
	rematch(voteResults){
		utils.log('Rematch');

		//Оповещаем игроков о результате голосования
		
		this.players.notify(voteResults);

		this.validActions = [];
		this.storedActions = [];

		this.start();
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
		this.turnStages.current = null;
		this.turnStages.next = 'DEFAULT';	
		this.playerTook = false;

		this.players.resetTurn();
		this.players.notify({message: 'TURN_ENDED'});
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
		this.continue();
	}


	//Методы выбора статуса игры и стадии хода

	//Устанавливает следующую фазу хода и запоминает текущую
	//INITIAL_ATTACK -> DEFENSE -> REPEATING_ATTACK -> DEFENSE -> REPEATING_ATTACK -> DEFENSE -> ... ->
	//SUPPORT -> DEFENSE -> ATTACK -> DEFENSE -> ... -> FOLLOWUP -> DEFENSE -> END -> END_DEAL -> ENDED
	setNextTurnStage(stage){
		this.turnStages.current = this.turnStages.next;
		this.turnStages.next = stage;
	}

	//Выбирает следующую стадию игры
	continue(){

		/*this.players.notify({
			states.current: this.states.current,
			turnStages.next: this.turnStages.next
		})*/

		let state = this.states[this.states.current];
		if(!state){
			utils.log('ERROR: invalid game state', this.states.current);
			return;
		}
		state.call(this);
	}

	//Выбирает следующую стадию хода
	doTurn(){

		//Стадии хода
		let turnStage = this.turnStages[this.turnStages.next];
		if(!turnStage){
			utils.log('ERROR: Invalid turn stage', this.turnStages.next);
			return;
		}
		turnStage.call(this);
	}


	//Методы передачи и обработки действий, установки таймера действий

	//Ждет ответа от игроков
	waitForResponse(time, players){

		this.players.working = players;
		this.setResponseTimer(time);
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
			if(this.validActions.length && this.states.current == 'STARTED'){
				let actionIndex = 0;
				for(let ai = 0; ai < this.validActions.length; ai++){
					let action = this.validActions[ai];
					if(action.type == 'SKIP' || action.type == 'TAKE'){
						actionIndex = ai;
						break;
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
				this.continue();
			}	

		}, time * 1000); //TODO: заменить на 1000 в финальной версии
	}

	//Получает ответ от игрока
	recieveResponse(player, action){

		//Проверяем валидность ответа
		let playersWorking = this.players.working;
		let pi = playersWorking.indexOf(player);
		if(!~pi){
			utils.log('ERROR:', player.name, 'Late or uncalled response');
			return;
		}
		if(this.validActions.length && !action){
			utils.log('ERROR: Wating for action but no action recieved');
			return;
		}

		//utils.log('Response from', player.id, action ? action : '');

		//Выполняем или сохраняем действие
		if(action){
			let outgoingAction;

			//Во время игры один игрок действует за раз
			if(this.states.current == 'STARTED'){

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
						null,
						[player]
					);
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
				return;
			}

			this.continue();
		}
	}

	//Обрабатывает полученное от игрока действие, возвращает исходящее действие
	processAction(player, incomingAction){

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

		//Выполняем действие
		let reaction = this.reactions[action.type];
		if(!reaction){
			utils.log('ERROR: Unknown action', action.type);
			return;
		}
		action = reaction.call(this, player, action);
		action.pid = player.id;

		//Обнуляем возможные действия
		this.validActions = [];		

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

		utils.log(numAccepted, 'out of', this.players.length, 'voted for rematch');

		let note = {
			message: 'VOTE_RESULTS',
			results: utils.copyObject(this.storedActions)
		};

		if(numAccepted >= minAcceptedNeeded)
			note.successful = true;
		else
			note.successful = false;

		return note;
	}


	//Методы, позволяющие игрокам выполнить действия
	//Во время их выполнения происходит переход между стадиями хода

	//Отправляет атакующему возможные ходы
	letAttack(player){

		//В данный момент происходит переход между стадиями хода
		//Откомментировать по необходимости
		let turnStage = this.turnStages.next;
		//let lastTurnStage = this.turnStages.current;
		
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
			this.continue();
			return;
		}

		let actions = [];

		//Находим значения карт, которые можно подбрасывать
		let validValues = [];
		for(let fi = 0; fi < this.field.length; fi++){
			let fieldSpot = this.field[fi];
			if(fieldSpot.attack){
				let card = fieldSpot.attack;
				validValues.push(card.value);
			}
			if(fieldSpot.defense){
				let card = fieldSpot.defense;
				validValues.push(card.value);
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
				};
				actions.push(action);
			}
		}

		//Добавляем возможность пропустить ход, если это не атака в начале хода
		if(turnStage != 'INITIAL_ATTACK'){
			let action = {
				type: 'SKIP'
			};
			actions.push(action);	
		}
		
		//Меняем стадию на стадию защиты
		this.setNextTurnStage('DEFENSE');

		this.validActions = actions;
		this.waitForResponse(this.timeouts.actionAttack, [player]);
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
		//let turnStage = this.turnStages.next;
		let lastTurnStage = this.turnStages.current;

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
			this.continue();
			return;
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
					};
					actions.push(action);
				}

				//Возожность перевода
				if(canTransfer && attackSpot && card.value == otherCard.value){
					let action = {
						type: 'ATTACK',
						cid: cid,
						spot: attackSpot.id
					};
					actions.push(action);
				}
			}
		}

		//Добавляем возможность взять карты
		let action = {
			type: 'TAKE'
		};
		actions.push(action);

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
		//let turnStage = this.turnStages.next;
		//let lastTurnStage = this.turnStages.current;

		let pid = player.id;

		let action = {
			type: 'TAKE',
			cards:[]
		};
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

module.exports = Game;