'use strict';

const 
	fs = require('fs'),
	path = require('path'),
	gulp = require('gulp'),
	newFile = require('gulp-file'),
	uglify = require('gulp-uglify');

// Пути к файлам
const publicPath = './public';
const serverPath = './serverjs';
const docPath = './doc';
const reportPath = './report';

// Рекурсивно заменяет строку //@include:file в контенте указанного файла
// на контент соответствующих файлов.
// Возвращает полученную строку.
function includeReferenced(dir, fileName){

	let dirPath = path.join(dir, fileName);
	let filePath = dirPath + '.js';
	let fileAltPath = path.join(dirPath, fileName + '.js');
	let content;

	// Находим либо dir/fileName.js, либо dir/fileName/fileName.js
	if(fs.existsSync(filePath)){
		content = fs.readFileSync(filePath, "utf8");			
	}
	else if(fs.existsSync(dirPath) && fs.existsSync(fileAltPath)){
		content = fs.readFileSync(fileAltPath, "utf8");
		dir = dirPath;
	}

	if(content){
		// Вызываем эту же функцию для каждого нахождения //@include:.*
		content = content.replace(/^\/\/@include:(.*)$/gm, (m, p1) => {
			return includeReferenced(dir, p1);
		});
	}
	else{
		console.log('File %s not found\n', fileName);
		content = '';
	}

	console.log(path.join(dir, fileName + '.js'));

	return content;
}

// Заменяет код обернутый в <!-- dev --><!-- \/dev --> в devName на код из prodName в папке dir.
// Возвращает строку после замены.
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

	// Замена контекнта
	devContent = devContent.replace(/<!-- dev -->[\s\S]*<!-- \/dev -->/g, prodContent);
	return devContent;
}

// Таск создания версии для heroku
gulp.task('build', () => {

	// минифицируем и склеиваем все скрипты
	let jsContent = includeReferenced(path.join(publicPath, '/js'), 'index');
	let jsFile = newFile('public/durak.js', jsContent);

	// заменяем пути к скриптам в index.html
	let indexContent = replaceDevCode(publicPath, 'index.html', 'indexProd.html');
	let indexFile = newFile('public/index.html', indexContent);

	// Скрипты, которые нужно минифицировать
	gulp.src([
			path.join(publicPath, '/lib/phaser.override.js')	// перезаписываемые функции Phaser
		], { "base" : "." })
		.pipe(jsFile)	// Весь остальной js код
		.pipe(uglify())	// минификация
		.pipe(gulp.dest('prod'));

	// Все остальные файлы игры
	gulp.src([
			'./server.js',
			'./app.json',		// для heroku
			'./package.json',	// информация о приложении
			'./logs/.gitkeep',	// нужно сохранить папку с логами, но без самих логов
			'./.gitignore',		// для heroku
			'./Procfile',		// для heroku
			path.join(publicPath, 'style.css'),
			path.join(publicPath, '/lib/phaser.min.js'),
			path.join(publicPath, '/assets/**/*'),	
			path.join(serverPath, '/**/*')	// серверные скрипты
		], 
		{ "base" : "." })
		.pipe(indexFile)	// index.html с замененными путями к скриптам
		.pipe(gulp.dest('prod'));

	// Документация и отчеты по коду
	gulp.src([
			path.join(docPath, '/client/**/*'),
			path.join(docPath, '/server/**/*'),
			path.join(reportPath, '/client/**/*'),
			path.join(reportPath, '/server/**/*')
		], 
		{ "base" : "." })
		.pipe(gulp.dest('prod/public'));
});