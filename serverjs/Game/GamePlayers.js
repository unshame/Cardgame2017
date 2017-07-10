/*
 * Класс, расширяющий GamePlayersBase, предоставляет методы оповещения игроков
 * о статусе игры и нахождения игроков, вышедших из игры и идущих следующими.
 * Также предоставляет метод проверки конца игры.
 */

'use strict';

const
	GamePlayersBase = require('./GamePlayersBase.js');

class GamePlayers extends GamePlayersBase{

	constructor(game, players){
		super(
			game,
			players,
			{
				role: null,
				roleIndex: null,
				originalAttacker: false
			},
			{
				role: null,
				roleIndex: null,
				originalAttacker: false,
				active: true
			}
		);
		this.log = game.log;
	}

	static get [Symbol.species]() { return Array; }

	push(p){
		p.score = {
			wins: 0,
			losses: 0,
			cardsWhenLost: 0
		};
		p.working = false;
		super.push(p);
	}

	// СТАТУСЫ

	// Активные
	get active(){
		return this.getWith('active', true);
	}
	set active(players){
		this.set('active', false);
		if(players.length)
			this.set('active', true, players);
	}
	setActive(players){
		this.set('active', true, players);
	}

	// Неактивные
	get inactive(){
		return this.getWith('active', false);
	}
	set inactive(players){
		this.set('active', true);
		if(players.length)
			this.set('active', false, players);
	}
	setInactive(players){
		this.set('active', false, players);
	}

	// Действующие
	get working(){
		return this.getWith('working', true);
	}
	set working(players){
		this.set('working', false);
		if(players.length)
			this.set('working', true, players);
	}
	setWorking(players){
		this.set('working', true, players);
	}

	// Атакующие до перевода
	get originalAttackers(){
		return this.getWith('originalAttacker', (val) => !!val, true);
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
			return this.getWith('roleIndex', (val) => !!val, true, attackers);
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
		if(send.cards)
			cardsToSend = game.cards.getInfo(reveal);

		// Игроки
		if(send.players)
			playersToSend = this.info;

		// Пересылка
		for (let pi = 0; pi < players.length; pi++) {
			let p = players[pi];
			let pid = p.id;
			p.recieveGameInfo(
				{
					type: type || 'GAME_INFO',
					cards: send.cards && cardsToSend[pid] || [],
					players: send.players && playersToSend || [],
					trumpSuit: send.suit && game.cards.trumpSuit || null,
					lockedFields: game.cards.lockedFieldsIds,
					turnIndex: game.turnNumber,
					gameIndex: game.index,
					noResponse: noResponse || false
				}
			);
		}	
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

	// Оповещает игроков о совершенном действии
	completeActionNotify(action){
		for(let pi = 0; pi < this.length; pi++) {
			let p = this[pi];				
			p.recieveCompleteAction(Object.assign({}, action));
		}
	}

	// Оповещает игроков о минимальных козырях
	minTrumpCardsNotify(cards, minCardPid){
		for(let pi = 0; pi < this.length; pi++){
			this[pi].recieveMinTrumpCards(cards, minCardPid);
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
			p.recieveCompleteAction(newAction);
		}
	}

	// Отправляет сообщение игрокам с опциональными действиями
	notify(note, actions, players){

		if(!players || !players.length)
			players = this;

		for(let pi = 0; pi < players.length; pi++){
			let p = players[pi];				
			p.recieveNotification(Object.assign({}, note) || null, actions || null);
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
		this.setOriginalAttacker(attackers[0]);

		let currentAttackerIndex = this.active.indexOf(attackers[0]);
		this.findToGoNext(currentAttackerIndex);
	}

	// Устанавливает игроков, вышедших из игры
	// Возвращает индекс текущего игрока
	findInactive(){

		const game = this.game;
		let activePlayers = this.active;
		let inactivePlayers = this.inactive;
		let attackers = this.attackers;

		// Current attacker index
		let ai = activePlayers.indexOf(attackers[0]);	

		if(game.deck.length){
			return ai;
		}

		let pi = activePlayers.length;

		while(pi--){
			let p = activePlayers[pi];
			let pid = p.id;

			// Если у игрока пустая рука
			if(!game.hands[pid].length){

				// Убираем его из списка играющих
				activePlayers.splice(pi,1);

				ai = this.adjustAttackerIndex(ai, activePlayers, attackers[0]);

				this.log.info(p.name, 'is out of the game');	

			}
		}
		this.active = activePlayers;

		// Находим игроков, только что вышедших из игры
		let newInactivePlayers = [];

		this.forEach((p) => {
			if( !~activePlayers.indexOf(p) && !~inactivePlayers.indexOf(p) ){
				newInactivePlayers.push(p);
			}
		});

		if(newInactivePlayers.length){

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
					
			this.log.info('Player to go first: ', this.attackers[0].name);
		}
		// В противном случае, берем первого попавшегося игрока и начинаем ход
		else{
			let attackers = [this[0]];
			if(this[2]){
				attackers.push(this[2]);
			}
			this.attackers = attackers;
			this.defender = this[1];
		}
		return [minCards, minCard];
	}

	// Находим минимальный козырь в каждой руке
	findMinTrumpCards(){
		const game = this.game;

		let minCards = [],
			minCard = null;

		// Находим минимальный козырь в каждой руке
		this.forEach((p, pid) => {

			if(!game.hands.hasOwnProperty(pid))
				return;

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
		let attackers = this.attackers;

		let numInvolved = Math.min(activePlayers.length, 3);
		let involved = [];
		let i = currentAttackerIndex + 1;
		while(numInvolved--){
			if(i >= activePlayers.length)
				i = 0;
			involved.push(activePlayers[i]);
			i++;
		}
		attackers = [involved[0]];
		if(involved[2]){
			attackers.push(involved[2]);
		}
		this.attackers = attackers;
		this.defender = involved[1];
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
		this.log.info();
		this.log.info(
			'Turn %d %s => %s <= %s',
			game.turnNumber,
			attackers[0].name,
			this.defender.name,
			attackers[1] ? attackers[1].name : ''
		);
		this.log.info('Cards in deck:', game.deck.length);
		for(let pi = 0; pi < this.length; pi++){
			let p = this[pi];
			let pid = p.id;
			this.log.info(p.name, this.game.hands[pid].length);
		}
	}

	logTimeout(){
		let playersWorking = this.working;
		let names = '';
		for(let pi = 0; pi < playersWorking.length; pi++){
			let name = playersWorking[pi].name;
			names += name + ' ';
		}
		this.log.notice('Players timed out: ', names);
	}

}

module.exports = GamePlayers;