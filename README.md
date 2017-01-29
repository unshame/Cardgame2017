# Cardgame2017 - тест мультиплеера  

1. Зарегистрироваться на сайте и скинуть мне название аккаунта     
1. Установить GitShell https://git-scm.com/downloads  
2. Клонировать репозиторий в GitShell: git clone https://github.com/unshame/Cardgame2017.git  
3. Установить node.js https://nodejs.org/en/  
4. Установить необходимые библиотеки через Node.js command prompt в папку с репозиторием:  
  * cd директорияУстановки  
  * npm install express  
  * npm install engine.io  
  * npm install eureca.io  
5. Запустуть сервер через Node.js command prompt: 
  * node server.js  
6. Узнать локальный ip адрес
  * WinKey + R  
  * cmd  
  * ipconfig  
  * Запомнить IP4-адрес  
7. В браузере открыть IP4-адрес:8000 
8. Должно быть так:   
![Test](https://i.imgur.com/0FKyJMi.jpg "Test")  
И если нажать F12:  
![DevConsole](https://i.imgur.com/HyQXwbl.png "F12 Developer Console")  
  
Полезные команды в консоли:  
* isInDebugMode = true - включает лог сообщений от сервера (см. картинку выше)  
* controller.toggleDebugMode() - включает дебаг при перетаскивании карт  