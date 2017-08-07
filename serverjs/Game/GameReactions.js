/*
 * Класс содержит действия, выполняемые игрой в ответ на действия игроков
 * Выполняются в контексте игры 
 */

'use strict';

class GameReactions{

	// Игрок походил
	ATTACK(player, action){

		let cardsById = this.cards.byId;
		let tableFields = this.table.byKey('id');
		let ci, card;

		let str;
		if(this.turnStages.current == 'FOLLOWUP')
			str = 'follows up';
		else if(this.turnStages.current == 'DEFENSE')
			str = 'transfers';
		else
			str = 'attacks';

		this.log.info(player.name,  str);

		card = cardsById[action.cid];
		ci = this.hands[player.id].indexOf(card);

		if(action.linkedField)
			action.field = action.linkedField;

		let field = action.field;

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

		// Если игрок клал карту в догонку, даем ему воможность положить еще карту
		if(this.turnStages.current == 'FOLLOWUP'){
			this.turnStages.setNext('FOLLOWUP');
		}
		else if(this.turnStages.current == 'DEFENSE'){
			this.players.shiftAttacker();			
			this.turnStages.setNext('DEFENSE');	
		}
		else{
			this.skipCounter = 0;	// Если же это просто ход, сбрасываем счетчик пропущенных ходов
		}

		return action;

	}

	// Игрок отбивается
	DEFENSE(player, action){

		let cardsById = this.cards.byId;
		let tableFields = this.table.byKey('id');
		let ci, card;

		this.log.info(player.name, 'defends');

		card = cardsById[action.cid];
		ci = this.hands[player.id].indexOf(card);

		this.actions.logAction(card, action.type, card.field, action.field );

		// Перемещаем карту на стол и убираем карту из рукиs
		card.field = action.field;
		this.hands[player.id].splice(ci, 1);
		tableFields[action.field].defense = card;

		// Добавляем информацию о карте в действие
		action.value = card.value;
		action.suit = card.suit;

		if(this.cards.defenseFields.length){
			this.turnStages.setNext('DEFENSE');
		}

		return action;
	}

	// Ходящий игрок пропустил ход
	SKIP(player, action){

		let activePlayers = this.players.active;
		let attackers = this.players.attackers;

		this.log.info(player.name, 'skips turn');

		// Debug
		if(activePlayers.length > 2 && !attackers[1]){
			this.log.error('More than 2 players but no ally assigned');
		}

		// Если есть помогающий игрок
		if(attackers[1]){
			switch(this.turnStages.current){

			// Если игра в режиме докладывания карт в догонку и только ходящий игрок походил,
			// даем возможность другому игроку доложить карты
			case 'FOLLOWUP':
				if(!this.skipCounter){
					this.skipCounter++;
					this.turnStages.setNext('FOLLOWUP');
				}
				break;

			// Атакующий не доложил карту, переходим к помогающему
			case 'REPEATING_ATTACK':
				this.skipCounter++;
				this.turnStages.setNext('SUPPORT');
				break;

			default:
				// Если кто-то из игроков еще не походил, даем ему возможность 
				this.skipCounter++;
				if(this.skipCounter < 2){

					if(this.turnStages.current == 'SUPPORT'){
						this.turnStages.setNext('ATTACK');
					}
					else if(this.turnStages.current == 'ATTACK'){
						this.turnStages.setNext('SUPPORT');
					}
					else{
						this.log.error('Invalid action', action.type);
					}

				}
				break;
			}
		}
		return action;
	}

	// Защищающийся берет карты
	TAKE(player, action){
		this.log.info(player.name, "takes");
		this.skipCounter = 0;
		this.turnStages.setNext('FOLLOWUP');
		return action;
	}
}

module.exports = GameReactions;