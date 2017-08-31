/*
* Класс содержит действия, выполняемые при различных состояниях игры
*/
'use strict';

const GameStates = reqfromroot('Game/GameStates');

class DurakStates extends GameStates{
	constructor(game){
		super(game);
	}

	// Сообщаем игрокам о колоде и друг друге
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

	// Находим игрока, делающего первый ход в игре или продолжаем ход
	STARTED(){
		const game = this.game;
		if(!game.players.attackers.length){

			let [minTCards, minTCard] = game.players.findToGoFirst();	

			// Сообщаем игрокам о минимальных козырях
			if(minTCard){				
				game.waitForResponse(game.actions.timeouts.trumpCards, game.players);
				game.players.minTrumpCardsNotify(minTCards, minTCard.field);
				return false;
			}
			// Иначе сообщаем об отсутствии козырей в руках
			else{
				game.players.notify({type: 'NO_TRUMP_CARDS'});
				return true;
			}
		}
		else{
			return game.doTurn();	
		}
	}
}

module.exports = DurakStates;