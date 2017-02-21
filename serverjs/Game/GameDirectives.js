/*
 * Класс содержит методы, позволяющие игрокам выполнить действия
 * Во время их выполнения происходит переход между стадиями хода
 * Выполняются в контексте игры
 */
'use strict';

const
	utils = require('../utils');

class GameDirectives{

	//Отправляет атакующему возможные ходы
	ATTACK(player){

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
	DEFEND(player){

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
	TAKE(player){

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
}

module.exports = GameDirectives;