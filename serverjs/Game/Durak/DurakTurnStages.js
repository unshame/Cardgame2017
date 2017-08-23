/*
 * Класс содержит действия, выполняемые в различные стадии хода
 * Выполняется в своем собственном контексте.
 */
'use strict';

const GameTurnStages = reqfromroot('Game/GameTurnStages');

class DurakTurnStages extends GameTurnStages{

	// INITIAL_ATTACK -> DEFENSE -> REPEATING_ATTACK -> DEFENSE -> REPEATING_ATTACK -> DEFENSE -> ... ->
	// SUPPORT -> DEFENSE -> ATTACK -> DEFENSE -> ... -> FOLLOWUP -> DEFENSE -> END -> END_DEAL -> ENDED
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

	// Первая атака
	INITIAL_ATTACK(){
		const game = this.game;
		return game.let('ATTACK', game.players.attackers[0]);
		// Turn stage: DEFENSE
	}

	// Атакующий игрок атакует повторно
	REPEATING_ATTACK(){
		const game = this.game;
		return game.let('ATTACK', game.players.attackers[0]);
		// Turn stage: DEFENSE
	}

	// Атакующий игрок атакует после помогающего игрока
	ATTACK(){
		const game = this.game;
		return game.let('ATTACK', game.players.attackers[0]);
		// Turn stage: DEFENSE
	}

	// Помогающий игрок атакует
	SUPPORT(){

		const game = this.game;

		let attackers = game.players.attackers;

		// Debug
		if(!attackers[1]){
			game.log.error(new Error('No ally assigned, but turn stage is SUPPORT'));
		}

		return game.let('ATTACK', attackers[1] || attackers[0]);
		// Turn stage: DEFENSE
	}

	// Подкладывание карт в догонку
	FOLLOWUP(){
		const game = this.game;

		let attackers = game.players.attackers;
		return game.let('ATTACK', !game.skipCounter ? attackers[0] : (attackers[1] || attackers[0]));
		// Turn stage: DEFENSE
	}

	// Защищающийся игрок ходит
	DEFENSE(){
		const game = this.game;

		// Если мы были в стадии подкидывания в догонку, передаем все карты со стола
		// защищающемуся и сообщаем всем игрокам об этом
		if(this.current == 'FOLLOWUP'){
			return game.let('TAKE', game.players.defender);
		}
		// Иначе даем защищаться
		else{
			return game.let('DEFEND', game.players.defender);
		}
		// Turn stage: REPEATING_ATTACK, ATTACK, SUPPORT, END
	}

	// Начало конца хода, убираем карты со стола
	END(){
		const game = this.game;

		this.setNext('END_DEAL');
		let discarded = game.cards.discard();
		if(discarded){
			game.waitForResponse(game.actions.timeouts.discard, game.players);
			game.players.completeActionNotify(discarded);
			return false;
		}
		return true;
	}

	// Раздаем карты после окончания хода
	END_DEAL(){
		const game = this.game;

		this.setNext('ENDED');
		let dealsOut = game.cards.dealTillFullHand();
		if(dealsOut.length){
			game.waitForResponse(game.actions.timeouts.deal, game.players);
			game.players.dealNotify(dealsOut);
			return false;
		}
		return true;
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