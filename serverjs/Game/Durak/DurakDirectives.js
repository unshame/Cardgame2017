/*
* Класс содержит методы, позволяющие игрокам выполнить действия
* Во время их выполнения происходит переход между стадиями хода
* Выполняются в контексте игры
* В данный момент происходит переход между стадиями хода
*/
'use strict';

class DurakDirectives{

	// Отправляет атакующему возможные ходы
	ATTACK(attacker){

		let pid = attacker.id;
		let hand = this.hands[pid];

		let actions = [];

		this.cards.getAttackActions(hand, actions);

		if(!hand.length){
			throw new Error(`Player ${attacker.id} has no actions`);
		}
		
		// Меняем стадию на стадию защиты
		if(this.canTransfer){
			this.turnStages.setNext('DEFENSE_TRANSFER');
		}
		else{
			this.turnStages.setNext('ATTACK_DEFENSE');
		}

		this.actions.valid[pid] = actions;
		let deadline = this.waitForResponse(this.actions.timeouts.actionAttack, [attacker]);
		this.players.validActionsNotify(deadline);	
		return false;
	}

	ATTACK_DEFEND(attackers, defender){
		let defHand = this.hands[defender.id];
		if(!defHand.length){
			this.log.info('Defender has no cards');
			this.turnStages.setNext('END');
			return true;
		}

		let defenseTables = this.cards.defenseTables;
		let firstEmptyTable = this.cards.firstEmptyTable;

		if(!firstEmptyTable || defenseTables.length >= defHand.length){
			if(!firstEmptyTable){
				this.log.info('Field is full');
			}
			else{				
				this.log.info('Defender has as many cards as he needs to beat');
			}

			this.turnStages.setNext('DEFENSE');
			return true;
		}

		// Даем всем игрокам атаковать, если защищающийся походил и у последнего атакующего нет карт
		if(this.actions.defenseOccured){
			let lastActiveAttacker = this.players.getLastActiveAttacker(attackers);
			let hand = this.hands[lastActiveAttacker.id];
			if(!hand.length){
				this.players.set('passed', false, attackers);
				this.actions.defenseOccured = false;
			}
		}

		// Действия атакующих
		let workingPlayers = this.cards.getAttackActionsForPlayers(attackers, this.actions.valid, defenseTables, this.freeForAll);

		if(!workingPlayers.length){
			this.log.info('Attackers have no cards');
			this.turnStages.setNext('DEFENSE');
			return true;
		}

		// Действия защищающихся
		workingPlayers.push(defender);
		let actions = this.actions.valid[defender.id];
		this.cards.getDefenseActions(defHand, actions, defenseTables);
		if(defenseTables.length){
			let action = {
				type: 'TAKE'
			};
			actions.push(action);
		}

		this.turnStages.setNext('ATTACK_DEFENSE');

		let deadline = this.waitForResponse(this.actions.timeouts.actionAttack, workingPlayers);
		this.players.validActionsNotify(deadline);	
		return false;
	}

	// Отправляет атакующему возможные ходы
	FOLLOWUP(attackers){

		let defHand = this.hands[this.players.defender.id];
		let firstEmptyTable = this.cards.firstEmptyTable;

		if(!firstEmptyTable || this.limitFollowup && this.table.usedFields >= defHand.defenseStartLength){
			if(!firstEmptyTable){
				this.log.info('Field is full');
			}
			else{				
				this.log.info('Defender has as many cards as he takes');
			}

			this.turnStages.setNext('TAKE');
			return true;
		}

		let workingPlayers = this.cards.getAttackActionsForPlayers(attackers, this.actions.valid, [], this.freeForAll);

		if(!workingPlayers.length){
			this.log.info('Attackers passed or have no cards');
			this.turnStages.setNext('TAKE');
			return true;
		}

		this.turnStages.setNext('FOLLOWUP');

		let deadline = this.waitForResponse(this.actions.timeouts.actionAttack, workingPlayers);
		this.players.validActionsNotify(deadline);	
		return false;
	}

	// Отправляет защищающемуся возможные ходы
	DEFEND(defender, canTransfer){

		// Находим карту, которую нужно отбивать
		let defenseTables = this.cards.defenseTables;

		// Если ни одной карты не найдено, значит игрок успешно отбился, можно завершать ход
		if(!defenseTables.length){
			this.log.info('Defender successfully defended');
			this.turnStages.setNext('END');
			return true;
		}

		let actions = [];
		let pid = defender.id;
		let hand = this.hands[pid];	

		this.cards.getDefenseActions(hand, actions, defenseTables);

		if(canTransfer){
			this.cards.getTransferActions(hand, actions, defenseTables);
		}

		// Добавляем возможность взять карты
		let action = {
			type: 'TAKE'
		};
		actions.push(action);

		this.actions.valid[pid] = actions;

		this.turnStages.setNext(canTransfer ? 'ATTACK_DEFENSE' : 'DEFENSE');

		let deadline = this.waitForResponse(this.actions.timeouts.actionDefend, [defender]);
		this.players.validActionsNotify(deadline);	

		return false;
	}
}

module.exports = DurakDirectives;