'use strict';

const 
	fs = require('fs'),
	crypto = require('crypto');

fs.writeFile('./logs/log.txt','');
var logStream = fs.createWriteStream('./logs/log.txt', {'flags': 'a'});

var stats = {
	line: 0,
	isInDebugMode: true
}

exports.stats = stats;

exports.generateId = function(){
	let chars = "abcdefghijklmnopqrstuwxyzABCDEFGHIJKLMNOPQRSTUWXYZ0123456789";
	let howMany = 7;
	let rnd = crypto.randomBytes(howMany),
		value = new Array(howMany),
		len = chars.length;

	for (let i = 0; i < howMany; i++) {
	    value[i] = chars[rnd[i] % len]
	};

	return value.join('');
}

exports.copyObject = function(obj){
	let newObj = {};
	for(let key in obj){
		if(obj.hasOwnProperty(key))
			newObj[key] = obj[key];
	}
	return newObj;
}

exports.log = function(){
	stats.line++;

	let logLine = '',
		logSLine = '';
	for(let i = 0; i < arguments.length; i++){
		let arg = arguments[i];
		if(logLine.length)
			logLine += ' ';
		logLine += String(arg);
		if(stats.isInDebugMode){
			if(logSLine.length)
				logSLine += ' ';
			logSLine += '%s';
		}
	}
	logLine += "\n";
	logStream.write(logLine)
	if(stats.isInDebugMode){
		let args = Array.prototype.slice.call(arguments);
		args.unshift(logSLine);
		console.log.apply(this, args);	
	}
}