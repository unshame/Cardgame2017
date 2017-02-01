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

exports.shuffleArray = function(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}