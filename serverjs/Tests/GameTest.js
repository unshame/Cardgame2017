const
	Game = require('../Game/GameLogic'),
	TestBot = require('./TestBot');

function runTest(numBots, duration){
	console.log('Testing...');
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
	new Game(bots, true, true);
	setTimeout(() => {
		console.log('Tests finished...');
		tester.running = false;
		bots[0].connected = false;
		for(var bi = 0; bi < bots.length; bi++){
			var bot = bots[bi];			
			console.log('Bot %s: failed %s out of %s', bot.name, bot.failedTests, bot.tests);
		}
	}, duration || 2000);
}
module.exports.runTest = runTest;