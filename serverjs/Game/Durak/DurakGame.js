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
	constructor(queue, players, config, rules){
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
			},
			rules
		);

		this.loser = null;

		// Можно ли переводить карты
		this.canTransfer = this.rules.canTransfer;

		// Ограничивать ли количество подкладываемых карт кол-вом карт в руке защищающегося
		// после того, как защищающийся решил брать карты
		this.limitFollowup = this.rules.limitFollowup;

		this.freeForAll = this.rules.freeForAll;
	}

	static sanitiseRules(rules){
		return {
			canTransfer: Boolean(rules.canTransfer),
			limitFollowup: Boolean(rules.limitFollowup),
			limitAttack: Boolean(rules.limitAttack),
			freeForAll: false,
			numCards: Number(rules.numCards),
			longerTurn: Boolean(rules.longerTurn)
		};
	}

	getDefaultResults(){
		return {
			winners: [],
			loser: null
		};
	}

	resetTurn(){
		super.resetTurn();
		this.cards.rememberHandLengths();
	}
}

DurakGame.maxPlayers = 6;
DurakGame.minPlayers = 2;
DurakGame.modeName = 'durak';

module.exports = DurakGame;