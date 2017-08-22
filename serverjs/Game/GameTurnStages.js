/*
 * Класс содержит действия, выполняемые в различные стадии хода
 * Выполняется в своем собственном контексте.
 */
'use strict';

class GameTurnStages{
	constructor(game){
		this.game = game;

		this.current = null;
		this.next = null;
	}

	reset(){
		this.current = null;
		this.next = 'DEFAULT';
	}

	// Устанавливает следующую фазу хода и запоминает текущую
	setNext(stage){
		this.current = this.next;
		this.next = stage;
		this.game.log.debug(stage);
	}

	// Действия
	DEFAULT(){
		throw new Error('Must be implemented in the subclass');
	}
}

module.exports = GameTurnStages;