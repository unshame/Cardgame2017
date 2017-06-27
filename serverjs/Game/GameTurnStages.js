/*
 * Класс содержит действия, выполняемые в различные стадии хода
 * Выполняются в контексте игры 
 */
'use strict';

class GameTurnStages{
	constructor(){
		this.current = null;
		this.next = null;
	}

	//Начинаем ход
	DEFAULT(){
		this.startTurn();
		//Turn stage: INITIAL_ATTACK
	}

	//Первая атака
	INITIAL_ATTACK(){
		this.let('ATTACK', this.players.attacker);
		//Turn stage: DEFENSE
	}

	//Атакующий игрок атакует повторно
	REPEATING_ATTACK(){
		this.let('ATTACK', this.players.attacker);
		//Turn stage: DEFENSE
	}

	//Атакующий игрок атакует после помогающего игрока
	ATTACK(){
		this.let('ATTACK', this.players.attacker);
		//Turn stage: DEFENSE
	}

	//Помогающий игрок атакует
	SUPPORT(){

		//Debug
		if(!this.players.ally)
			this.log.error('No ally assigned, but turn stage is SUPPORT');

		this.let('ATTACK', this.players.ally || this.players.attacker);
		//Turn stage: DEFENSE
	}

	//Подкладывание карт в догонку
	FOLLOWUP(){
		this.let('ATTACK', !this.skipCounter ? this.players.attacker : (this.players.ally || this.players.attacker));
		//Turn stage: DEFENSE
	}

	//Защищающийся игрок ходит
	DEFENSE(){

		//Если мы были в стадии подкидывания в догонку, передаем все карты со стола
		//защищающемуся и сообщаем всем игрокам об этом
		if(this.turnStages.current == 'FOLLOWUP')
			this.let('TAKE', this.players.defender);
		//Иначе даем защищаться
		else
			this.let('DEFEND', this.players.defender);
		//Turn stage: REPEATING_ATTACK, ATTACK, SUPPORT, END
	}

	//Начало конца хода, убираем карты со стола
	END(){
		this.setNextTurnStage('END_DEAL');
		let discarded = this.cards.discard();
		if(discarded){
			this.waitForResponse(this.timeouts.discard, this.players);
			this.players.completeActionNotify(discarded);
		}
		else{
			this.continue();
		}
	}

	//Раздаем карты после окончания хода
	END_DEAL(){
		this.setNextTurnStage('ENDED');
		let dealsOut = this.cards.dealTillFullHand();
		if(dealsOut.length){
			this.waitForResponse(this.timeouts.deal, this.players);
			this.players.dealNotify(dealsOut);
		}
		else{
			this.continue();
		}
	}

	//Конец конца хода
	//находим следующего игрока, ресетим ход и проверяем, закончилась ли игра
	ENDED(){

		//Если защищающийся брал, сдвигаем айди, по которому будет искаться атакующий
		if(this.playerTook)
			this.players.attacker = this.players.defender;

		let currentAttackerIndex = this.players.findInactive();
		this.resetTurn();
		//Turn stage: null

		if(!this.deck.length && this.players.notEnoughActive()){
			this.end();
			return;
		}

		this.players.findToGoNext(currentAttackerIndex);
		this.continue();
	}
}

module.exports = GameTurnStages;