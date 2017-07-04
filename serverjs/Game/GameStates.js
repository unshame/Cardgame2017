/*
 * Класс содержит действия, выполняемые при различных состояниях игры
 */
'use strict';

class GameStates{
	constructor(game){
		this.game = game;
		this.current = null;
	}

	//Проверяем, нужно ли перезапускать игру
	NOT_STARTED(){
		const game = this.game;
		//Проверяем результаты голосования
		let voteResults = game.actions.checkStored();

		//Если голосов хватает, запускаем игру
		if(voteResults.successful){
			game.rematch(voteResults);
		}
		//Иначе, не запускаем игру
		else{
			game.backToLobby(voteResults);	
		}
		return false;
	}

	//Сообщаем игрокам о колоде и друг друге
	SHOULD_START(){		
		const game = this.game;
		this.current = 'STARTING';
		game.waitForResponse(game.actions.timeouts.gameStart, game.players);
		game.players.gameStateNotify(
			game.players,
			{
				cards: true,
				players: true,
				suit: true
			},
			false,
			'GAME_INFO'
		);
		return false;
	}

	//Раздаем карты в начале игры
	STARTING(){
		const game = this.game;
		this.current = 'STARTED';
		let dealsOut = game.cards.dealStartingHands();

		if(dealsOut && dealsOut.length){
			game.waitForResponse(game.actions.timeouts.deal, game.players);
			game.players.dealNotify(dealsOut);
		}
		else{
			game.log.error('Couldn\'t deal at the start of the game');
		}
		return false;

	}

	//Находим игрока, делающего первый ход в игре или продолжаем ход
	STARTED(){
		const game = this.game;
		if(!game.players.attackers.length){

			let [minTCards, minTCard] = game.players.findToGoFirst();	

			//Сообщаем игрокам о минимальных козырях
			if(minTCard){				
				game.waitForResponse(game.actions.timeouts.trumpCards, game.players);
				game.players.minTrumpCardsNotify(minTCards, minTCard.pid);
				return false;
			}
			//Иначе сообщаем об отсутствии козырей в руках
			else{
				game.players.notify({
					message: 'NO_TRUMP_CARDS'
				});
				return true;
			}
		}
		else{
			return game.doTurn();	
		}
	}
}

module.exports = GameStates;