'use strict';

const crypto = require('crypto');

module.exports = function(){
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