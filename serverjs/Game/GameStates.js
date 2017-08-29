/*
* Класс содержит действия, выполняемые при различных состояниях игры
*/
'use strict';

class GameStates{
	constructor(game){
		this.game = game;
		this.current = null;
	}

	// Проверяем, нужно ли перезапускать игру
	NOT_STARTED(){
		const game = this.game;
		// Проверяем результаты голосования
		let voteResults = game.actions.checkStored();

		// Если голосов хватает, запускаем игру
		if(voteResults.successful){
			game.rematch(voteResults);
		}
		// Иначе, не запускаем игру
		else{
			game.backToQueue(voteResults);	
		}
		return false;
	}

	// Сообщаем игрокам о колоде и друг друге
	SHOULD_START(){		
		const game = this.game;
		this.current = 'STARTING';
		game.waitForResponse(game.actions.timeouts.gameStart, game.players);
		game.players.gameStateNotify(game.players);
		return false;
	}

	// Раздаем карты в начале игры
	STARTING(){
		const game = this.game;
		this.current = 'STARTED';
		let dealsOut = game.cards.dealStartingHands();

		if(dealsOut && dealsOut.length){
			game.waitForResponse(game.actions.timeouts.deal, game.players);
			game.players.dealNotify(dealsOut);
		}
		else{
			game.log.error(new Error('Couldn\'t deal at the start of the game'));
		}
		return false;

	}

	STARTED(){
		return game.doTurn();
	}
}

module.exports = GameStates;