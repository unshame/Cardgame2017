'use strict';

const
	Bot = require('../Player/Bot');

class TestBot extends Bot{

	constructor(tester, randomNames){
		super(randomNames);
		this.tester = tester;
		this.tester.transfers = 0;
		this.tests = 0;
		this.failedTests = 0;
	}

	getDescisionTime(){
		return 0;
	}

	recieveValidActions(actions, deadline, roles){
		// console.log('Here we\'ll send info to tester', this.name, this.game.id)	
		let game = this.game;
		let types = actions.map(a => a.type),
			attackIndex = types.indexOf('ATTACK'),
			defenseIndex = types.indexOf('DEFENSE');

		if(this.tester.running && game.turnStages.current != 'FOLLOWUP' && game.turnStages.next == 'DEFENSE' && ~attackIndex && !~defenseIndex){
			let defenseTables = 0;
			this.tests++;
			for(let fi = 0; fi < game.table.length; fi++){
				let tableField = game.table[fi];

				if(tableField.attack && !tableField.defense){
					defenseTables++;
				} 

			}
			let handSize = game.hands[game.players.defender.id].length;
			if(handSize <= defenseTables){
				console.log('Test %s (attack) failed on %s', this.tests, this.name);
				console.log('%s cards to beat but %s cards in hand', defenseTables + 1, handSize);
				console.log('----------------\n');
				this.failedTests++;
			}
		}

		// Тесты перевода
		if(this.tester.running && game.turnStages.current == 'DEFENSE' && ~attackIndex){		
			let action = actions[attackIndex];

			// Тест перевода игроку, у которого нет достаточного кол-ва карт, чтобы отбиться
			this.tests++;
			let usedFields = game.table.usedFields;
			let attackers = game.players.attackers;
			let handSize = game.hands[attackers[1] && attackers[1].id || attackers[0].id].length;
			if(handSize <= usedFields){
				console.log('Test %s (transfer) failed on %s', this.tests, this.name);
				console.log('%s cards to beat but %s cards in hand', usedFields + 1, handSize);
				console.log('----------------\n');
				this.failedTests++;
			}


			// Тест смены ролей игроков при переводе
			this.tests++;
			let before = [
				attackers[0].name,
				game.players.defender.name
			];
			if(attackers[1]){
				before.push(attackers[1].name);
			}
			let expected = [];
			let activePlayers = game.players.active;
			let parties = activePlayers.length > 2 ? 3 : 2;
			let ai = activePlayers.indexOf(attackers[0]);
			for(let i = 0; i < parties; i++){
				ai++;
				if(ai >= activePlayers.length){
					ai = 0;
				}
				expected.push(activePlayers[ai].name);
			}
			let active = activePlayers.slice();
			
			this.sendResponseWithCallback(action, () => {

				// Тест сохранения исходных атакующих
				this.tester.transfers++;
				let numOfTransfers = this.tester.transfers;
				let numOfOriginalAttackers = this.game.players.originalAttackers.length;
				if(numOfTransfers != numOfOriginalAttackers && numOfOriginalAttackers != active.length){
					console.log('Test %s (transfer attacker saving) failed on %s', this.tests, this.name);
					console.log('Transfers: %d but saved attackers: %d', numOfTransfers, numOfOriginalAttackers);
					console.log('----------------\n');
					this.failedTests++;
				}

				// Тест смены ролей игроков при переводе (продолжение)
				attackers = game.players.attackers;
				let result = [
					attackers[0].name,
					game.players.defender.name
				];
				if(attackers[1]){
					result.push(attackers[1].name);
				}
				if(result.join() != expected.join()){
					console.log('Test %s failed on %s', this.tests, this.name);
					console.log('Before:  ', before);
					console.log('Expected:', expected);
					console.log('After:   ', result);
					console.log('Active:  ',
						active.map((p) => {
							return p.name;
						}),
						'=>',
						activePlayers.map((p) => {
							return p.name;
						})
					);
					console.log('----------------\n');
					this.failedTests++;
				}
			});
		}
		else{
			super.recieveValidActions(actions);
		}
	}

	recieveNotification(note){
		switch(note.type){

		case 'GAME_ENDED':
			// console.log(note.type);
			this.tester.bots = this.game.players;
			// console.log(this.tester.bots.map(b => b.name))
			break;

		case 'TURN_ENDED':
			this.tester.transfers = 0;
		}
		super.recieveNotification(note);
	}

}
module.exports = TestBot;