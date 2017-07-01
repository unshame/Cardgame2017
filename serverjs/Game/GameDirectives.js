/*
 * Класс содержит методы, позволяющие игрокам выполнить действия
 * Во время их выполнения происходит переход между стадиями хода
 * Выполняются в контексте игры
 */
'use strict';

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
			this.table.usedFields >= this.table.fullLength || 			
			turnStage != 'FOLLOWUP' && !defHand.length
		){
			this.log.info(
				this.table.usedFields >= this.table.fullLength && 'Field is full' ||
				turnStage != 'FOLLOWUP' && !defHand.length && 'Defender has no cards'
			);
			this.setNextTurnStage('DEFENSE');
			return true;
		}
		else if(!hand.length){
			this.log.info('Attacker has no cards');
			if(this.skipCounter < 2 && this.players.ally){
				this.skipCounter++;
				if(turnStage == 'FOLLOWUP')
					this.setNextTurnStage('FOLLOWUP');
				else
					this.setNextTurnStage('SUPPORT');
			}
			else{
				this.setNextTurnStage('DEFENSE');
			}
			return true;
		}

		let actions = [];

		let emptyTable = this.cards.firstEmptyTable;

		//Находим значения карт, которые можно подбрасывать
		let validValues = [];
		for(let fi = 0; fi < this.table.length; fi++){
			let tableField = this.table[fi];
			if(tableField.attack){
				let card = tableField.attack;
				validValues.push(card.value);
			}
			if(tableField.defense){
				let card = tableField.defense;
				validValues.push(card.value);
			}
		}
		if(!validValues.length)
			validValues = null;

		//Выбираем подходящие карты из руки атакующего и собираем из них возможные действия
		for(let ci = 0; ci < hand.length; ci++){
			let card = hand[ci];
			let cid = card.id;
			if(!validValues || ~validValues.indexOf(card.value)){		
				for(let fi = 0; fi < this.table.length; fi++){	
					let action = {
						type: 'ATTACK',
						cid: cid,
						field: this.table[fi].id,
						linkedField: emptyTable.id
					};
					actions.push(action);
				}
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
		player.recieveValidActions(actions.slice(), this.timeouts.actionAttack);	
		return false;
	}

	//Отправляет защищающемуся возможные ходы
	DEFEND(player){

		//В данный момент происходит переход между стадиями хода
		//Откомментировать по необходимости
		//let turnStage = this.turnStages.next;
		let lastTurnStage = this.turnStages.current;

		let pid = player.id;

		let defenseFields = [];

		//Находим карту, которую нужно отбивать
		for(let fi = 0; fi < this.table.length; fi++){
			let tableField = this.table[fi];

			if(tableField.attack && !tableField.defense){
				defenseFields.push(tableField);
			} 

		}

		//Если ни одной карты не найдено, значит игрок успешно отбился, можно завершать ход
		if(!defenseFields.length){
			this.log.info(player.name, 'successfully defended');

			this.setNextTurnStage('END');
			return true;
		}

		//Узнаем, можно ли переводить
		let canTransfer = 
			this.canTransfer && 
			this.hands[
				this.players.ally && this.players.ally.id || this.players.attacker.id
			].length > this.table.usedFields;

		let attackField = this.table[this.table.usedFields];

		if(canTransfer){
			for(let fi = 0; fi < this.table.length; fi++){
				let tableField = this.table[fi];
				if(tableField.defense){
					canTransfer = false;
					break;
				}
			}
		}

		let actions = [];
		let hand = this.hands[pid];	

		//Создаем список возможных действий защищающегося
		for(let di = 0; di < defenseFields.length; di++){
			let fid = defenseFields[di].id;
			for(let ci = 0; ci < hand.length; ci++){
				let card = hand[ci];
				let cid = card.id;
				let otherCard = defenseFields[di].attack;

				//Карты той же масти и большего значения, либо козыри, если битая карта не козырь,
				//иначе - козырь большего значения
				if(
					card.suit == this.cards.trumpSuit && otherCard.suit != this.cards.trumpSuit ||
					card.suit == otherCard.suit && card.value > otherCard.value
				){			
					let action = {
						type: 'DEFENSE',
						cid: cid,
						field: fid
					};
					actions.push(action);
				}
			}
		}
		//Возожность перевода
		let defenseActionFields = actions.map((action) => action.field);
		if(canTransfer && attackField){

			let emptyTable = this.cards.firstEmptyTable;

			for(let di = 0; di < defenseFields.length; di++){
				for(let ci = 0; ci < hand.length; ci++){
					let card = hand[ci];
					let cid = card.id;
					let otherCard = defenseFields[di].attack;

					if(card.value != otherCard.value)
						continue;

					//Все поля, которые уже не находятся в возможных действиях
					for(let fi = 0; fi < this.table.length; fi++){	
						let fid = this.table[fi].id;

						if(defenseActionFields.includes(fid))
							continue;

						let action = {
							type: 'ATTACK',
							cid: cid,
							field: fid,
							linkedField: emptyTable.id
						};
						actions.push(action);
					}
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
			this.log.error('Invalid turnStage', lastTurnStage);
			break;
		}

		this.waitForResponse(this.timeouts.actionDefend, [player]);
		player.recieveValidActions(actions.slice(), this.timeouts.actionDefend);	

		return false;
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
		for(let fi = 0; fi < this.table.length; fi++){
			let tableField = this.table[fi];

			if(tableField.attack){

				let card = tableField.attack;
				this.logAction(card, action.type, card.field, pid);
				card.field = pid;

				this.hands[pid].push(tableField.attack);
				tableField.attack = null;

				let cardToSend = {
					cid: card.id,
					suit: card.suit,
					value: card.value
				};

				action.cards.push(cardToSend);
			}

			if(tableField.defense){

				let card = tableField.defense;
				this.logAction(card, action.type, card.field, pid);
				card.field = pid;

				this.hands[player.id].push(tableField.defense);
				tableField.defense = null;

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
		return false;
	}
}

module.exports = GameDirectives;