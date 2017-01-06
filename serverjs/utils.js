var isInDebugMode = false;

var fs = require('fs');
fs.writeFile('./logs/log.txt','');
var logStream = fs.createWriteStream('./logs/log.txt', {'flags': 'a'});

exports.generateId = function(){
	return Math.random().toString(36).substr(2, 9);
}

exports.copyObject = function(obj){
	var newObj = {};
	for(var key in obj){
		if(obj.hasOwnProperty(key))
			newObj[key] = obj[key];
	}
	return newObj;
}

exports.log = function(){
	if(isInDebugMode)
		console.log.apply(this, arguments);
	
	var logLine = "";
	for(var i in arguments){
		var arg = arguments[i];
		if(logLine.length)
			logLine += " ";
		logLine += String(arg);
	}
	logLine += "\n";
	logStream.write(logLine)
}