const
	utils = require('../utils'),
	Bot = require('../Players/Bot');

class TestBot extends Bot{

	constructor(tester, randomNames){
		super(randomNames);
		this.tester = tester;
		this.tester.transfers = 0;
		this.tests = 0;
		this.failedTests = 0;
	}


	recieveNotification(note, actions){
		switch(note.message){

		case 'GAME_ENDED':
			//console.log(note.message);
			if(note.results && note.results.winners && ~note.results.winners.indexOf(this.id)){
				this.wins++;
				if(this.brain){
/*					this.game.players.forEach((p) => {
						console.log('%s has %s wins, %s', p.name, p.wins, p.brain);
					});
					console.log('\n')*/
				}
			}
			this.tester.bots = this.game.players;
			//console.log(this.tester.bots.map(b => b.name))
			break;

		case 'TURN_ENDED':
			this.tester.transfers = 0;
		}
		super.recieveNotification(note, actions);
	}

}
module.exports = TestBot;