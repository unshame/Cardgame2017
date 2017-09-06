'use strict';

const
	Game = require('../Game/Durak/DurakGame'),
	TestBot = require('./TestBot');

function runTest(params){

	console.log('Testing...');

	let numBots = params.numBots;
	let duration = params.testing;
	let debug = params.debug;

	if(typeof duration != 'number'){
		duration = 2000;
	}
	if(!numBots){
		numBots = 5;
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

	for(let i = 0; i < numBots; i++){
		bots.push(new TestBot(tester, randomNames));
	}
	let fakeQueue = {endGame: () => {}};
	let game = global.game = new Game(
		fakeQueue,
		bots, 
		{
			limitFollowup: !params.followup,
			limitAttack: !params.attack,
			freeForAll: params.freeForAll,
			transfer: params.transfer,
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