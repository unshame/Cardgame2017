'use strict';

const
	Game = require('../Game/Durak/DurakGame'),
	TestBot = require('./TestBot');

function runTest(numBots, duration, debug){
	console.log('Testing...');
	if(typeof duration != 'number'){
		duration = 2000;
	}
	let bots = [];
	let randomNames = [];
	let i = numBots;
	while(i--){
		randomNames.push('bot' + i);
	}
	let tester = {
		running: true
	};
	if(!numBots){
		numBots = 5;
	}
	for(let i = 0; i < numBots; i++){
		bots.push(new TestBot(tester,randomNames));
	}
	var fakeQueue = {endGame: () => {}};
	var game = new Game(
		fakeQueue,
		bots, 
		{
			transfer: true,
			debug: debug,
			test: true
		}
	);
	game.init();

	setTimeout(() => {
		tester.running = false;
		game.shutdown();
		console.log('Tests finished...');
		for(let bi = 0; bi < bots.length; bi++){
			let bot = bots[bi];			
			console.log('Bot %s: failed %s out of %s', bot.name, bot.failedTests, bot.tests);
		}
	}, duration);
}
module.exports.runTest = runTest;