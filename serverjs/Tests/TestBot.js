var utils = require('../utils'),
	Bot = require('../bots.js');

var TestBot = function(tester, randomNames){
	Bot.call(this, randomNames);
	this.tester = tester;
	this.tests = 0;
	this.failedTests = 0;
}

TestBot.prototype = Object.create(Bot.prototype);
TestBot.prototype.constructor = TestBot;

TestBot.prototype.recieveValidActions = function(actions){
	//console.log('Here we\'ll send info to tester', this.name, this.game.id)	
	var game = this.game;
	var types = actions.map(a => a.type),
		attackIndex = types.indexOf('ATTACK'),
		defenseIndex = types.indexOf('DEFENSE');
	var lineNum = utils.stats.line;

	if(this.tester.running && game.turnStage != 'FOLLOWUP' && game.nextTurnStage == 'DEFENSE' && ~attackIndex && !~defenseIndex){
		console.log(game.turnStage)
		var defenseSpots = 0;
		this.tests++;
		for(var fi = 0; fi < game.field.length; fi++){
			var fieldSpot = game.field[fi];

			if(fieldSpot.attack && !fieldSpot.defense){
				defenseSpots++;
			} 

		}
		var handSize = game.hands[game.defender].length;
		if(handSize <= defenseSpots){
			console.log('Test %s (attack) failed on %s', this.tests, this.name);
			console.log('%s cards to beat but %s cards in hand', defenseSpots + 1, handSize);
			console.log('See line %s in log.txt for context', lineNum + 1);
			console.log('----------------\n');
			this.failedTests++;
		}
	}

	//Тесты перевода
	if(this.tester.running && game.turnStage == 'DEFENSE' && ~attackIndex){		
		var action = actions[attackIndex];

		//Тест перевода игроку, у которого нет достаточного кол-ва карт, чтобы отбиться
		this.tests++;
		var usedSpots = game.fieldUsedSpots;
		var handSize = game.hands[game.ally || game.attacker].length;
		if(handSize <= usedSpots){
			console.log('Test %s (transfer) failed on %s', this.tests, this.name);
			console.log('%s cards to beat but %s cards in hand', usedSpots + 1, handSize);
			console.log('See line %s in log.txt for context', lineNum + 1);
			console.log('----------------\n');
			this.failedTests++;
		}


		//Тест смены ролей игроков при переводе
		this.tests++;
		var before = [
			game.playersById[game.attacker].name,
			game.playersById[game.defender].name
		];
		if(game.playersById[game.ally])
			before.push(game.playersById[game.ally].name);
		var expected = [];
		var parties = game.activePlayers.length > 2 ? 3 : 2;
		var ai = game.activePlayers.indexOf(game.attacker);
		for(var i = 0; i < parties; i++){
			ai++;
			if(ai >= game.activePlayers.length)
				ai = 0;
			expected.push(game.playersById[game.activePlayers[ai]].name);
		}
		var active = game.activePlayers.slice();

		this.sendResponse(action);

		var result = [
			game.playersById[game.attacker].name,
			game.playersById[game.defender].name
		];
		if(game.playersById[game.ally])
			result.push(game.playersById[game.ally].name);
		if(result.join() != expected.join()){
			console.log('Test %s failed on %s', this.tests, this.name);
			console.log('Before:  ', before);
			console.log('Expected:', expected);
			console.log('After:   ', result);
			console.log('Active:  ',
				active.map((p) => {
					return game.playersById[p].name
				}),
				'=>',
				game.activePlayers.map((p) => {
					return game.playersById[p].name
				})
			);
			console.log('See line %s in log.txt for context', lineNum + 1)
			console.log('----------------\n')
			this.failedTests++;
		}
	}
	else{
		Object.getPrototypeOf(TestBot.prototype).recieveValidActions.call(this, actions);
	}
}

TestBot.prototype.recieveNotification = function(note, actions){
	if(note.message == 'GAME_ENDED'){
		//console.log(note.message);
		this.tester.bots = this.game.players;
		//console.log(this.tester.bots.map(b => b.name))		
	}
	Object.getPrototypeOf(TestBot.prototype).recieveNotification.call(this, note, actions);
}

module.exports = TestBot;