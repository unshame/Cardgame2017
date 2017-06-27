const winston = require('winston'),
	path = require('path');

let dirname = __dirname.split('\\');
dirname.pop();
dirname = dirname.join('\\');

function leadWithZeros(num, zeros){
	zeros = zeros || 2;
	return (Array(zeros).join("0") + num).slice(-zeros);
}

const inProd = process.env.PROD;

function getTimeStamp(full){
	const d = new Date();
	let date = leadWithZeros(d.getHours()) + ':' + leadWithZeros(d.getMinutes()) + ':' +
			   leadWithZeros(d.getSeconds()) + ':' + leadWithZeros(d.getMilliseconds(), 4);
	if(full){
		date = d.toLocaleDateString('RU-ru') + 't' + date;
	}
	return date;
}

let levels = {error: 0, warn: 1, notice: 2, info: 3, debug: 4};
let colors = {error: 'red', warn: 'yellow', notice: 'cyan', info: 'green', debug: 'magenta'};

module.exports = function(callingModule, id, level) {
	let name = callingModule.filename.split('\\').pop().replace('.js', '');
	let filename = path.join(dirname, '/logs/' + name + (id ? '#' + id : '') + '-' + (getTimeStamp(true).replace(/[:-]/g,'')) + '.log');
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