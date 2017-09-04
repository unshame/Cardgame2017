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
		let numFilledTables = this.table.length - this.cards.emptyTables.length;

		if(
			!this.cards.firstEmptyTable || 
			(turnStage != 'FOLLOWUP' || this.limitFollowup) && (defHand.length === 0 || turnStage == 'FOLLOWUP' && numFilledTables >= defHand.length)
		){
			if(!this.cards.firstEmptyTable){
				this.log.info('Field is full');
			}
			else if(turnStage == 'FOLLOWUP'){				
				this.log.info('Defender has as many cards as he takes');
			}
			else{
				this.log.info('Defender has no cards');
			}

			this.turnStages.setNext('DEFENSE');
			return true;
		}
		
		if(!hand.length){
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
				type: 'PASS'
			};
			actions.push(action);	
		}
		
		// Меняем стадию на стадию защиты
		this.turnStages.setNext('DEFENSE');

		this.log.silly(actions);

		this.actions.valid[pid] = actions;
		let deadline = this.waitForResponse(this.actions.timeouts.actionAttack, [player]);
		this.players.validActionsNotify(deadline);	
		return false;
	}

	// Отправляет защищающемуся возможные ходы
	DEFEND(player){

		// В данный момент происходит переход между стадиями хода
		// Откомментировать по необходимости
		// let turnStage = this.turnStages.next;
		let lastTurnStage = this.turnStages.current;

		// Находим карту, которую нужно отбивать
		let defenseTables = this.cards.defenseTables;

		// Если ни одной карты не найдено, значит игрок успешно отбился, можно завершать ход
		if(!defenseTables.length){
			this.log.info(player.name, 'successfully defended');
			this.turnStages.setNext('END');
			return true;
		}

		let actions = [];
		let pid = player.id;
		let hand = this.hands[pid];	

		this.cards.getDefenseActions(hand, actions, defenseTables);

		if(this.canTransfer){
			this.cards.getTransferActions(hand, actions, defenseTables);
		}

		// Добавляем возможность взять карты
		let action = {
			type: 'TAKE'
		};
		actions.push(action);

		this.actions.valid[pid] = actions;

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
			this.log.error(new Error(`Invalid turnStage ${lastTurnStage}`));
			break;
		}

		let deadline = this.waitForResponse(this.actions.timeouts.actionDefend, [player]);
		this.players.validActionsNotify(deadline);	

		return false;
	}
}

module.exports = DurakDirectives;