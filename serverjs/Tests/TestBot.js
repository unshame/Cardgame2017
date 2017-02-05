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
	this.tests++;
	var game = this.game;
	var types = actions.map(a => a.type),
		attackIndex = types.indexOf('ATTACK'),
		defenseIndex = types.indexOf('DEFENSE');
	if(~attackIndex && ~defenseIndex && this.tester.running){
		var lineNum = utils.stats.line;
		var action = actions[attackIndex];
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