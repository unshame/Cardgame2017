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

	recieveValidActions(actions){
		//console.log('Here we\'ll send info to tester', this.name, this.game.id)	
		var game = this.game;
		var types = actions.map(a => a.type),
			attackIndex = types.indexOf('ATTACK'),
			defenseIndex = types.indexOf('DEFENSE');
		var lineNum = utils.stats.line;

		if(this.tester.running && game.turnStages.current != 'FOLLOWUP' && game.turnStages.next == 'DEFENSE' && ~attackIndex && !~defenseIndex){
			var defenseFields = 0;
			this.tests++;
			for(var fi = 0; fi < game.field.length; fi++){
				var tableField = game.field[fi];

				if(tableField.attack && !tableField.defense){
					defenseFields++;
				} 

			}
			var handSize = game.hands[game.players.defender.id].length;
			if(handSize <= defenseFields){
				console.log('Test %s (attack) failed on %s', this.tests, this.name);
				console.log('%s cards to beat but %s cards in hand', defenseFields + 1, handSize);
				console.log('See line %s in log.txt for context', lineNum + 1);
				console.log('----------------\n');
				this.failedTests++;
			}
		}

		//Тесты перевода
		if(this.tester.running && game.turnStages.current == 'DEFENSE' && ~attackIndex){		
			var action = actions[attackIndex];

			//Тест перевода игроку, у которого нет достаточного кол-ва карт, чтобы отбиться
			this.tests++;
			var usedFields = game.table.usedFields;
			var handSize = game.hands[game.players.ally && game.players.ally.id || game.players.attacker.id].length;
			if(handSize <= usedFields){
				console.log('Test %s (transfer) failed on %s', this.tests, this.name);
				console.log('%s cards to beat but %s cards in hand', usedFields + 1, handSize);
				console.log('See line %s in log.txt for context', lineNum + 1);
				console.log('----------------\n');
				this.failedTests++;
			}


			//Тест смены ролей игроков при переводе
			this.tests++;
			var before = [
				game.players.attacker.name,
				game.players.defender.name
			];
			if(game.players.ally)
				before.push(game.players.ally.name);
			var expected = [];
			var activePlayers = game.players.active;
			var parties = activePlayers.length > 2 ? 3 : 2;
			var ai = activePlayers.indexOf(game.players.attacker);
			for(var i = 0; i < parties; i++){
				ai++;
				if(ai >= activePlayers.length)
					ai = 0;
				expected.push(activePlayers[ai].name);
			}
			var active = activePlayers.slice();

			this.sendResponse(action);

			//Тест сохранения исходных атакующих
			this.tester.transfers++;
			let numOfTransfers = this.tester.transfers;
			let numOfOriginalAttackers = this.game.players.originalAttackers.length;
			if(numOfTransfers != numOfOriginalAttackers){
				console.log('Test %s (transfer attacker saving) failed on %s', this.tests, this.name);
				console.log('Transfers: %d but saved attackers: %d', numOfTransfers, numOfOriginalAttackers)
				console.log('See line %s in log.txt for context', lineNum + 1);
				console.log('----------------\n');
				this.failedTests++;
			}

			//Тест смены ролей игроков при переводе (продолжение)
			var result = [
				game.players.attacker.name,
				game.players.defender.name
			];
			if(game.players.ally)
				result.push(game.players.ally.name);
			if(result.join() != expected.join()){
				console.log('Test %s failed on %s', this.tests, this.name);
				console.log('Before:  ', before);
				console.log('Expected:', expected);
				console.log('After:   ', result);
				console.log('Active:  ',
					active.map((p) => {
						return p.name
					}),
					'=>',
					activePlayers.map((p) => {
						return p.name
					})
				);
				console.log('See line %s in log.txt for context', lineNum + 1)
				console.log('----------------\n')
				this.failedTests++;
			}
		}
		else{
			super.recieveValidActions(actions);
		}
	}

	recieveNotification(note, actions){
		switch(note.message){

		case 'GAME_ENDED':
			//console.log(note.message);
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