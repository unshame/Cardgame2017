'use strict';

const
	Game = require('../Game/Game'),
	TestBot = require('./TestBot');

function runTest(numBots, duration, debug){
	console.log('Testing...');
	if(typeof duration != 'number'){
		duration = 2000;
	}
	let bots = [];
	let randomNames = ['bot1', 'bot2', 'bot3', 'bot4', 'bot5'];
	let tester = {
		running: true
	};
	if(!numBots){
		numBots = 5;
	}
	for(let i = 0; i < numBots; i++){
		bots.push(new TestBot(tester,randomNames));
	}
	new Game({endGame: () => {}}, bots, true, debug, true);
	setTimeout(() => {
		console.log('Tests finished...');
		tester.running = false;
		bots[0].connected = false;
		for(let bi = 0; bi < bots.length; bi++){
			let bot = bots[bi];			
			console.log('Bot %s: failed %s out of %s', bot.name, bot.failedTests, bot.tests);
		}
	}, duration);
}
module.exports.runTest = runTest;