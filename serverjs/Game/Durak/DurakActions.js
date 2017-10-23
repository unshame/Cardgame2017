'use strict';

const GameActions = reqfromroot('Game/GameActions');

class DurakActions extends GameActions{
	constructor(game, players){

		var turnTime = game.rules.longerTurn ? 40 : 20;
		super(
			game,
			players,
			{
				gameStart: 10,
				gameEnd: 30,
				trumpCards: 5,
				deal: 10,
				discard: 5,
				take: 2,
				actionComplete: 3,
				actionAttack: turnTime,
				actionDefend: turnTime,
				afk: 5
			},
			['PASS', 'TAKE']
		);

		this.takeOccurred = false;
		this.defenseOccurred = false;
	}

	reset(){
		super.reset();
		this.takeOccurred = false;
		this.defenseOccurred = false;
	}

	getIgnoredKeys(action){
		if(action.type == 'ATTACK' && this.game.cards.firstEmptyTable){
			return ['field'];
		}
		return null;
	}

	// Записывает действие над картой в лог
	logAction(card, actionType, from, to){
		const game = this.game;

		let playersById = game.players.byId;
		this.log.debug(
			'%s %s%s %s => %s',
			actionType,
			['♥', '♦', '♣', '♠'][card.suit], ['J', 'Q', 'K', 'A'][card.value - 11] || (card.value == 10 ? card.value : card.value + ' '),
			playersById[from] ? playersById[from].name : from,
			playersById[to] ? playersById[to].name : to
		);
	}

}

module.exports = DurakActions;