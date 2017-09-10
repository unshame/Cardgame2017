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

		// Сдвигаем атакующего, если это был перевод и даем ему защищаться\переводить
		if(this.turnStages.current == 'DEFENSE_TRANSFER'){
			//this.players.notify({type: 'EVENT', message: 'transfered', pid: player.id, showForSelf: false, channel: 'extra'});
			this.players.shiftAttacker();

			// Перезапоминаем кол-ва карт в руках
			this.cards.rememberHandLengths();

			// Даем следующему игроку переводить, если есть место на столе
			// (при 5-6 местах и 4-х мастях оно всегда будет)
			if(this.cards.firstEmptyTable){ 
				this.turnStages.setNext('DEFENSE_TRANSFER');
			}
			else{
			    this.turnStages.setNext('DEFENSE');     
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

		// Перемещаем карту на стол и убираем карту из руки
		card.field = action.field;
		this.hands[player.id].splice(ci, 1);
		tableFields[action.field].defense = card;

		// Добавляем информацию о карте в действие
		action.value = card.value;
		action.suit = card.suit;

		// Запоминаем, что защита произошла, если игроки атакуют по одному
		// или даем всем атаковать, если игроки атакуют сразу
		if(this.turnStages.current == 'ATTACK_DEFENSE'){
			if(this.freeForAll){
				this.players.set('passed', false, this.players.attackers);
			}
			else{
				this.actions.defenseOccurred = true;
			}
		}

		return action;
	}

	// Ходящий игрок пропустил ход
	PASS(player, action){

		this.log.info(player.name, 'passes');

		// Если произошла защита и игроки атакуют по одному,
		// при этом защищающийся не берет карты,
		// проверяем, является ли текущий игрок последним пасующим,
		// и, если да, то даем всем игрокам атаковать снова
		if(this.actions.defenseOccurred && this.players.getLastActiveAttacker() == player){			
			this.players.set('passed', false, this.players.attackers);
		}

		// Устанавливаем, что игрок спасовал
		player.statuses.passed = true;

		// Убираем флаг того, что произошла защита
		this.actions.defenseOccurred = false;

		return action;
	}

	// Защищающийся берет карты
	TAKE(player, action){
		this.log.info(player.name, "takes");

		// Запоминаем, что игрок взял
		this.actions.takeOccurred = true;

		//TODO: подумать, нужно ли давать спасовавшим подкидывать
		/*
		if(this.freeForAll){
			this.players.set('passed', false, this.players.attackers);
		}
		else{
			this.actions.defenseOccurred = true;
		}
		*/
		
		this.turnStages.setNext('FOLLOWUP');

		return action;
	}
}

module.exports = DurakReactions;