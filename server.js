/*
 * Запускает сервер
 */

'use strict';

/**
 * Враппер для require, всегда запрашивает модуль из папки /serverjs/. 
 * @global
 * @param  {string} name Имя модуля в serverjs (Module) или путь к модулю там же (Folder/Subfolder.../Module).
 * @return {object}      Модуль.
 */
global.requirejs = function(name) {
    return require(__dirname + '/serverjs/' + name);
};

const Server = require(__dirname + '/serverjs/Server/Server');

global.server = new Server({allow:[
	'setId',
	'updateId',
	'meetOpponents',
	'recievePossibleActions',
	'recieveCompleteAction',
	'recieveNotification',
	'hoverOverCard',
	'hoverOutCard'
]
}, process.argv.slice(2));

global.server.start();


/**
* Информация о карте.
* @typedef {object} CardInfo
* @property {string} cid id карты
* @property {string} field id поля
* @property {number} suit масть карты
* @property {number} value значение карты
*/