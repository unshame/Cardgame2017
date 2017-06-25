const
	Game = require('../Game/GameLogic'),
	TestBot = require('./TestBot');

function runTest(numBots, duration, debug){
	console.log('Testing...');
	if(typeof duration != 'number')
		duration = 2000;
	var bots = [];
	var randomNames = ['bot1', 'bot2', 'bot3', 'bot4', 'bot5'];
	var tester = {
		running: true
	};
	if(!numBots)
		numBots = 5;
	for(var i = 0; i < numBots; i++){
		bots.push(new TestBot(tester,randomNames));
	}
	bots[bots.length - 1].brain = true;
	bots[bots.length - 2].brain = true;
	var game = new Game(bots, true, debug);
	setTimeout(() => {
		console.log('Tests finished...');
		tester.running = false;
		bots[0].connected = false;
		game.players.forEach((p) => {
			console.log('%s has %s wins, %s', p.name, p.wins, p.brain);
		});
		console.log('\n')
		for(var bi = 0; bi < bots.length; bi++){
			var bot = bots[bi];			
			console.log('Bot %s: failed %s out of %s', bot.name, bot.failedTests, bot.tests);
		}
	}, duration);
}
module.exports.runTest = runTest;