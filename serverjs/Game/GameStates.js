/*
 * Класс содержит действия, выполняемые при различных состояниях игры
 * Выполняются в контексте игры 
 */
'use strict';

class GameStates{
	constructor(){
		this.current = null;
	}

	//Проверяем, нужно ли перезапускать игру
	NOT_STARTED(){
		//Проверяем результаты голосования
		let voteResults = this.checkStoredActions();

		//Если голосов хватает, запускаем игру
		if(voteResults.successful){
			this.rematch(voteResults);
		}
		//Иначе, не запускаем игру
		else{
			this.backToLobby(voteResults);	
		}
		return false;
	}

	//Сообщаем игрокам о колоде и друг друге
	SHOULD_START(){		
		this.states.current = 'STARTING';
		this.waitForResponse(this.timeouts.gameStart, this.players);
		this.players.gameStateNotify(
			this.players,
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
		this.states.current = 'STARTED';
		let dealsOut = this.cards.dealStartingHands();

		if(dealsOut && dealsOut.length){
			this.waitForResponse(this.timeouts.deal, this.players);
			this.players.dealNotify(dealsOut);
		}
		else{
			this.log.error('Couldn\'t deal at the start of the game');
		}
		return false;

	}

	//Находим игрока, делающего первый ход в игре или продолжаем ход
	STARTED(){
		if(!this.players.attacker){

			let [minTCards, minTCard] = this.players.findToGoFirst();	

			//Сообщаем игрокам о минимальных козырях
			if(minTCard){				
				this.waitForResponse(this.timeouts.trumpCards, this.players);
				this.players.minTrumpCardsNotify(minTCards, minTCard.pid);
				return false;
			}
			//Иначе сообщаем об отсутствии козырей в руках
			else{
				this.players.notify({
					message: 'NO_TRUMP_CARDS'
				});
				return true;
			}
		}
		else{
			return this.doTurn();	
		}
	}
}

module.exports = GameStates;