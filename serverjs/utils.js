'use strict';

const 
	fs = require('fs'),
	crypto = require('crypto');

var stats = {
	line: 0,
	isInDebugMode: true
};
exports.stats = stats;

exports.generateId = function(){
	let chars = "abcdefghijklmnopqrstuwxyzABCDEFGHIJKLMNOPQRSTUWXYZ0123456789";
	let howMany = 7;
	let rnd = crypto.randomBytes(howMany),
		value = new Array(howMany),
		len = chars.length;

	for (let i = 0; i < howMany; i++) {
	    value[i] = chars[rnd[i] % len];
	}

	return value.join('');
};
var stats = {
	line: 0,
	isInDebugMode: true
};