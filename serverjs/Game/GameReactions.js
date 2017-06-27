/*
 * Класс содержит действия, выполняемые игрой в ответ на действия игроков
 * Выполняются в контексте игры 
 */

'use strict';

const 
	utils = require('../utils');

class GameReactions{

	//Игрок походил
	ATTACK(player, action){

		let activePlayers = this.players.active;
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

		this.logAction(card, action.type, card.field, field );

		//Перемещаем карту на стол и убираем карту из руки
		card.field = field;
		this.hands[player.id].splice(ci, 1);
		tableFields[field].attack = card;

		//Добавляем информацию о карте в действие
		action.value = card.value;
		action.suit = card.suit;

		//Увеличиваем кол-во занятых мест на столе
		this.table.usedFields++;

		//Если игрок клал карту в догонку, даем ему воможность положить еще карту
		if(this.turnStages.current == 'FOLLOWUP'){
			this.setNextTurnStage('FOLLOWUP');
		}
		else if(this.turnStages.current == 'DEFENSE'){
			this.players.setOriginalAttackers([this.players.attacker]);
			let currentAttackerIndex = activePlayers.indexOf(this.players.attacker);
			this.players.findToGoNext(currentAttackerIndex);
			this.setNextTurnStage('DEFENSE');	
		}
		else{
			this.skipCounter = 0;	//Если же это просто ход, сбрасываем счетчик пропущенных ходов
		}

		return action;

	}

	//Игрок отбивается
	DEFENSE(player, action){

		let cardsById = this.cards.byId;
		let tableFields = this.table.byKey('id');
		let ci, card;

		this.log.info(player.name, 'defends');

		card = cardsById[action.cid];
		ci = this.hands[player.id].indexOf(card);

		this.logAction(card, action.type, card.field, action.field );

		//Перемещаем карту на стол и убираем карту из руки
		card.field = action.field;
		this.hands[player.id].splice(ci, 1);
		tableFields[action.field].defense = card;

		//Добавляем информацию о карте в действие
		action.value = card.value;
		action.suit = card.suit;

		for(let di = 0; di < this.table.length; di++){
			let tableField = this.table[di];
			if(tableField.attack && !tableField.defense){
				this.setNextTurnStage('DEFENSE');
				break;
			}
		}

		return action;
	}

	//Ходящий игрок пропустил ход
	SKIP(player, action){

		let activePlayers = this.players.active;

		this.log.info(player.name, 'skips turn');

		//Debug
		if(activePlayers.length > 2 && !this.players.ally){
			this.log.error('More than 2 players but no ally assigned');
		}

		//Если есть помогающий игрок
		if(this.players.ally){
			switch(this.turnStages.current){

				//Если игра в режиме докладывания карт в догонку и только ходящий игрок походил,
				//даем возможность другому игроку доложить карты
				case 'FOLLOWUP':
					if(!this.skipCounter){
						this.skipCounter++;
						this.setNextTurnStage('FOLLOWUP');
					}
					break;

				//Атакующий не доложил карту, переходим к помогающему
				case 'REPEATING_ATTACK':
					this.skipCounter++;
					this.setNextTurnStage('SUPPORT');
					break;

				default:
					//Если кто-то из игроков еще не походил, даем ему возможность 
					this.skipCounter++;
					if(this.skipCounter < 2){

						if(this.turnStages.current == 'SUPPORT')
							this.setNextTurnStage('ATTACK');

						else if(this.turnStages.current == 'ATTACK')
							this.setNextTurnStage('SUPPORT');

						//Debug
						else
							this.log.error('Invalid action', action.type);

					}
					break;
			}
		}
		return action;
	}

	//Защищающийся берет карты
	TAKE(player, action){
		this.log.info(player.name, "takes");
		this.skipCounter = 0;
		this.setNextTurnStage('FOLLOWUP');
		return action;
	}
}

module.exports = GameReactions;