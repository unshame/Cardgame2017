'use strict';

const 
	Game = reqfromroot('Game/Game'),
	Bot = reqfromroot('Player/Bot'),
	DurakCards = reqfromroot('Game/Durak/DurakCards'),
	DurakPlayers = reqfromroot('Game/Durak/DurakPlayers'),
	DurakActions = reqfromroot('Game/Durak/DurakActions'),
	DurakStates = reqfromroot('Game/Durak/DurakStates'),
	DurakTurnStages = reqfromroot('Game/Durak/DurakTurnStages'),
	DurakReactions = reqfromroot('Game/Durak/DurakReactions'),
	DurakDirectives = reqfromroot('Game/Durak/DurakDirectives');

class DurakGame extends Game{
	constructor(queue, players, config){
		super(
			queue,
			players, 
			{
				cards: DurakCards,
				players: DurakPlayers,
				actions: DurakActions,
				states: DurakStates,
				turnStages: DurakTurnStages,
				reactions: DurakReactions,
				directives: DurakDirectives,
				bot: Bot
			}, 
			{
				minPlayers: DurakGame.minPlayers,
				debug: config.debug,
				test: config.test
			}
		);
		// Можно ли переводить карты
		this.canTransfer = Boolean(config.transfer);
	}

	getDefaultResults(){
		return {
			winners: [],
			loser: null
		};
	}
}

DurakGame.maxPlayers = 6;
DurakGame.minPlayers = 2;
DurakGame.modeName = 'durak';

module.exports = DurakGame;