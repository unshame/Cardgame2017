Мультиплеерная карточная игра на [Phaser.js](https://phaser.io/), [Node.js](https://nodejs.org/) и [Eureca.io](http://eureca.io/).  
Тестовая версия - [durak.herokuapp.com](https://durak.herokuapp.com/)

## Установка  

2. Клонировать `git clone https://github.com/unshame/Cardgame2017.git`    
3. Установить [node.js](https://nodejs.org/en/)     
4. Установить необходимые библиотеки через Node.js command prompt в папку с репозиторием:  
    * `cd директорияУстановкиРепозитория`  
    * `npm i`  
9. Установить модули для разработки: `npm run dev`  
Это установит gulp, jsdoc и plato (об этом далее).
5. Запустить сервер через Node.js command prompt: `node server`    
7. В браузере открыть `localhost:5000`  
8. Должно быть так:   
![Test](https://i.imgur.com/U5ECBIX.png  "Test")  
И если нажать F12:  
![DevConsole](https://i.imgur.com/HyQXwbl.png "F12 Developer Console")  

## Тестирование

### Полезные команды в консоли  
* `connection.inDebugMode = true` - включает лог сообщений от сервера (как показано выше) 
* `cardControl.toggleDebugMode()` - переключает дебаг при перетаскивании карт  
* `fieldmanager.toggleDebugMode()` - переключает дебаг полей карт
* `cardManager.toggleDebugMode()` - дебаг карт
* `game.scale.toggleDebugMode()` - дебаг сетки
* `game.toggleDebugMode()` или кнопка Debug - дебаг всего
* Средний клик на карте, потом в консоли Chrome правый клик на появившейся строчке -> `Store as global var`, чтобы получить прямой доступ к карте

### Скины  
`skinManager.setSkin(skinName)`  
skinName: `modern`, `classic`, `familiar`, `abstract`, `uno`.  
Кнопка меню на данный момент меняет скин, потому что меню нет.

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