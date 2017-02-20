const
	Game = require('../Game/GameLogic'),
	TestBot = require('./TestBot');

function runTest(){
	console.log('Testing...');
	var bots = [];
	var randomNames = ['bot1', 'bot2', 'bot3', 'bot4', 'bot5'];
	var tester = {
		running: true
	}
	for(var i = 0; i < 5; i++){
		bots.push(new TestBot(tester,randomNames))
	}
	var game = new Game(bots, true, true);
	setTimeout(() => {
		console.log('Tests finished...');
		tester.running = false;
		bots[0].connected = false;
		for(var bi = 0; bi < bots.length; bi++){
			var bot = bots[bi];			
			console.log('Bot %s: failed %s out of %s', bot.name, bot.failedTests, bot.tests);
		}
	}, 2000)
}
module.exports.runTest = runTest;