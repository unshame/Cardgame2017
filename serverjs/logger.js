/**
 * @module
 */

'use strict';

const winston = require('winston');

/** 
 * находится ли программа в режиме релиза
 * @type {boolean}
 */
const inProd = process.env.PROD;

/**
 * Уровни логгера.
 * @type {Object}
 */
let levels = {error: 0, warn: 1, notice: 2, info: 3, debug: 4};

/**
 * Цвета уровней логгера.
 * @type {Object}
 */
let colors = {error: 'red', warn: 'yellow', notice: 'cyan', info: 'green', debug: 'magenta'};

/**
 * Добавляет нули перед числом до указанного кол-ва.
 * @param  {number} num     число
 * @param  {number} [len=2] желаемая длина строки длина
 * @return {string}         Число в виде строки с желаемой длиной.
 */
function leadWithZeros(num, len){
	len = len || 2;
	return (Array(len).join("0") + num).slice(-len);
}

/**
 * Форматирует текущее время.
 * @param  {boolean} [full] нужно ли добавляеть дату или только время
 * @return {string}      	Дата в формате `[DD-MM-YYYYt]HH:MM:SS:MMMM`.
 */
function getTimeStamp(full){
	const d = new Date();
	let date = leadWithZeros(d.getHours()) + ':' + leadWithZeros(d.getMinutes()) + ':' +
			   leadWithZeros(d.getSeconds()) + ':' + leadWithZeros(d.getMilliseconds(), 4);
	if(full){
		date = d.toLocaleDateString('RU-ru') + 't' + date;
	}
	return date;
}

/**
 * Создает новый winston логгер.
 * @param  {object} callingModule    `module` объект модуля, вызывающего эту функцию
 * @param  {string} [id]             id нового логгера
 * @param  {string} [level='notice'] уровень сообщений консоли
 * @return {winston.Logger}       	 Новый логгер.
 */
module.exports = function(callingModule, id, level) {
	let name = callingModule.filename.split('\\').pop().replace('.js', '');
	let filename = './logs/' + name + (id ? '#' + id : '') + '-' + (getTimeStamp(true).replace(/[:-]/g,'')) + '.log';
	let transports = [
		new winston.transports.Console(
		{	
			level: level || 'notice',
			label: name + (id ? '#' + id : ''),
			prettyPrint: true,
			colorize: true,
			timestamp: getTimeStamp
		})
	];
	if(!inProd){
		transports.push(new winston.transports.File(
		{
			filename: filename,
			json: false, 
			timestamp: getTimeStamp
		}));
	}
	return new winston.Logger({
		levels: levels,
		colors: colors,
		transports: transports
	});
};