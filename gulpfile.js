// jshint esversion:6
// jshint node:true
'use strict';

const 
	fs = require('fs'),
	path = require('path'),
	gulp = require('gulp'),
	newFile = require('gulp-file'),
	uglify = require('gulp-uglify'),
	pump = require('pump');

// Имена файлов\папок
const indexName = 'index';
const publicName = 'public';

// Пути к файлам
const publicPath = './' + publicName;
const serverPath = './serverjs';
const docPath = './doc';
const reportPath = './report';
const prodPath = './prod';
const otherPaths = [
	'./server.js',
	'./app.json',		// для heroku
	'./package.json',	// информация о приложении
	'./logs/.gitkeep',	// нужно сохранить папку с логами, но без самих логов
	'./.gitignore',		// для heroku
	'./Procfile',		// для heroku
	path.join(publicPath, 'style.css'),
	path.join(publicPath, 'favicon.ico'),
	path.join(publicPath, '/assets/**/*'),	
	path.join(serverPath, '/**/*')	// серверные скрипты
];

// Пути к скриптам в public
const libraryPaths = [
	'lib/eureca.js',
	'lib/phaser.js',
	'lib/phaser.override.js',
	'lib/phaser.input.js'
];
const jsPath = 'js';
const minifiedPath = 'durak.js';
const packPath = 'pack.js';

function concatFiles(folder, paths){
	let content = '';
	paths.forEach((filePath) => {
		filePath = path.join(folder, filePath);
		if(fs.existsSync(filePath)){
			content += fs.readFileSync(filePath, "utf8");

		}
	});
	return content;
}

// Рекурсивно заменяет строку //@include:file в контенте указанного файла
// на контент соответствующих файлов.
// Если указать tags, то вместо замены контента файлов, возвратит тэги со
// ссылками на файлы для вставки в index.html (<script src=""></script>).
// addSelf - нужно ли добавлять сам файл в теги
// Возвращает полученную строку.
function includeReferenced(dir, fileName, tags, base, addSelf){

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
		if(tags && typeof tags != 'string'){
			tags = '';
		}

		// Добавляем текущий файл к тегам
		if(typeof tags == 'string' && addSelf){
			let baselessDir = dir.replace(base, '');
			tags = addLibraryTags(tags, path.join(baselessDir, fileName + '.js'));
		}

		// Вызывает includeReferenced для каждого нахождения //@include:.*,
		// либо для сбора тегов
		let regex = /^\/\/@include:(.*)$/gm;
		content = content.replace(regex, (m, p1) => {
			if(typeof tags == 'string'){
				tags = includeReferenced(dir, p1, tags || true, base, true);
				return;
			}
			else{
				return includeReferenced(dir, p1);
			}
		});
	}
	else{
		console.log('File %s not found\n', fileName, filePath, fileAltPath);
		content = '';
	}

	//console.log(path.join(dir, fileName + '.js'));

	return tags || content;
}

// Заменяет код обернутый в <!-- dev --><!-- \/dev --> в devName на код из prodName в папке dir.
// Если не задано prodName, заменяет код на content.
// Возвращает строку после замены.
function replaceDevCode(dir, devName, prodName, content, removeDev){

	let devFile = path.join(dir, devName);
	let prodFile = prodName ? path.join(dir, prodName) : null;

	if(!fs.existsSync(devFile) || prodName && !fs.existsSync(prodFile)){
		console.warn('Either file not found', devFile, prodFile);
		return '';
	}

	let devContent = fs.readFileSync(devFile, "utf8");
	let prodContent = prodFile ? fs.readFileSync(prodFile, "utf8") : null;

	if(!devContent || prodName && !prodContent){
		console.warn('Either file empty', devFile, prodFile);
		return '';
	}

	// Замена контента
	let regex = /(<!-- dev -->)[\s\S]*(<!-- \/dev -->)/g;
	if(content && !removeDev){
		content = '$1' + content + '\n$2';
	}
	devContent = devContent.replace(regex, content || prodContent);
	return devContent;
}

// Добавляет html script теги к строке с адресами из массива.
// Возвращает строку
function addLibraryTags(tags, libs){
	if(!(libs instanceof Array)){
		libs = [libs];
	}

	libs.forEach(function(lib) {
		tags += '\n<script src="' + lib + '"></script>';
	});

	return tags;
}

// Создает билд игры в папке prod
function build(includeDocs, safeBuild, callback){

	// Склеиваем библиотеки
	let libContent = concatFiles(publicPath, libraryPaths);
	let libFile = newFile(path.join(publicPath, packPath), libContent);

	// склеиваем все скрипты
	let jsContent = includeReferenced(path.join(publicPath, jsPath), indexName);
	if(safeBuild){
		jsContent = '(function(){' + jsContent + '})()';
	}
	let jsFile = newFile(path.join(publicPath, minifiedPath), jsContent);

	// заменяем пути к скриптам в index.html
	let tags = addLibraryTags('', [packPath, minifiedPath]); 
	let indexContent = replaceDevCode(publicPath, indexName + '.html', null, tags, true);
	let indexFile = newFile(path.join(publicPath, indexName + '.html'), indexContent);

	let base = { "base" : "." };

	// Скрипты, которые нужно минифицировать
	pump([
		libFile,	// библиотеки
		jsFile,		// весь js код
		uglify(),	// минификация
		gulp.dest(prodPath)
	], callback);

	// Все остальные файлы игры
	pump([
		gulp.src(otherPaths, base),
		indexFile,	// index.html с замененными путями к скриптам
		gulp.dest(prodPath)
	], callback);

	// Документация и отчеты по коду
	if(includeDocs){
		gulp.src([
				path.join(docPath, '/client/**/*'),
				path.join(docPath, '/server/**/*'),
				path.join(reportPath, '/client/**/*'),
				path.join(reportPath, '/server/**/*')
			], base)				
			.pipe(gulp.dest(path.join(prodPath, publicName)));
	}
}

// Таск создания версии для heroku
gulp.task('build', (callback) => {
	build(false, false, callback);
});

// Таск создания версии для heroku с обновлением документации
gulp.task('buildall', (callback) => {
	build(true, false, callback);
});

// То же, только весь код оборачивается в самовызываемую функцию

gulp.task('buildsafe', (callback) => {
	build(false, true, callback);
});

gulp.task('buildallsafe', (callback) => {
	build(true, true, callback);
});

// Добавляет html скрипт теги в index.html
gulp.task('addtags', (callback) => {

	// Добавляем библиотеки к тегам
	let libs = addLibraryTags('', libraryPaths); 

	// Создаем теги из скриптов
	let tags = includeReferenced(path.join(publicPath, jsPath), indexName, true, publicName + '\\');
	tags = addLibraryTags(tags, path.join(jsPath, indexName + '.js'));
	tags = libs + tags;

	// Замена обратных слешей на прямые
	tags = tags.replace(/\\/g, '/');

	// Заменяем существующие теги в контенте index.html на новые
	let indexContent = replaceDevCode(publicPath, indexName + '.html', null, tags);
	let indexHtmlPath = path.join(publicPath, indexName + '.html');

	// Перезаписываем index.html
	fs.truncate(indexHtmlPath, 0, function() {
		fs.writeFile(indexHtmlPath, indexContent, callback);
	});

});
