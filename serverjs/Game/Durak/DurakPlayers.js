/*
* Класс, расширяющий GamePlayersBase, предоставляет методы оповещения игроков
* о статусе игры и нахождения игроков, вышедших из игры и идущих следующими.
* Также предоставляет метод проверки конца игры.
*/

'use strict';

const GamePlayers = reqfromroot('Game/GamePlayers');

class DurakPlayers extends GamePlayers{

	constructor(game, players){
		super(
			game,
			players,
			{
				role: null,
				roleIndex: null,
				originalAttacker: false,
				passed: false
			},
			{
				role: null,
				roleIndex: null,
				originalAttacker: false,
				passed: false,
				active: true
			}
		);

		this.maxInvolved = this.game.rules.limitAttack ? 3 : Infinity;
	}

	static get [Symbol.species]() { return Array; }

	push(p){
		super.push(p);
		p.score.cardsWhenLost = 0;
	}

	get roles(){
		const game = this.game;
		let roles = {};
		let prevPlayer = this[this.length - 1];
		this.forEach((p) => {
			let role = p.statuses.role;
			let roleIndex = p.statuses.roleIndex;
			let working = p.statuses.working;
			let status = null;
			let defenseStartCards = game.hands[p.id].defenseStartLength;
			if(role == 'defender' && game.actions.takeOccurred){
				role = 'takes';
				status = 'takes';
			}
			else if(role == 'attacker' && p.statuses.passed && game.hands[p.id].length > 0){
				status = 'passed';
			}
			else if(role != 'defender' && prevPlayer.statuses.originalAttacker && game.hands[p.id].length > 0){
				status = 'transfered';
			}
			roles[p.id] = {role, roleIndex, status, working, defenseStartCards};
			prevPlayer = p;
		});
		return roles;
	}

	// СТАТУСЫ

	// Атакующие до перевода
	get originalAttackers(){
		return this.getWith('originalAttacker', val => !!val, true);
	}
	set originalAttackers(players){
		this.set('originalAttacker', false);
		this.setIncrementing('originalAttacker', players);
	}
	setOriginalAttacker(player){
		this.setIncrementing('originalAttacker', [player]);
	}

	// РОЛИ
	
	get attackers(){
		let attackers = this.getWith('role', 'attacker');
		if(attackers.length){
			return this.getWith('roleIndex', val => !!val, true, attackers);
		}
		return [];
	}
	set attackers(players){
		let attackers = this.getWith('role', 'attacker');
		if(attackers.length){
			this.set('role', null, attackers);
			this.set('roleIndex', null, attackers);
		}
		this.set('role', 'attacker', players);
		this.setIncrementing('roleIndex', players);
	}
	setAttacker(player){
		this.set('role', 'attacker', [player]);
		this.setIncrementing('roleIndex', [player]);
	}

	get defender(){
		return this.getWithRole('defender');
	}
	set defender(p){
		this.setRole(p, 'defender');
	}

	// ОПОВЕЩЕНИЕ ИГРОКОВ

	// Оповещает игроков о состоянии игры
	gameStateNotify(players, send, reveal, type, noResponse){

		const game = this.game;
		let playersToSend = null;
		let cardsToSend = null;

		if(!send){
			send = {};
		}		

		// Карты
		if(send.cards){
			cardsToSend = game.cards.getInfo(reveal);
		}

		// Игроки
		if(send.players){
			playersToSend = this.info;
		}

		// Пересылка
		this.forEachOwn((p) => {
			let pid = p.id;
			p.recieveGameInfo(
				{
					type: type || 'GAME_INFO',
					gameId: game.id,
					cards: send.cards ? cardsToSend[pid] : [],
					players: send.players ? playersToSend : [],
					trumpSuit: send.suit ? game.cards.trumpSuit : null,
					lockedFields: game.cards.lockedTablesIds,
					turnIndex: game.turnIndex,
					gameIndex: game.index,
					noResponse: noResponse || false,
					simulating: game.simulating,
					gameRules: Object.assign({}, game.rules)
				}
			);
		}, players);
	}

	// Передает полную информацию об игре игроку
	gameStateNotifyOnReconnect(player){
		if(!this.includes(player)){
			this.log.warn('Can\'t reconnect player that\'s not in this game', this.game.id, player.id);
			return;
		}
		this.gameStateNotify([player], {
			cards: true,
			players: true,
			suit: true
		},
		false,
		'GAME_INFO_UPDATE');
	}

	// Оповещает игроков о раздаче карт
	dealNotify(deals){
		let cardsById = this.game.cards.byId;

		this.forEach((p) => {

			let dealsToSend = [];

			deals.forEach((deal, di) => {

				dealsToSend[di] = {
					pid: deal.pid,
					cid: deal.cid
				};

				// Игроки знают только о значении своих карт
				if(deal.pid == p.id){
					dealsToSend[di].value = cardsById[deal.cid].value;
					dealsToSend[di].suit = cardsById[deal.cid].suit;
				}
			});				
			p.recieveDeals(dealsToSend.slice());

		});
	}

	// Оповещает игроков о минимальных козырях
	minTrumpCardsNotify(cards, minCardPid){
		let action = {
			type: 'TRUMP_CARDS',
			cards: cards,
			pid: minCardPid
		};
		for(let pi = 0; pi < this.length; pi++){
			this[pi].recieveCompleteAction(action);
		}	
	}

	// Оповещает игроков о том, что один из игроков взял карты
	takeNotify(action){
		for(let pi = 0; pi < this.length; pi++){

			let newAction = {
				type: 'TAKE'
			};
			let p = this[pi];

			if(p.id != action.pid){

				newAction.pid = action.pid;
				newAction.cards = [];

				for(let ci = 0; ci < action.cards.length; ci++){
					
					let card = Object.assign({}, action.cards[ci]);
					delete card.value;
					delete card.suit;
					
					newAction.cards.push(card);
				}
			}
			else{
				newAction = action;
			}
			this.applyNoResponseStatus(newAction, p);
			p.recieveCompleteAction(newAction);
		}
	}

	// УПРАВЛЕНИЕ ИГРОКАМИ
	
	// Проверяет, остались ли игроки в игре и устанавливает проигравшего
	// Если осталось меньше двух игроков, завершаем игру
	get notEnoughActive(){
		return this.active.length < 2;
	}

	// Сдвигает атакующего при переводе
	shiftAttacker(){
		let attackers = this.attackers;
		let currentAttackerIndex = this.active.indexOf(attackers[0]);
		this.setOriginalAttacker(attackers[0]);
		this.findToGoNext(currentAttackerIndex);
	}

	getLastActiveAttacker(attackers){
		if(!attackers){
			attackers = this.attackers;
		}
		let lastActiveAttacker = null;
		this.forEachOwn((attacker) => {
			if(!attacker.statuses.passed){
				lastActiveAttacker = attacker;
			}
		}, attackers);
		return lastActiveAttacker;
	}

	// Устанавливает игроков, вышедших из игры
	// Возвращает индекс текущего игрока
	findInactive(){

		const game = this.game;
		let activePlayers = this.active;
		let inactivePlayers = this.inactive;
		let attackers = this.attackers;
		let newInactivePlayers = [];

		// Current attacker index
		let ai = activePlayers.indexOf(attackers[0]);	

		if(game.deck.length){
			return ai;
		}

		let pi = activePlayers.length;

		// Находим игроков, только что вышедших из игры
		while(pi--){
			let p = activePlayers[pi];
			let pid = p.id;

			// Если у игрока пустая рука
			if(!game.hands[pid].length){

				// Запоминаем его
				newInactivePlayers.push(p);

				// Убираем его из списка играющих
				activePlayers.splice(pi,1);

				ai = this.adjustAttackerIndex(ai, activePlayers, attackers[0]);

				this.log.info(p.name, 'is out of the game');	

			}
		}

		// Если игроки вышли из игры
		if(newInactivePlayers.length){

			// Запоминаем какие игроки остались в игре
			this.active = activePlayers;

			// Объявляем победителей
			if(!inactivePlayers.length){
				this.declareWinners(newInactivePlayers);
			}

			// Запоминаем вышедших из игры игроков
			this.setInactive(newInactivePlayers);
		}
		return ai;
	}

	// Находит и возвращает индекс предыдущего ходящего в сдвинутом массиве активных игроков
	adjustAttackerIndex(ai, activePlayers, attacker){
		let newai = activePlayers.indexOf(attacker);
		if(activePlayers[ai] != attacker){	

			// Если предыдущий ходящий был сдвинут, переставляем индекс на его новую позицию				
			if(newai !== -1){
				ai = newai;
			}
			// Если предыдущий ходящий вышел из игры:
			// Если он был первым в списке, переставляем индекс
			// предыдущего ходящего в конец измененного списка
			else if(ai === 0){
				ai = activePlayers.length - 1;
			}
			// Иначе сдвигаем индекс на игрока перед предыдущим ходящим
			else{
				ai--;
			}
		}
		return ai;
	}

	// Устанавливает победителей
	declareWinners(newInactivePlayers){
		newInactivePlayers.forEach((p) => {
			p.score.wins++;
			this.game.result.winners.push(p.id);
			this.log.info(p.name, 'is a winner');
		});
	}

	// Находит игрока, начинающего игру, по минимальному козырю в руке
	// Возвращает козыри в руках игроков и минимальный козырь
	findToGoFirst(){

		let activePlayers = this.active;

		let [minCards, minCard] = this.findMinTrumpCards();

		// Если есть хотя бы один козырь
		if(minCard){

			// Находим игроков, учавствующих в первом ходе
			let pid = minCard.field;
			let pi = activePlayers.map(p => p.id).indexOf(pid);

			this.findToGoNext(pi - 1);
		}
		// В противном случае, берем первого попавшегося игрока и начинаем ход
		else{
			this.findToGoNext(-1);
		}
		this.log.info('Player to go first: ', this.attackers[0].name);
		return [minCards, minCard];
	}

	// Находим минимальный козырь в каждой руке
	findMinTrumpCards(){
		const game = this.game;

		let minCards = [],
			minCard = null;

		// Находим минимальный козырь в каждой руке
		this.forEach((p) => {

			let pid = p.id;

			if(!game.hands.hasOwnProperty(pid)){
				return;
			}

			let hand = game.hands[pid];
			let minCard = null;

			hand.forEach((card) => {
				if( card.suit == game.cards.trumpSuit && (!minCard || card.value < minCard.value) ){
					minCard = card.info;
				}
			});

			// Если в руке есть козырь
			if(minCard){
				minCards.push(minCard);
			}
		});

		// Находим минимальный из них
		if(minCards.length){

			minCards.forEach((c) => {
				if(!minCard || c.value < minCard.value){
					minCard = c;
				}
			});
		}

		return [minCards, minCard];
	}

	// Находит участников  хода
	findToGoNext(currentAttackerIndex){	

		let activePlayers = this.active;

		let numInvolved = Math.min(activePlayers.length, this.maxInvolved);
		let attackers = [];
		let i = currentAttackerIndex + 1;
		let n = 0;
		while(n < numInvolved){
			if(i >= activePlayers.length){
				i = 0;
			}
			if(n == 1){
				this.defender = activePlayers[i];
			}
			else{
				attackers.push(activePlayers[i]);
			}
			i++;
			n++;
		}
		this.attackers = attackers;		
	}

	// Находим проигравшего
	findLoser(){
		
		let activePlayers = this.active;

		if(activePlayers.length == 1){

			let p = activePlayers[0];
			let pid = p.id;

			this.game.result.loser = pid;
			p.score.losses++;
			p.score.cardsWhenLost += this.game.hands[pid].length;

			this.log.info(p.name, 'is the loser');
		}
		else{
			this.log.info('Draw');
		}
	}

	// ЛОГ

	logTurnStart(){
		const game = this.game;
		let attackers = this.attackers;
		let attacker = attackers.splice(0, 1)[0];
		this.log.info('==================================');
		this.log.info(
			'Turn %d %s => %s <= %s',
			game.turnIndex,
			attacker.name,
			this.defender.name,
			attackers.map(a => a.name).join(', ')
		);
		this.log.info('Cards in deck:', game.deck.length);
		for(let pi = 0; pi < this.length; pi++){
			let p = this[pi];
			let pid = p.id;
			this.log.info(p.name, this.game.hands[pid].length);
		}
	}

}

module.exports = DurakPlayers;