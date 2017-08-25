'use strict';

const GameActions = reqfromroot('Game/GameActions');

class DurakActions extends GameActions{
	constructor(game){

		super(
			game,
			{
				gameStart: 10,
				gameEnd: 20,
				trumpCards: 10,
				deal: 10,
				discard: 5,
				take: 5,
				actionComplete: 3,
				actionAttack: 20,
				actionDefend: 20,
				afk: 5
			},
			['linkedField'],
			['PASS', 'TAKE']
		);

		this.takeOccurred = false;
	}

	reset(){
		super.reset();
		this.takeOccurred = false;
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