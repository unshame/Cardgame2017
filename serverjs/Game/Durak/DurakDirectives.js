/*
 * Класс содержит методы, позволяющие игрокам выполнить действия
 * Во время их выполнения происходит переход между стадиями хода
 * Выполняются в контексте игры
 */
'use strict';

class DurakDirectives{

/*	ATTACK_DEFENSE(attackers, defender){
		// В данный момент происходит переход между стадиями хода
		// Откомментировать по необходимости
		let turnStage = this.turnStages.next;
		// let lastTurnStage = this.turnStages.current;
		
		let defHand = this.hands[defender.id];

		if(!this.cards.firstEmptyTable || turnStage != 'FOLLOWUP' && !defHand.length){

			this.log.info(!this.firstEmptyTable && 'Field is full' || 'Defender has no cards');

			this.turnStages.setNext('DEFENSE');
			return true;
		}
		else if(!hand.length){
			this.log.info('Attacker has no cards');

			if(this.skipCounter < 2 && this.players.attackers[1]){
				this.skipCounter++;

				if(turnStage == 'FOLLOWUP'){
					this.turnStages.setNext('FOLLOWUP');
				}
				else{
					this.turnStages.setNext('SUPPORT');
				}
			}
			else{
				this.turnStages.setNext('DEFENSE');
			}
			return true;
		}

		let actions = [];

		for(let i = 0; i < attackers.length; i++){
			let player = attackers[i];
			let hand = this.hands[pid];

			this.cards.getAttackActions(hand, actions);

		}
	}*/

	// Отправляет атакующему возможные ходы
	ATTACK(player){

		// В данный момент происходит переход между стадиями хода
		// Откомментировать по необходимости
		let turnStage = this.turnStages.next;
		// let lastTurnStage = this.turnStages.current;
		
		let pid = player.id;
		let hand = this.hands[pid];
		let defHand = this.hands[this.players.defender.id];

		if(!this.cards.firstEmptyTable || turnStage != 'FOLLOWUP' && !defHand.length){

			this.log.info(!this.firstEmptyTable && 'Field is full' || 'Defender has no cards');

			this.turnStages.setNext('DEFENSE');
			return true;
		}
		else if(!hand.length){
			this.log.info('Attacker has no cards');

			if(this.skipCounter < 2 && this.players.attackers[1]){
				this.skipCounter++;

				if(turnStage == 'FOLLOWUP'){
					this.turnStages.setNext('FOLLOWUP');
				}
				else{
					this.turnStages.setNext('SUPPORT');
				}
			}
			else{
				this.turnStages.setNext('DEFENSE');
			}
			return true;
		}

		let actions = [];

		this.cards.getAttackActions(hand, actions);

		// Добавляем возможность пропустить ход, если это не атака в начале хода
		if(turnStage != 'INITIAL_ATTACK'){
			let action = {
				type: 'SKIP'
			};
			actions.push(action);	
		}
		
		// Меняем стадию на стадию защиты
		this.turnStages.setNext('DEFENSE');

		this.log.silly(actions);

		this.actions.valid = actions;
		this.waitForResponse(this.actions.timeouts.actionAttack, [player]);
		player.recieveValidActions(actions.slice(), this.actions.timeouts.actionAttack);	
		return false;
	}

	// Отправляет защищающемуся возможные ходы
	DEFEND(player){

		// В данный момент происходит переход между стадиями хода
		// Откомментировать по необходимости
		// let turnStage = this.turnStages.next;
		let lastTurnStage = this.turnStages.current;

		// Находим карту, которую нужно отбивать
		let defenseFields = this.cards.defenseFields;

		// Если ни одной карты не найдено, значит игрок успешно отбился, можно завершать ход
		if(!defenseFields.length){
			this.log.info(player.name, 'successfully defended');
			this.turnStages.setNext('END');
			return true;
		}

		let actions = [];
		let pid = player.id;
		let hand = this.hands[pid];	

		this.cards.getDefenseActions(hand, actions, defenseFields);

		if(this.canTransfer){
			this.cards.getTransferActions(hand, actions, defenseFields);
		}

		// Добавляем возможность взять карты
		let action = {
			type: 'TAKE'
		};
		actions.push(action);

		this.actions.valid = actions;

		// Выставляем новую стадию хода в зависимости от предыдущей
		switch(lastTurnStage){

		case 'INITIAL_ATTACK':
			this.turnStages.setNext('REPEATING_ATTACK');
			break;

		case 'REPEATING_ATTACK':
			this.turnStages.setNext('REPEATING_ATTACK');
			break;

		case 'SUPPORT':
			this.turnStages.setNext('ATTACK');
			break;

		case 'ATTACK':
			this.turnStages.setNext('SUPPORT');
			break;		

		// Debug
		default:
			this.log.error('Invalid turnStage', lastTurnStage);
			break;
		}

		this.waitForResponse(this.actions.timeouts.actionDefend, [player]);
		player.recieveValidActions(actions.slice(), this.actions.timeouts.actionDefend);	

		return false;
	}

	// Игрок берет карты со стола
	TAKE(player){

		// В данный момент происходит переход между стадиями хода
		// Откомментировать по необходимости
		// let turnStage = this.turnStages.next;
		// let lastTurnStage = this.turnStages.current;

		let action = this.cards.getDiscardAction(player);

		this.actions.takeOccurred = true;
		this.turnStages.setNext('END');

		this.waitForResponse(this.actions.timeouts.take, this.players);
		this.players.takeNotify(action);
		return false;
	}
}

module.exports = DurakDirectives;