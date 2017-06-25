'use strict';

const 
	fs = require('fs'),
	path = require('path'),
	gulp = require('gulp'),
	newFile = require('gulp-file'),
	uglify = require('gulp-uglify');

const publicPath = './public';
const serverPath = './serverjs';
const docPath = './doc';
const reportPath = './report';


function includeReferenced(dir, fileName){
	let dirPath = path.join(dir, fileName);
	let filePath = dirPath + '.js';
	let fileAltPath = path.join(dirPath, fileName + '.js');
	let content;
	if(fs.existsSync(filePath)){
		content = fs.readFileSync(filePath, "utf8");			
	}
	else if(fs.existsSync(dirPath) && fs.existsSync(fileAltPath)){
		content = fs.readFileSync(fileAltPath, "utf8");
		dir = dirPath;
	}

	if(content){
		content = content.replace(/^\/\/@include:(.*)$/gm, (m, p1) => {
			return includeReferenced(dir, p1);
		});
	}
	else{
		console.log('File %s not found\n', fileName)
		content = '';
	}
	console.log(path.join(dir, fileName + '.js'))
	return content;
}

function replaceInclude(dir, fileName){
	let content = includeReferenced(dir, fileName);
	if(!content){
		console.warn('File %s not found in %s', fileName, dir);
		return '';
	}
	else{
		return content;
	}
}

function replaceDevCode(dir, devName, prodName){
	let devFile = path.join(dir, devName);
	let prodFile = path.join(dir, prodName);
	if(!fs.existsSync(devFile) || !fs.existsSync(prodFile)){
		console.warn('Either file not found', devFile, prodName);
		return '';
	}
	let devContent = fs.readFileSync(devFile, "utf8");
	let prodContent = fs.readFileSync(prodFile, "utf8");
	if(!devContent || !prodContent){
		console.warn('Either file empty', devFile, prodName);
		return '';
	}
	devContent = devContent.replace(/<!-- dev -->[\s\S]*<!-- \/dev -->/g, prodContent);
	return devContent;
}

gulp.task('build', () => {
	let jsContent = includeReferenced(path.join(publicPath, '/js'), 'index');
	let jsFile = newFile('public/durak.js', jsContent);
	let indexContent = replaceDevCode(publicPath, 'index.html', 'indexProd.html');
	let indexFile = newFile('public/index.html', indexContent);
	gulp.src([
			path.join(publicPath, '/lib/phaser.override.js')
		], { "base" : "." })
		.pipe(jsFile)
		.pipe(uglify())
		.pipe(gulp.dest('prod'));
	gulp.src([
			'./server.js',
			'./app.json',
			'./package.json',
			'./logs/.gitkeep',
			'./.gitignore',
			'./Procfile',
			path.join(publicPath, 'style.css'),
			path.join(publicPath, '/lib/phaser.min.js'),
			path.join(publicPath, '/assets/**/*'),
			path.join(serverPath, '/**/*')
		], 
		{ "base" : "." })
		.pipe(indexFile)
		.pipe(gulp.dest('prod'));

	gulp.src([
			path.join(docPath, '/client/**/*'),
			path.join(docPath, '/server/**/*'),
			path.join(reportPath, '/client/**/*'),
			path.join(reportPath, '/server/**/*')
		], 
		{ "base" : "." })
		.pipe(gulp.dest('prod/public'));
});