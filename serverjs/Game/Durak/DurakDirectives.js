/*
* Класс содержит методы, позволяющие игрокам выполнить действия
* Во время их выполнения происходит переход между стадиями хода
* Выполняются в контексте игры
* В данный момент происходит переход между стадиями хода
*/
'use strict';

class DurakDirectives{

	// Отправляет атакующему возможные ходы в стадии начальной атаки
	INITIAL_ATTACK(attacker){

		let pid = attacker.id;
		let hand = this.hands[pid];

		if(hand.length === 0){
			throw new Error(`Player ${attacker.id} has no actions`);
		}

		let actions = [];

		this.cards.getAttackActions(hand, actions);
		this.actions.valid[pid] = actions;
		
		// Меняем стадию
		if(this.canTransfer){
			this.turnStages.setNext('ATTACK');
		}
		else{
			this.turnStages.setNext('ATTACK_DEFENSE');
		}

		let deadline = this.waitForResponse(this.actions.timeouts.actionAttack, [attacker]);
		this.players.validActionsNotify(deadline);	
		return false;
	}

	// Дает первому атакующему подкинуть карты перед тем, как дать защищающемуся перевести
	ATTACK(attacker){

		let defHand = this.hands[this.players.defender.id];
		let defenseTables = this.cards.defenseTables;
		let firstEmptyTable = this.cards.firstEmptyTable;

		if(!firstEmptyTable || defenseTables.length >= defHand.length){
			if(!firstEmptyTable){
				this.log.info('Field is full');
			}
			else{				
				this.log.info('Defender has as many cards as he needs to beat');
			}

			this.turnStages.setNext('DEFENSE_TRANSFER');
			return true;
		}

		let pid = attacker.id;
		let hand = this.hands[pid];

		let actions = [];

		this.cards.getAttackActions(hand, actions);
		actions.push({
			type: 'PASS'
		});
		this.actions.valid[pid] = actions;

		this.turnStages.setNext('ATTACK');
		
		let deadline = this.waitForResponse(this.actions.timeouts.actionAttack, [attacker]);
		this.players.validActionsNotify(deadline);	
		return false;
	}

	// Отправляет атакующим и защищающемуся возможные ходы
	ATTACK_DEFEND(attackers, defender){
		let defHand = this.hands[defender.id];
		if(!defHand.length){
			this.log.info('Defender has no cards');
			this.turnStages.setNext('END');
			return true;
		}

		let defenseTables = this.cards.defenseTables;
		let firstEmptyTable = this.cards.firstEmptyTable;

		// Переходим в стадию защиты, если поле заполнено
		// или у защищающегося в руке столько же карт, сколько ему нужно побить
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
		if(this.actions.defenseOccurred){
			let lastActiveAttacker = this.players.getLastActiveAttacker(attackers);
			let hand = this.hands[lastActiveAttacker.id];
			if(!hand.length){
				this.players.set('passed', false, attackers);
				this.actions.defenseOccurred = false;
			}
		}

		// Действия атакующих
		let workingPlayers = this.cards.getAttackActionsForPlayers(attackers, this.actions.valid, defenseTables, this.freeForAll);

		if(!workingPlayers.length){
			this.log.info('Attackers passed or have no cards');
			this.turnStages.setNext('DEFENSE');
			return true;
		}

		// Действия защищающихся
		workingPlayers.push(defender);
		let actions = this.actions.valid[defender.id];
		this.cards.getDefenseActions(defHand, actions, defenseTables);
		if(defenseTables.length){
			actions.push({
				type: 'TAKE'
			});
		}

		this.turnStages.setNext('ATTACK_DEFENSE');

		let deadline = this.waitForResponse(this.actions.timeouts.actionAttack, workingPlayers);
		this.players.validActionsNotify(deadline);	
		return false;
	}

	// Отправляет атакующим возможные ходы в стадии подброса
	FOLLOWUP(attackers){

		let defHand = this.hands[this.players.defender.id];
		let firstEmptyTable = this.cards.firstEmptyTable;

		// Даем защищающемуся взять, если стол заполнен или на столе столько же карт,
		// как было у защищающегося в начале хода (и подкиджывание ограничено)
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

		// Действия атакующих
		let workingPlayers = this.cards.getAttackActionsForPlayers(attackers, this.actions.valid, [], this.freeForAll);

		// Все игроки спасовали или у них больше нет карт, даем защищающемуся взять
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

	// Отправляет защищающемуся возможные ходы после первой атаки (если можно переводить) 
	// и когда атакующие не могут больше ходить
	DEFEND(defender, canTransfer){

		let defenseTables = this.cards.defenseTables;

		// Если больше нечего отбивать, завершаем ход
		if(!defenseTables.length){
			this.log.info('Defender successfully defended');
			this.turnStages.setNext('END');
			return true;
		}

		let actions = [];
		let pid = defender.id;
		let hand = this.hands[pid];	

		// Действия защищающегося
		this.cards.getDefenseActions(hand, actions, defenseTables);

		// Действия перевода
		if(canTransfer){
			this.cards.getTransferActions(hand, actions, defenseTables);
		}

		// Добавляем возможность взять карты
		actions.push({
			type: 'TAKE'
		});

		this.actions.valid[pid] = actions;

		this.turnStages.setNext(canTransfer ? 'ATTACK_DEFENSE' : 'DEFENSE');

		let deadline = this.waitForResponse(this.actions.timeouts.actionDefend, [defender]);
		this.players.validActionsNotify(deadline);	

		return false;
	}
}

module.exports = DurakDirectives;