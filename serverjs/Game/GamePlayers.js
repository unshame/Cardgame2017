/*
 * Класс, хранящий ссылки на игроков, участвующих в игре.
 * Предоставляет методы для получения игроков с определенными статусами и установки статусов.
 * Также предоставляет методы оповещения игроков о статусе игры и нахождения игроков,
 * вышедших из игры и идущих следующими. Также есть метод проверки конца игры.
 * 
 * Так как класс не хранит массивы с игроками, а составляет их по запросу, для повышения
 * производительности полученные массивы лучше сохранять в переменной и пользоваться ей.
 * Напрямую нужно обращаться только к игрокам по индексу (GamePlayers[index]).
 */

'use strict';

const
	utils = require('../utils'),
	BetterArray = require('../BetterArray.js');

class GamePlayers extends BetterArray{

	constructor(game, players){
		super();
		this.game = game;
		this.roles = ['attacker', 'defender','ally'];
		this.turnStartStatus = {
			role: null,
			originalAttacker: false
		};
		this.gameStartStatus = {
			role: null,
			originalAttacker: false,
			active: true
		};
		for(let i = 0; i < players.length; i++){
			let p = players[i];
			this.push(p);				
		}
	}

	static get [Symbol.species]() { return Array; }

	//Добавление игроков в массив
	push(p){
		p.game = this.game;
		this.setStatuses(p, this.gameStartStatus);
		p.score = {
			wins: 0,
			losses: 0,
			cardsWhenLost: 0
		}
		p.working = false;
		p.active = true;
		super.push(p);
	}


	//Устанавливает статус по умолчанию игроку
	setStatuses(p, status){
		for(let key in status){
			if(status.hasOwnProperty(key))
				p[key] = status[key];
		}
	}

	//Ставит статусы по умолчанию
	resetTurn(){
		for(let i = 0; i < this.length; i++){
			let p = this[i];
			this.setStatuses(p, this.turnStartStatus);
		}
	}

	//Ставит статусы по умолчанию
	resetGame(){
		for(let i = 0; i < this.length; i++){
			let p = this[i];
			this.setStatuses(p, this.gameStartStatus);
		}
	}


	//Игроки по id
	get byId(){
		return this.byKey('id');
	}

	//Возвращает id и имена игроков
	get info(){
		let info = [];
		for(let i = 0; i < this.length; i++){
			let p = this[i];
			let o = {
				id: p.id,
				name: p.name
			};
			info.push(o);	
		}
		return info;
	}


	//СТАТУСЫ	
	
	/*
	 * Меняет статус игроков
	 * @status String - какой статус менять
	 * @value * - на что менять статус
	 * @players Player - у каких игроков менять статус
	 * Сравнение через ==, так что можно передавать true и любое трушное значение подойдет
	 */
	set(status, value, players){

		if(!players || !players.length)
			players = this;

		let pids = this.map(p => p.id);

		for(let i = 0; i < players.length; i++){
			let p = players[i];
			let pi = pids.indexOf(p.id);
			if(~pi){
				let p = this[pi];
				p[status] = value;
			}
		}
	}

	/*
	 * Возвращает массив с игроками с определенным статусом
	 * @status String - какой статус сравнивать
	 * @compare function\* - как или с чем сравнивать статус
	 * @sort Boolean - нужно ли сортировать игроков по значению статуса
	 * @players - опционально можно указать среди каких игроков выбирать
	 */
	getWith(status, compare, sort, players){
		if(!players)
			players = this;

		if(typeof compare != 'function'){
			let newVal = compare;
			compare = (value) => {
				return value == newVal;
			};
		}

		let results = [];

		for(let i = 0; i < players.length; i++){
			let p = players[i];
			if(compare(p[status])){
				results.push(p);
			}
		}
		if(results.length && sort){
			results.sort(
				(a, b) => {
					if(a[status] == b[status])
						return 0
					else if(a[status] > b[status])
						return 1
					else
						return -1;
				}
			)
		}
		return results;
	}

	//Тоже, что и getWith, только возвращается первый результат
	getWithFirst(status, value, players){
		return this.getWith(status, value, false, players)[0];
	}

	//Активные
	get active(){
		return this.getWith('active', true);
	}
	set active(players){
		this.set('active', false);
		if(players.length)
			this.set('active', true, players);
	}
	setActive(players){
		this.set('active', true, players)
	}

	//Неактивные
	get inactive(){
		return this.getWith('active', false);
	}
	set inactive(players){
		this.set('active', true);
		if(players.length)
			this.set('active', false, players);
	}
	setInactive(players){
		this.set('active', false, players)
	}


	//Действующие
	get working(){
		return this.getWith('working', true);
	}
	set working(players){
		this.set('working', false);
		if(players.length)
			this.set('working', true, players);
	}
	setWorking(players){
		this.set('working', true, players)
	}

	//Атакующие до перевода
	get originalAttackers(){
		return this.getWith('originalAttacker', (val) => !!val, true);
	}
	set originalAttackers(players){
		this.set('originalAttacker', false);
		this.setOriginalAttackers(players);
	}
	setOriginalAttackers(players){
		let last = this.originalAttackers.length + 1;
		if(players.length){
			for(let pi = 0; pi < players.length; pi++){
				let p = players[pi];
				this.set('originalAttacker', last, [p]);
				last++;
			}
		}
	}

	//Счеты
	get scores(){
		let scores = {};
		for(let pi = 0; pi < this.length; pi++){
			let p = this[pi];
			scores[p.id] = p.score;
		}
		return scores;
	}


	//РОЛИ

	getWithRole(role){
		return this.getWithFirst('role', role)
	}

	setRole(player, role){
		if(this[role])
			this.set('role', null, this[role]);

		if(player)
			this.set('role', role, [player]);
	}

	get attacker(){
		return this.getWithRole('attacker');
	}
	set attacker(p){
		this.setRole(p, 'attacker');
	}

	get defender(){
		return this.getWithRole('defender');
	}
	set defender(p){
		this.setRole(p, 'defender');
	}

	get ally(){
		return this.getWithRole('ally');
	}
	set ally(p){
		this.setRole(p, 'ally');
	}


	//ОПОВЕЩЕНИЕ ИГРОКОВ

	//Оповещает игроков о состоянии игры
	gameStateNotify(players, send){

		const game = this.game;
		let playersToSend = null;
		let cardsToSend = null;

		if(!send){
			send = {};
		}		

		//Карты
		if(send.cards)
			cardsToSend = game.cards.getInfo(players);

		//Игроки
		if(send.players)
			playersToSend = this.info;

		//Пересылка
		try{
			for (let pi = 0; pi < players.length; pi++) {
				let p = players[pi];
				let pid = p.id;
				p.recieveGameInfo(
					send.cards && cardsToSend[pid],
					send.players && playersToSend,
					send.suit && game.cards.trumpSuit,
					send.discard && game.discardPile.length
				);
			}	
		}
		catch(e){
			utils.log('ERROR: Couldn\'t send game info', e);
		}
	}

	//Оповещает игроков об оппонентах
	opponentsNotify(){
		let info = this.info;
		if(!info.length)
			return;
		try{
			for(let pi = 0; pi < this.length; pi++){
				let p = this[pi];				
				p.meetOpponents(info.slice());
			}
		}
		catch(e){
			utils.log('ERROR: Couldn\' notify about opponents', e)
		}
	}

	//Оповещает игроков о раздаче карт
	dealNotify(deals){
		let cardsById = this.game.cards.byId;
		try{
			for(let pi = 0; pi < this.length; pi++) {

				let dealsToSend = [];
				let p = this[pi];

				for(let di = 0; di < deals.length; di++){

					let deal = deals[di];

					dealsToSend[di] = {
						pid: deal.pid,
						cid: deal.cid
					}

					//Игроки знают только о значении своих карт
					if(deal.pid == p.id){
						dealsToSend[di].value = cardsById[deal.cid].value;
						dealsToSend[di].suit = cardsById[deal.cid].suit;
					}
				}				
				p.recieveDeals(dealsToSend.slice());

			}
		}
		catch(e){
			utils.log('ERROR: Couldn\'t send deals', e);
		}	
	}

	//Оповещает игроков о совершенном действии
	completeActionNotify(action){
		try{
			for(let pi = 0; pi < this.length; pi++) {
				let p = this[pi];				
				p.recieveCompleteAction(utils.copyObject(action));
			}
		}
		catch(e){
			utils.log('ERROR: Couldn\'t send action', e);
		}
	}

	//Оповещает игроков о минимальных козырях
	minTrumpCardsNotify(cards, minCardPid){
		for(let pi = 0; pi < this.length; pi++){
			this[pi].recieveMinTrumpCards(cards, minCardPid)
		}	
	}

	//Оповещает игроков о том, что один из игроков взял карты
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
					
					let card = utils.copyObject(action.cards[ci]);
					delete card.value;
					delete card.suit;
					
					newAction.cards.push(card);
				}
			}
			else{
				newAction = action;
			}
			p.recieveCompleteAction(newAction)
		}
	}

	//Отправляет сообщение игрокам с опциональными действиями
	notify(note, actions, players){

		if(!players || !players.length)
			players = this;

		try{
			for(let pi = 0; pi < players.length; pi++){
				let p = players[pi];				
				p.recieveNotification(utils.copyObject(note) || null, actions || null);
			}
		}
		catch(e){
			utils.log('ERROR: Couldn\'t notify', note && ('of ' + note.message) || '', e);
		}
	}


	//УПРАВЛЕНИЕ ИГРОКАМИ

	//Устанавливает игроков, вышедших из игры
	//Возвращает индекс текущего игрока
	findInactive(){

		const game = this.game;
		let activePlayers = this.active;
		let inactivePlayers = this.inactive;

		//Current attacker index
		let ai = activePlayers.indexOf(this.attacker);	

		if(game.deck.length)
			return ai;

		let pi = activePlayers.length;

		while(pi--){
			let p = activePlayers[pi];
			let pid = p.id;

			//Если у игрока пустая рука
			if(!game.hands[pid].length){

				//Убираем его из списка играющих
				activePlayers.splice(pi,1);

				//Находим предыдущего ходящего в сдвинутом массиве
				let newai = activePlayers.indexOf(this.attacker);
				if(activePlayers[ai] != this.attacker){	

					//Если предыдущий ходящий был сдвинут, переставляем индекс на его новую позицию				
					if(~newai)
						ai = newai

					//Если предыдущий ходящий вышел из игры и он был последним в списке,
					//переставляем индекс предыдущего ходящего в конец измененного списка
					else if(!activePlayers[ai])
						ai = activePlayers.length - 1
					else
						ai--;
				}

				utils.log(p.name, 'is out of the game');	

			}
		}
		this.active = activePlayers;

		//Находим игроков, только что вышедших из игры
		let newInactivePlayers = [];

		for(let pi = 0; pi < this.length; pi++){

			let p = this[pi];			

			if( !~activePlayers.indexOf(p) && !~inactivePlayers.indexOf(p) ){
				newInactivePlayers.push(p);
			}
		}

		if(newInactivePlayers.length){

			//Находим победителей
			if(!inactivePlayers.length){

				for(let i = 0; i < newInactivePlayers.length; i++){

					let p = newInactivePlayers[i];

					p.score.wins++;
					game.gameResult.winners.push(p.id);

					utils.log(p.name, 'is a winner');
				}
				
			}

			//Запоминаем вышедших из игры игроков
			this.setInactive(newInactivePlayers);
		}
		return ai;
	}

	//Находит игрока, начинающего игру, по минимальному козырю в руке
	//Возвращает козыри в руках игроков и минимальный козырь
	findToGoFirst(){

		const game = this.game;
		let cardsById = game.cards.byId;
		let activePlayers = this.active;

		let minTCards = [],
			minTCard = null;

		//Находим минимальный козырь в каждой руке
		for(let pi in this){

			let pid = this[pi].id;
			if(!game.hands.hasOwnProperty(pid))
				continue;

			let hand = game.hands[pid];
			let minTCard = {
				pid: pid,
				cid: null,
				value: game.cards.maxValue + 1,
				suit: game.cards.trumpSuit
			};

			for(let ci = 0; ci < hand.length; ci++){
				let card = hand[ci];
				if(card.suit == game.cards.trumpSuit && card.value < minTCard.value){
					minTCard.pid = card.spot;
					minTCard.cid = card.id;
					minTCard.value = card.value;
				}
			}

			//Если в руке есть козырь
			if(minTCard.value <= game.cards.maxValue){
				minTCards.push(minTCard);
			}
		}

		//Если есть хотя бы один козырь
		if(minTCards.length){
			minTCard = {
				pid: null,
				cid: null,
				value: game.cards.maxValue + 1,
				suit: game.cards.trumpSuit
			};

			//Находим минимальный из них
			for(let ci = 0; ci < minTCards.length; ci++){
				if(minTCards[ci].value < minTCard.value){
					minTCard = minTCards[ci];
				}
			}

			//Находим игроков, учавствующих в первом ходе
			let pid = minTCard.pid;
			let pi = activePlayers.map(p => p.id).indexOf(pid);

			this.findToGoNext(pi - 1);
					
			utils.log('Player to go first: ', this.attacker.name)	
		}

		//В противном случае, берем первого попавшегося игрока и начинаем ход
		else{
			this.attacker = this[0];
			this.defender = this[1];
			if(this.length > 2)
				this.ally = this[2]
			else
				this.ally = null;
		}
		return [minTCards, minTCard];
	}

	//Находит участников нового хода
	findToGoNext(currentAttackerIndex){	

		let activePlayers = this.active;

		let numInvolved = Math.min(activePlayers.length, 3);
		let involved = [];
		let i = currentAttackerIndex + 1;
		while(numInvolved--){
			if(i >= activePlayers.length)
				i = 0;
			involved.push(activePlayers[i]);
			i++
		}
		this.attacker = involved[0];
		this.defender = involved[1];
		this.ally = involved[2] || null;
	}

	//Проверяет, остались ли игроки в игре и устанавливает проигравшего
	notEnoughActive(){

		let activePlayers = this.active;
		let humanActivePlayer = this.getWithFirst('type', 'player', activePlayers);

		//Если осталось меньше двух игроков, завершаем игру
		if(activePlayers.length < 2){		

			//Находим проигравшего
			if(activePlayers.length == 1){

				let p = activePlayers[0];
				let pid = p.id;

				this.game.gameResult.loser = pid;
				p.score.losses++;
				p.score.cardsWhenLost += this.game.hands[pid].length;

				utils.log(p.name, 'is the loser');
			}
			else{
				utils.log('Draw');
			}

			return true;
		}
		else if(!humanActivePlayer && !this.game.test){
			utils.log('All players are out');
			return true;
		}
		return false
	}

}

module.exports = GamePlayers