/*
 * Класс, хранящий ссылки на игроков, участвующих в игре.
 * Предоставляет методы для получения игроков с определенными статусами и установки статусов.
 * Также предоставляет методы оповещения игроков о статусе игры и нахождения игроков,
 * вышедших из игры и идущих следующими.
 */
'use strict';

var utils = require('../utils');

var BetterArray = utils.BetterArray;

class GamePlayers extends BetterArray{

	constructor(game, players){
		super();
		this.game = game;
		this.roles = ['attacker', 'defender','ally'];
		for(let i = 0; i < players.length; i++){
			let p = players[i];
			this.push(p);				
		}
	}

	static get [Symbol.species]() { return Array; }

	//Добавление игроков в массив
	push(p){
		p.game = this.game;
		this.setGameStartStatus(p);
		p.score = {
			wins: 0,
			losses: 0,
			cardsWhenLost: 0
		}
		p.working = false;
		p.active = true;
		super.push(p);
	}


	//Возвращает статус по умолчанию
	setTurnStartStatus(p){
		let obj = {
			role: null,
			origAttacker: false
		};
		for(let key in obj){
			if(obj.hasOwnProperty(key))
				p[key] = obj[key];
		}
	}

	//Возвращает статус по умолчанию
	setGameStartStatus(p){
		let obj = {
			role: null,
			origAttacker: false,
			active: true
		};
		for(let key in obj){
			if(obj.hasOwnProperty(key))
				p[key] = obj[key];
		}
	}

	//Ставит статусы по умолчанию
	resetTurn(){
		for(let i = 0; i < this.length; i++){
			let p = this[i];
			this.setTurnStartStatus(p);
		}
	}

	//Ставит статусы по умолчанию
	resetGame(){
		for(let i = 0; i < this.length; i++){
			let p = this[i];
			this.setGameStartStatus(p);
		}
	}


	//Игроки по id
	get byId(){
		let obj = {};
		for(let i = 0; i < this.length; i++){
			let p = this[i];
			obj[p.id] = p;	
		}
		return obj;
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
	 * @value * - с чем сравнивать статус
	 * @sort Boolean - нужно ли сортировать игроков по значению статуса
	 * Сравнение через ==, так что можно передавать true и любое трушное значение подойдет
	 */
	getWith(status, value, sort){
		let results = [];

		for(let i = 0; i < this.length; i++){
			let p = this[i];
			if(p[status] == value){
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
	getWithFirst(status, value){
		let result = null;

		for(let i = 0; i < this.length; i++){
			let p = this[i];
			if(p[status] == value){
				result = p;
			}
		}
		return result;
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
	get origAttackers(){
		return this.getWith('origAttacker', true, true);
	}
	set origAttackers(players){
		this.set('origAttacker', false);
		this.setOrigAttackers(players);
	}
	setOrigAttackers(players){
		let last = 1;
		for(let pi = 0; pi < this.length; pi++){
			let p = this[pi];
			if(p.origAttacker)
				last++;
		}
		if(players.length){
			for(let pi = 0; pi < players.length; pi++){
				let p = players[pi];
				this.set('origAttacker', last, [p]);
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

		if(!send){
			send = {};
		}

		let cardsToSend = [];
		let playersToSend = [];

		//Карты
		if(send.cards){

			//Колода
			for(let ci = 0; ci < game.deck.length; ci++){

				let cid = game.deck[ci];
				let card = game.cards[cid];
				let newCard = utils.copyObject(card);

				//Игроки знают только о значении карты на дне колоды
				if(card.spot != 'BOTTOM'){
					newCard.value = null;
					newCard.suit = null;			
				} 

				cardsToSend.push(newCard);
			}


			//Руки
			for(let pi = 0; pi < this.length; pi++){

				let p = this[pi];
				let pid = p.id;
				let hand = game.hands[pid];
				if(!hand)
					continue;
				for(let ci = 0; ci < hand.length; ci++){

					let cid = hand[ci];
					let card = game.cards[cid];
					let newCard = utils.copyObject(card);

					if(card.spot != player.id){
						newCard.value = null;
						newCard.suit = null;			
					} 

					cardsToSend.push(newCard);
				}
			}

			//В игре
			for(let fi = 0; fi < game.field.length; fi++){

				let fieldSpot = game.field[fi];
				if(fieldSpot.attack){
					let card = game.cards[fieldSpot.attack];
					let newCard = utils.copyObject(card);
					cardsToSend.push(newCard);
				}
				if(fieldSpot.defense){
					let card = game.cards[fieldSpot.defense];
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

		//Игроки
		if(send.players){
			playersToSend = this.info;
		}

		//Пересылка
		try{
			for (let pi = 0; pi < players.length; pi++) {		
				players[pi].recieveGameInfo(
					send.cards && cardsToSend,
					send.players && playersToSend,
					send.suit && game.trumpSuit,
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
						dealsToSend[di].value = this.game.cards[deal.cid].value;
						dealsToSend[di].suit = this.game.cards[deal.cid].suit;
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
			utils.log('ERROR: Couldn\'t send action to', e);
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
		let activePlayers = this.active;

		let minTCards = [],
			minTCard = null;

		//Находим минимальный козырь в каждой руке
		for(let hid in game.hands){
			if(game.hands.hasOwnProperty(hid)){
				let hand = game.hands[hid];
				let minTCard = {
					pid: hid,
					cid: null,
					value: game.maxCardValue + 1,
					suit: game.trumpSuit
				};
				for(let ci = 0; ci < hand.length; ci++){
					let cid = hand[ci];
					let card = game.cards[cid];
					if(card.suit == game.trumpSuit && card.value < minTCard.value){
						minTCard.pid = card.spot;
						minTCard.cid = card.id;
						minTCard.value = card.value;
					}
				}
				//Если в руке есть козырь
				if(minTCard.value <= game.maxCardValue){
					minTCards.push(minTCard);
				}
			}
		}

		//Если есть хотя бы один козырь
		if(minTCards.length){
			minTCard = {
				pid: null,
				cid: null,
				value: game.maxCardValue + 1,
				suit: game.trumpSuit
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

			let numInvolved = Math.min(activePlayers.length, 3);
			let involved = [];
			let i = pi;
			while(numInvolved--){
				if(i >= activePlayers.length)
					i = 0;
				involved.push(activePlayers[i]);
				i++;
			}
			this.attacker = involved[0];
			this.defender = involved[1];
			this.ally = involved[2] || null;
					
			utils.log('Player to go first: ', this.attacker.name)
	
		}

		//В противном случае, берем первого попавшегося игрока и начинаем ход
		else{
			this.attacker = this.players[0].id;
			this.defender = this.players[1].id;
			if(this.length > 2)
				this.ally = this.players[2].id
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

		//Если осталось меньше двух игроков, завершаем игру
		if(activePlayers.length < 2){		

			//Находим проигравшего
			if(activePlayers.length == 1){

				let p = activePlayers[0];
				let pid = p.id;

				this.game.gameResult.loser = pid;
				p.score.losses++;
				p.score.cardsWhenLost += this.hands[pid].length;

				utils.log(p.name, 'is the loser');
			}
			else{
				utils.log('Draw');
			}

			return true;
		}
		return false
	}

}

module.exports = GamePlayers