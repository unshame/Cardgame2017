# Cardgame2017

Развернул тестовую версию на хостинге - https://durak.herokuapp.com/

## Установка
1. Зарегистрироваться на сайте и скинуть мне название аккаунта     
1. Установить GitHub Desktop https://desktop.github.com/  
2. Авторизоваться в нем
2. Клонировать репозиторий в GitShell (идет с GitHub Desktop): git clone https://github.com/unshame/Cardgame2017.git  
3. Установить node.js https://nodejs.org/en/  
4. Установить необходимые библиотеки через Node.js command prompt в папку с репозиторием:  
  * cd директорияУстановки  
  * npm install express  
  * npm install engine.io  
  * npm install eureca.io  
5. Запустуть сервер через Node.js command prompt: 
  * node server.js  
7. В браузере открыть localhost:5000
8. Должно быть так:   
![Test](https://i.imgur.com/0Bx0esu.png  "Test")  
И если нажать F12:  
![DevConsole](https://i.imgur.com/HyQXwbl.png "F12 Developer Console")  
  
## Полезные команды в консоли:  
* isInDebugMode = true - включает лог сообщений от сервера (см. картинку выше)  
* controller.toggleDebugMode() - переключает дебаг при перетаскивании карт  
* spotManager.toggleDebugMode() - переключает дебаг полей карт
* Средний клик на карте, потом в консоли Chrome правый клик на появившейся строчке -> Store as global var, чтобы получить прямой доступ к карте

## Скины:  
* skinManager.setSkin('modern') - по дефолту
* skinManager.setSkin('classic') - "классический" скин
* skinManager.setSkin('familiar') - лучше даже не пробовать

## Что сделано clientside:  
* Конструктор карт (Card)  
* Конструктор полей карт (Spot)  
* Частично контроллер (Controller)
* Частично менеджер полей (SpotManager)  
* Частично менеджер скинов (SkinManager)  

## Что нужно сделать clientside:  
* AppManager  
* ConnectionManager
* LobbyManager  
* GameManager  
* UI  
* Chat  

## Что сделано serverside:  
* Конструктор игры (Game)  

## Что нужно сделать serverside:
* Конструктор лобби (Lobby)  
* Менеджер лобби (LobbyManager\LobbyBrowser)  
* Менеджер сервера и соединения с игроками (Server)  
* Конструктор чата (Chat)  