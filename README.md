Развернул тестовую версию на хостинге - [durak.herokuapp.com](https://durak.herokuapp.com/).

## Установка  

2. Клонировать `git clone https://github.com/unshame/Cardgame2017.git`    
3. Установить [node.js](https://nodejs.org/en/)     
4. Установить необходимые библиотеки через Node.js command prompt в папку с репозиторием:  
    * `cd директорияУстановкиРепозитория`  
    * `npm i`  
5. Запустуть сервер через Node.js command prompt: 
    * `node server`    
7. В браузере открыть `localhost:5000`  
8. Должно быть так:   
![Test](https://i.imgur.com/U5ECBIX.png  "Test")  
И если нажать F12:  
![DevConsole](https://i.imgur.com/HyQXwbl.png "F12 Developer Console")  
9. `npm run setupDev` установит глобальные модули для герерации отчетов по коду и документации (см. ниже).

## Полезные команды в консоли  
* `connection.isInDebugMode = true` - включает лог сообщений от сервера (как показано выше) 
* `cardControl.toggleDebugMode()` - переключает дебаг при перетаскивании карт  
* `fieldmanager.toggleDebugMode()` - переключает дебаг полей карт
* `cardManager.toggleDebugMode()` - дебаг карт
* `grid.toggleDebugMode()` - дебаг сетки
* `game.toggleDebugMode()` или кнопка Debug - дебаг всего
* Средний клик на карте, потом в консоли Chrome правый клик на появившейся строчке -> `Store as global var`, чтобы получить прямой доступ к карте

## Скины  
`skinManager.setSkin(skinName)`  
skinName: `modern`, `classic`, `familiar`, `abstract`, `uno`.

## Документация  
`npm run makeDoc` генерирует документацию из комментариев в папке doc при помощи [JSDoc](http://usejsdoc.org/).
Тестовая версия загружена на [durak.heroku.com/doc/client/](https://durak.heroku.com/doc/client/).

## Валидация кода  
`npm run report` создает отчеты по коду в папке report при помощи [plato](https://github.com/es-analysis/plato). Там можно посмотреть ошибки линтинга и сложность кода.  

## Что нужно сделать clientside  
* Доделать все существующие модули  
* LobbyManager  
* UI   
* Документация  

## Что нужно сделать serverside  
* Доделать существующие модули 
* Конструктор лобби (Lobby)  
* Менеджер лобби (LobbyManager\LobbyBrowser)  

## P.S.
Я у себя локально мерджнул проект с базовым репозиторием для разворота приложения на heroku.com, а потом оказалось, что тот репозиторий копировался вместе со всеми коммитами. Из-за этого тут теперь коммиты с 2012 года.
