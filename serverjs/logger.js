const winston = require('winston'),
	path = require('path');

let dirname = __dirname.split('\\');
dirname.pop();
dirname = dirname.join('\\');

function leadWithZeros(num, zeros){
	zeros = zeros || 2;
	return (Array(zeros).join("0") + num).slice(-zeros);
}

function getTimeStamp(full){
	const d = new Date();
	let date = leadWithZeros(d.getHours()) + ':' + leadWithZeros(d.getMinutes()) + ':' +
			   leadWithZeros(d.getSeconds()) + ':' + leadWithZeros(d.getMilliseconds(), 4);
	if(full){
		date = d.toLocaleDateString('RU-ru') + 't' + date;
	}
	return date;
}
function getLabel(callingModule, id) {
	let parts = callingModule.filename.split('\\');
	return name + (id ? '#' + id : '');
};

let levels = {error: 0, warn: 1, notice: 2, info: 3, debug: 4};
let colors = {error: 'red', warn: 'yellow', notice: 'cyan', info: 'green', debug: 'magenta'};

module.exports = function(callingModule, id, level) {
	let name = callingModule.filename.split('\\').pop().replace('.js', '');
	let filename = path.join(dirname, '/logs/' + name + (id ? '#' + id : '') + '-' + (getTimeStamp(true).replace(/[:-]/g,'')) + '.log');
	return new winston.Logger({
		levels: levels,
		colors: colors,
		transports: [
			new winston.transports.File(
			{
				filename: filename,
				json: false, 
				timestamp: getTimeStamp
			}),
			new winston.transports.Console(
			{	
				level: level || 'notice',
				label: name + (id ? '#' + id : ''),
				prettyPrint: true,
				colorize: true,
				timestamp: getTimeStamp
			})
		]
	});
};