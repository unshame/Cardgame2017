var isInDebugMode = true;

exports.generateID = function(){
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

exports.echo = function(){
	if(isInDebugMode)
		console.log.apply(this, arguments)
}