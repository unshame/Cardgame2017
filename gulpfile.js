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
const prodPath = './prod';

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
		console.log('File %s not found\n', fileName);
		content = '';
	}

	console.log(path.join(dir, fileName + '.js'));

	return tags || content;
}

// Заменяет код обернутый в <!-- dev --><!-- \/dev --> в devName на код из prodName в папке dir.
// Если не задано prodName, заменяет код на content.
// Возвращает строку после замены.
function replaceDevCode(dir, devName, prodName, content){

	let devFile = path.join(dir, devName);
	let prodFile = prodName ? path.join(dir, prodName) : null;

	if(!fs.existsSync(devFile) || prodName && !fs.existsSync(prodFile)){
		console.warn('Either file not found', devFile, prodName);
		return '';
	}

	let devContent = fs.readFileSync(devFile, "utf8");
	let prodContent = prodFile ? fs.readFileSync(prodFile, "utf8") : null;

	if(!devContent || prodName && !prodContent){
		console.warn('Either file empty', devFile, prodName);
		return '';
	}

	// Замена контента
	let regex = /(<!-- dev -->)[\s\S]*(<!-- \/dev -->)/g;
	devContent = devContent.replace(regex, content ? '$1' + content + '\n$2' : prodContent);
	return devContent;
}

// Добавляет html script теги к строке с адресами из массива, в конец или в начало.
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
function build(includeDocs){
	// минифицируем и склеиваем все скрипты
	let jsContent = includeReferenced(path.join(publicPath, '/js'), 'index');
	let jsFile = newFile('public/durak.js', jsContent);

	// заменяем пути к скриптам в index.html
	let indexContent = replaceDevCode(publicPath, 'index.html', 'indexProd.html');
	let indexFile = newFile('public/index.html', indexContent);

	let base = { "base" : "." };

	// Скрипты, которые нужно минифицировать
	gulp.src([
			path.join(publicPath, '/lib/eureca.js'),	// eureka
			path.join(publicPath, '/lib/phaser.override.js')	// перезаписываемые функции Phaser
		], base)
		.pipe(jsFile)	// Весь остальной js код
		.pipe(uglify())	// минификация
		.pipe(gulp.dest(prodPath));

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
		], base)
		.pipe(indexFile)	// index.html с замененными путями к скриптам
		.pipe(gulp.dest(prodPath));

	// Документация и отчеты по коду
	if(includeDocs){
		gulp.src([
				path.join(docPath, '/client/**/*'),
				path.join(docPath, '/server/**/*'),
				path.join(reportPath, '/client/**/*'),
				path.join(reportPath, '/server/**/*')
			], base)				
			.pipe(gulp.dest(path.join(prodPath, '/public')));
	}
}

// Таск создания версии для heroku
gulp.task('build', () => {
	build(false);
});

// Таск создания версии для heroku с обновлением документации
gulp.task('buildall', () => {
	build(true);
});

// Добавляет html скрипт теги в index.html
gulp.task('addtags', () => {

	// Добавляем библиотеки к тегам
	let libs = addLibraryTags('', [
		'lib/eureca.js',
		'lib/phaser.js',
		'lib/phaser.override.js'
	]); 

	// Создаем теги из скриптов
	let tags = includeReferenced(path.join(publicPath, '/js'), 'index', true, 'public\\');
	tags = addLibraryTags(tags, 'js/index.js');
	tags = libs + tags;

	// Замена обратных слешей на прямые
	tags = tags.replace(/\\/g, '/');

	// Заменяем существующие теги в контенте index.html на новые
	let indexContent = replaceDevCode(publicPath, 'index.html', null, tags);
	let indexPath = path.join(publicPath, 'index.html');

	// Перезаписываем index.html
	fs.truncate(indexPath, 0, function() {
		fs.writeFile(indexPath, indexContent, function (err) {
			if (err) {
				return console.log("Error writing file: " + err);
			}
		});
	});

	console.log(tags);
});
