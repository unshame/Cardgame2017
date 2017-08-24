Мультиплеерная карточная игра на [Phaser.js](https://phaser.io/), [Node.js](https://nodejs.org/) и [Eureca.io](http://eureca.io/).  
Тестовая версия - [durak.herokuapp.com](https://durak.herokuapp.com/).  
Документация (WIP) - [клиент](https://durak.herokuapp.com/doc/client), [сервер](https://durak.herokuapp.com/doc/server).

## Установка  

1. Клонировать `git clone https://github.com/unshame/Cardgame2017.git`    
3. Установить [node.js](https://nodejs.org/en/)     
4. Установить необходимые библиотеки через Node.js command prompt в папку с репозиторием:  
    * `cd директорияУстановкиРепозитория`  
    * `npm i`  
9. Установить модули для разработки: `npm run dev`  
Это установит gulp, jsdoc и plato (об этом далее).
5. Запустить сервер через Node.js command prompt: `node server`    
7. В браузере открыть `localhost:5000`  
8. Должно быть так:   
![Menu](https://i.imgur.com/kKb8Hfr.png  "Menu")  
![Gameplay](https://i.imgur.com/CkgYyii.jpg  "Gameplay")  
И если нажать F12:  
![DevConsole](https://i.imgur.com/HyQXwbl.png "F12 Developer Console")  

## Тестирование

### Параметры запуска сервера  
`node -param1 value -param2 -param3` и т.д.  
Параметры:  
 * `--bots number`, `-b number` - игра будет запускаться с этим кол-вом ботов (по-умолчанию 3)
 * `--players number`, `-p number` - игра будет ожидать этого кол-ва игроков перед запуском (по-умолчанию 1)
 * `--random`, `--rnd`, `-r` - кол-во ботов случайное, в пределах указанного указанного
 * `--transfer` - можно переводить карты 
 * `--debug [string]`, `-d [string]` - включает дебаг сообщения в консоли, опционально можно указать уровень сообщений (`silly, debug, info, notice, warn, error`, по умолчанию `debug` с флагом и `notice` без флага)  
 * `--port` - порт сервера игры (если стандартный 5000 занят)
 * `--testing [number]`, `--test [number]`, `-t [number]` - запускает тесты вместо обычного режима, опционально можно указать длительность тестов (2000мс по-умолчанию)

### Серверные логи  
В папке \logs создаются логи сервера. Каждая игра и игрок создают свои логи.  
Логи именуются по шаблону `Type-DATEtTIME.log`.  
Для создания логов и вывода сообщений в консоль используется [winston](https://github.com/winstonjs/winston).

### Полезные команды в консоли  
* `connection.inDebugMode = true` - включает лог сообщений от сервера (как показано выше) 
* `cardControl.toggleDebugMode()` - переключает дебаг при перетаскивании карт  
* `fieldmanager.toggleDebugMode()` - переключает дебаг полей карт
* `cardManager.toggleDebugMode()` - дебаг карт
* `game.scale.toggleDebugMode()` - дебаг сетки
* `game.toggleDebugMode()` или кнопка Debug - дебаг всего
* Средний клик на карте, потом в консоли Chrome правый клик на появившейся строчке -> `Store as global var`, чтобы получить прямой доступ к карте

## Разработка

### Пакетная обработка  
Есть несколько скриптов для облегчения релизов при помощи [gulp](http://gulpjs.com/).  
`gulp addtags` добавляет `<script>` теги с адресами .js файлов из public\js в index.html для облегчения локального теста игры.  
`gulp build` создает копию игры в папке prod, минифицируя .js файлы из public\js.
Также туда копируются файлы для загрузки игры на сервер heroku.  
Для того, чтобы эти скрипты могли найти .js файлы и правильно их собрать, необходимо указать имена файлов в public/js/index.js:  
`\\@include:ИмяФайлаИлиПапки`  
Если указано имя папки, то будет добавлен файл с таким же именем в этой папке (Filename/Filename.js).  
Если файл уже указан в index.js, в нем можно указывать имена других файлов и т.д.  

### Документация  
`npm run doc` генерирует документацию из комментариев в папке doc при помощи [JSDoc](http://usejsdoc.org/).
Тестовая версия загружена на [durak.herokuapp.com/doc/client/](https://durak.herokuapp.com/doc/client/).  
Шаблон документации классов на сервере:  

    'use strict';

    class Example extends OtherClass{
    
    	/**
     	 * Описание класса.
     	 * @extends {OtherClass}
    	 * @param  {type} param
    	 */
    	constructor(param){
    		super();
    
    		/**
    		 * Описание свойства
    		 * @type {type}
    		 */
    		this.param = param
    	}


    	/**
    	 * Описание getterSetter.
    	 * @type {type}
    	 */
    	get getterSetter(){

    	}
    	set getterSetter(value){

    	}

    	/**
    	 * Описание readOnlyParam.
    	 * @type {type}
    	 * @readonly
    	 */
    	get readOnlyParam(){

    	}
    }

    /**
     * {@link Example}
     * @module
     */    
    module.exports = Example;


`@module` ставится внизу, чтобы заставить генератор добавить файл в список модулей, но не представлять класс, как свойство модуля (класс это и есть модуль).

### Валидация кода  
`npm run report` создает отчеты по коду в папке report при помощи [plato](https://github.com/es-analysis/plato). Там можно посмотреть ошибки линтинга и сложность кода.  

## Что нужно сделать

### Clientside  
* Доделать все существующие модули  
* LobbyManager  
* UI   
* Документация  

### Serverside  
* Доделать существующие модули 
* Конструктор лобби (Lobby)  
* Менеджер лобби (LobbyManager\LobbyBrowser)