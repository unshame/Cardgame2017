'use strict';

const GameTurnStages = reqfromroot('Game/GameTurnStages');

class DurakTurnStages extends GameTurnStages{

	/**
	* Класс содержит действия, выполняемые в различные стадии хода.  
	* Выполняется в своем собственном контексте.
	* Визуальное представление хода:  
	* ![DurakTurnStages](https://i.imgur.com/aSTuvja.png)
	*/
	constructor(game){
		super(game);
	}

	// Действия

	// Начинаем ход
	DEFAULT(){
		this.game.startTurn();
		// Turn stage: INITIAL_ATTACK
		return true;
	}

	INITIAL_ATTACK(){
		return this.game.let('ATTACK', this.game.players.attackers[0]);
		// Turn stage: DEFENSE_TRANSFER, ATTACK_DEFENSE
	}

	DEFENSE_TRANSFER(){
		return this.game.let('DEFEND', this.game.players.defender, this.game.canTransfer);
		// Turn stage: DEFENSE_TRANSFER, ATTACK_DEFENSE, FOLLOWUP
	}

	ATTACK_DEFENSE(){
		return this.game.let('ATTACK_DEFEND', this.game.players.attackers, this.game.players.defender);
		// Turn stage: ATTACK_DEFENSE, DEFENSE, FOLLOWUP
	}

	DEFENSE(){
		return this.game.let('DEFEND', this.game.players.defender);
		// Turn stage: DEFENSE, FOLLOWUP
	}

	// Подкладывание карт в догонку
	FOLLOWUP(){
		return this.game.let('FOLLOWUP', this.game.players.attackers);
		// Turn stage: FOLLOWUP, END
	}

	TAKE(){
		const game = this.game;

		let action = game.cards.take(game.players.defender);

		game.turnStages.setNext('END');

		game.waitForResponse(game.actions.timeouts.take, game.players);
		game.players.takeNotify(action);
		return false;
		// Turn stage: END
	}

	// Начало конца хода, убираем карты со стола
	END(){
		const game = this.game;

		let discarded = game.cards.discard();

		this.setNext('END_DEAL');

		if(discarded){
			game.waitForResponse(game.actions.timeouts.discard, game.players);
			game.players.completeActionNotify(discarded);
			return false;
		}
		return true;
		// Turn stage: END_DEAL
	}

	// Раздаем карты после окончания хода
	END_DEAL(){
		const game = this.game;

		let dealsOut = game.cards.dealTillFullHand();
		
		this.setNext('ENDED');

		if(dealsOut.length){
			game.waitForResponse(game.actions.timeouts.deal, game.players);
			game.players.dealNotify(dealsOut);
			return false;
		}
		return true;
		// Turn stage: ENDED
	}

	// Конец конца хода
	// находим следующего игрока, ресетим ход и проверяем, закончилась ли игра
	ENDED(){

		const game = this.game;

		// Если защищающийся брал, сдвигаем айди, по которому будет искаться атакующий
		if(game.actions.takeOccurred){
			game.players.attackers = [game.players.defender];
		}

		let currentAttackerIndex = game.players.findInactive();
		game.resetTurn();
		// Turn stage: null

		if(!game.deck.length && game.players.notEnoughActive){
			game.players.findLoser();
			game.end();
			return false;
		}

		game.players.findToGoNext(currentAttackerIndex);
		return true;
	}
}

module.exports = DurakTurnStages;