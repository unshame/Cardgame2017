/*
 * Запускает сервер
 */

'use strict';

const Server = require(__dirname + '/serverjs/Server/Server');

let server = new Server({allow:[
	'setId',
	'updateId',
	'meetOpponents',
	'recievePossibleActions',
	'recieveCompleteAction',
	'recieveNotification',
	'handleLateness'
]
}, process.argv.slice(2));

server.start();