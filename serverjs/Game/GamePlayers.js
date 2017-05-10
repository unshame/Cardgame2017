/*
 * Класс, расширяющий GamePlayersBase, предоставляет методы оповещения игроков
 * о статусе игры и нахождения игроков, вышедших из игры и идущих следующими.
 * Также предоставляет метод проверки конца игры.
 */

'use strict';

const
	utils = require('../utils'),
	GamePlayersBase = require('./GamePlayersBase.js');

class GamePlayers extends GamePlayersBase{

	constructor(game, players){
		super(
			game,
			players,
			{
				role: null,
				originalAttacker: false
			},
			{
				role: null,
				originalAttacker: false,
				active: true
			}
		);
	}

	static get [Symbol.species]() { return Array; }

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
			cardsToSend = game.cards.getInfo();

		//Игроки
		if(send.players)
			playersToSend = this.info;

		//Пересылка
		for (let pi = 0; pi < players.length; pi++) {
			let p = players[pi];
			let pid = p.id;
			p.recieveGameInfo(
				send.cards && cardsToSend[pid],
				send.players && playersToSend,
				send.suit && game.cards.trumpSuit
			);
		}	

	}

	//Передает полную информацию об игре игроку
	gameStateNotifyOnReconnect(player){
		if(!this.includes(player)){
			utils.log('WARNING: Can\'t reconnect player that\'s not in this game', this.game.id, player.id);
			return;
		}
		this.gameStateNotify([player], {
			cards: true,
			players: true,
			suit: true
		});
	}

	//Оповещает игроков об оппонентах
	opponentsNotify(){
		let info = this.info;
		if(!info.length)
			return;
			
		for(let pi = 0; pi < this.length; pi++){
			let p = this[pi];				
			p.meetOpponents(info.slice());
		}
	}

	//Оповещает игроков о раздаче карт
	dealNotify(deals){
		let cardsById = this.game.cards.byId;

		for(let pi = 0; pi < this.length; pi++) {

			let dealsToSend = [];
			let p = this[pi];

			for(let di = 0; di < deals.length; di++){

				let deal = deals[di];

				dealsToSend[di] = {
					pid: deal.pid,
					cid: deal.cid
				};

				//Игроки знают только о значении своих карт
				if(deal.pid == p.id){
					dealsToSend[di].value = cardsById[deal.cid].value;
					dealsToSend[di].suit = cardsById[deal.cid].suit;
				}
			}				
			p.recieveDeals(dealsToSend.slice());

		}
	}

	//Оповещает игроков о совершенном действии
	completeActionNotify(action){
		for(let pi = 0; pi < this.length; pi++) {
			let p = this[pi];				
			p.recieveCompleteAction(Object.assign({}, action));
		}
	}

	//Оповещает игроков о минимальных козырях
	minTrumpCardsNotify(cards, minCardPid){
		for(let pi = 0; pi < this.length; pi++){
			this[pi].recieveMinTrumpCards(cards, minCardPid);
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

	//Отправляет сообщение игрокам с опциональными действиями
	notify(note, actions, players){

		if(!players || !players.length)
			players = this;

		for(let pi = 0; pi < players.length; pi++){
			let p = players[pi];				
			p.recieveNotification(Object.assign({}, note) || null, actions || null);
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
						ai = newai;

					//Если предыдущий ходящий вышел из игры и он был последним в списке,
					//переставляем индекс предыдущего ходящего в конец измененного списка
					else if(!activePlayers[ai])
						ai = activePlayers.length - 1;
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
					game.result.winners.push(p.id);

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
		for(let pi = 0; pi < this.length; pi++){

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
					minTCard.pid = card.field;
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
					
			utils.log('Player to go first: ', this.attacker.name);
		}

		//В противном случае, берем первого попавшегося игрока и начинаем ход
		else{
			this.attacker = this[0];
			this.defender = this[1];
			if(this.length > 2)
				this.ally = this[2];
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
			i++;
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

				this.game.result.loser = pid;
				p.score.losses++;
				p.score.cardsWhenLost += this.game.hands[pid].length;

				utils.log(p.name, 'is the loser');
			}
			else{
				utils.log('Draw');
			}

			return true;
		}
		return false;
	}

}

module.exports = GamePlayers;