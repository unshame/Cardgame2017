/*
* Класс содержит действия, выполняемые игрой в ответ на действия игроков
* Выполняются в контексте игры 
*/

'use strict';

class DurakReactions{

	// Игрок походил
	ATTACK(player, action){

		let str;
		switch(this.turnStages.current){
			case 'FOLLOWUP':
			str = 'follows up';
			break;

			case 'DEFENSE_TRANSFER':
			str = 'transfers';
			break;

			default:
			str = 'attacks';
		}

		this.log.info(player.name,  str);

		let tableFields = this.table.byKey('id');
		let card = this.cards.byId[action.cid];
		let ci = this.hands[player.id].indexOf(card);
		let field = this.cards.firstEmptyTable.id;

		this.actions.logAction(card, action.type, card.field, field );

		// Перемещаем карту на стол и убираем карту из руки
		card.field = field;
		this.hands[player.id].splice(ci, 1);
		tableFields[field].attack = card;

		// Добавляем информацию о карте в действие
		action.value = card.value;
		action.suit = card.suit;

		// Увеличиваем кол-во занятых мест на столе
		this.table.usedFields++;

		if(this.turnStages.current == 'DEFENSE_TRANSFER'){
			this.players.notify({type: 'EVENT', message: 'transfered', pid: player.id, showForSelf: false, channel: 'extra'});
			this.players.shiftAttacker();

			if(!this.cards.firstEmptyTable){
				this.turnStages.setNext('ATTACK_DEFENSE');	
			}
		}

		return action;
	}

	// Игрок отбивается
	DEFENSE(player, action){

		this.log.info(player.name, 'defends');

		let cardsById = this.cards.byId;
		let tableFields = this.table.byKey('id');
		let card = cardsById[action.cid];
		let ci = this.hands[player.id].indexOf(card);

		this.actions.logAction(card, action.type, card.field, action.field );

		// Перемещаем карту на стол и убираем карту из рукиs
		card.field = action.field;
		this.hands[player.id].splice(ci, 1);
		tableFields[action.field].defense = card;

		// Добавляем информацию о карте в действие
		action.value = card.value;
		action.suit = card.suit;

		if(this.freeForAll){
			this.players.set('passed', false, this.players.attackers);
		}else{
			this.defenseOccured = true;
		}

		if(this.turnStages.next != 'ATTACK_DEFENSE'){
			this.turnStages.setNext('ATTACK_DEFENSE');
		}

		return action;
	}

	// Ходящий игрок пропустил ход
	PASS(player, action){

		this.log.info(player.name, 'passes');

		if(this.turnStages.current != 'FOLLOWUP' && this.defenseOccured){
			let attackers = this.players.attackers;
			let lastActiveAttacker = null;
			attackers.forEach((attacker) => {
				if(!attacker.statuses.passed){
					lastActiveAttacker = attacker;
				}
			});
			if(player == lastActiveAttacker){
				this.players.set('passed', false, attackers);
			}
		}

		player.statuses.passed = true;

		this.defenseOccured = false;

		return action;
	}

	// Защищающийся берет карты
	TAKE(player, action){
		this.log.info(player.name, "takes");

		this.actions.takeOccurred = true;

		this.turnStages.setNext('FOLLOWUP');

		return action;
	}
}

module.exports = DurakReactions;