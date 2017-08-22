'use strict';

const 
	Game = reqfromroot('Game/Game'),
	Bot = reqfromroot('Player/Bot'),
	DurakCards = reqfromroot('Game/Durak/DurakCards'),
	DurakPlayers = reqfromroot('Game/Durak/DurakPlayers'),
	GameActions = reqfromroot('Game/GameActions'),
	GameStates = reqfromroot('Game/GameStates'),
	GameTurnStages = reqfromroot('Game/GameTurnStages'),
	GameReactions = reqfromroot('Game/GameReactions'),
	GameDirectives = reqfromroot('Game/GameDirectives');

class DurakGame extends Game{
	constructor(queue, players, config){
		super(
			queue,
			players, 
			{
				cards: DurakCards,
				players: DurakPlayers,
				actions: GameActions,
				states: GameStates,
				turnStages: GameTurnStages,
				reactions: GameReactions,
				directives: GameDirectives,
				bot: Bot
			}, 
			{
				minPlayers: 2,
				debug: config.debug,
				test: config.test
			}
		);

		// Можно ли переводить карты
		this.canTransfer = config.transfer;
	}

	getDefaultResults(){
		return {
			winners: [],
			loser: null
		};
	}
}

module.exports = DurakGame;