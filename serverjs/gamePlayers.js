"use strict";

var utils = require('./utils')

class BetterArray extends Array{
	constructor(...arg){
		super(...arg);
	}

	static get [Symbol.species]() { return Array; }

	shuffle(){
		var currentIndex = this.length,
			temporaryValue,
			randomIndex;

		// While there remain elements to shuffle...
		while (0 !== currentIndex) {

			// Pick a remaining element...
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex -= 1;

			// And swap it with the current element.
			temporaryValue = this[currentIndex];
			this[currentIndex] = this[randomIndex];
			this[randomIndex] = temporaryValue;
		}
	}

}

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
		var obj = {
			role: null,
			origAttacker: false
		};
		for(var key in obj){
			if(obj.hasOwnProperty(key))
				p[key] = obj[key];
		}
	}

	//Возвращает статус по умолчанию
	setGameStartStatus(p){
		var obj = {
			role: null,
			origAttacker: false,
			active: true
		};
		for(var key in obj){
			if(obj.hasOwnProperty(key))
				p[key] = obj[key];
		}
	}

	//Ставит статусы по умолчанию
	resetTurn(){
		for(var i = 0; i < this.length; i++){
			let p = this[i];
			this.setTurnStartStatus(p);
		}
	}

	//Ставит статусы по умолчанию
	resetGame(){
		for(var i = 0; i < this.length; i++){
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


	//Статусы	
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

	getWith(status, value){
		let results = [];

		for(let i = 0; i < this.length; i++){
			let p = this[i];
			if(p[status] == value){
				results.push(p);
			}
		}
		return results;
	}

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

	get origAttackers(){
		var players = [];
		for(var pi = 0; pi < this.length; pi++){
			let p = this[pi];
			if(p.origAttacker)
				players.push(p);
		}
		if(players.length){
			players.sort(
				(a, b) => {
					if(a == b)
						return 0
					else if(a > b)
						return 1
					else
						return -1;
				}
			)
		}
		return players;
	}

	set origAttackers(players){
		this.set('origAttacker', false);
		this.setOrigAttackers(players);
	}

	setOrigAttackers(players){
		var last = 1;
		for(let pi = 0; pi < this.length; pi++){
			let p = this[pi];
			if(p.origAttacker)
				last++;
		}
		if(players.length){
			for(var pi = 0; pi < players.length; pi++){
				let p = players[pi];
				this.set('origAttacker', last, [p]);
				last++;
			}
		}
	}

	//Роли
	isValidRole(role){
		return Boolean(~this.roles.indexOf(role));
	}

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


	//Оповещает игроков об оппонентах
	meetOpponents(){
		var info = this.info;
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
	recieveCompleteAction(action){
		try{
			for(let pi = 0; pi < this.length; pi++) {
				let p = this[pi];				
				p.recieveAction(utils.copyObject(action));
			}
		}
		catch(e){
			utils.log('ERROR: Couldn\'t send action to', e);
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
			console.log(e);
			utils.log('ERROR: Couldn\'t notify', note && ('of ' + note.message) || '');
		}
	}


	//Устанавливает игроков, вышедших из игры, возвращает индекс текущего игрока
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
					game.gameResult.winners.push(p);

					utils.log(p.name, 'is a winner');
				}
				
			}

			//Запоминаем вышедших из игры игроков
			this.setInactive(newInactivePlayers);
		}
		return ai;
	}

	//Находит игрока, начинающего игру, по минимальному козырю в руке
	//Отправляет информацию о козырях игрокам
	findToGoFirst(){

		const game = this.game;
		let activePlayers = this.active;

		let minTCards = [];

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
			let minTCard = {
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

			//Сообщаем игрокам о минимальных козырях
			game.waitForResponse(game.timeouts.trumpCards, this);
			for(let pi = 0; pi < this.length; pi++){
				this[pi].recieveMinTrumpCards(minTCards, minTCard.pid)
			}		
		}

		//В противном случае, берем первого попавшегося игрока и начинаем ход
		else{
			this.attacker = this.players[0].id;
			this.defender = this.players[1].id;
			if(this.length > 2)
				this.ally = this.players[2].id
			else
				this.ally = null;
			this.continueGame();
		}
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

}

class GameCards extends BetterArray{

	constructor(...arg){
		super(...arg);
	}
	static get [Symbol.species]() { return Array; }
}

module.exports = GamePlayers