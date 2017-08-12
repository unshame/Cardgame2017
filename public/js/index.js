// Entry point

//@include:global
//@include:fonts
//@include:loc
//@include:types

//@include:ActionHandler
//@include:Card
//@include:CardControl
//@include:CardEmitter
//@include:CardManager
//@include:ConnectionManager
//@include:Field
//@include:FieldBuilder
//@include:FieldManager
//@include:Game
//@include:StateManager
//@include:State
//@include:ScaleManager
//@include:PlayerManager
//@include:Sequencer
//@include:SkinManager
//@include:UI
//@include:MessageFeed

var inDebugMode = localStorage.getItem('durak_debug') == 'true';

// Глобальные модули

/**
* Менеджер полей
* @type {FieldManager}
* @global
*/
var fieldManager = new FieldManager(inDebugMode);

/**
* Обработчик действий сервера.
* @type {ActionHandler}
* @global
*/
var actionHandler = new ActionHandler('play', actionReactions, notificationReactions);

/**
* Менеджер игроков.
* @type {PlayerManager}
* @global
*/
var playerManager = new PlayerManager();

/**
* Менеджер интерфейса.
* @type {UI}
* @global
*/
var ui = new UI();

/**
* Менеджер скинов.
* @type {SkinManager}
* @global
*/
var skinManager = new SkinManager('modern');

/**
* Менеджер карт
* @type {CardManager}
* @global
*/
var cardManager = new CardManager(inDebugMode);

/**
* Контроллер карт
* @type {CardControl}
* @global
*/
var cardControl = new CardControl(inDebugMode);

/**
* Менеджер соединения с сервером
* @type {ConnectionManager}
* @global
*/
var connection = new ConnectionManager(serverMethods, clientMethods, 'menu', inDebugMode);

// Глобальные модули, создаваемые в game.initialize
var cardEmitter;

/**
* Игра
* @type {Game}
* @global
*/
var game = new Game('cardgame', 1, inDebugMode);
game.state.add(stateMenu, false, false);
game.state.add(statePlay, false, false);
// Запускаем загрузку игры
game.state.add(stateBoot, true, true);	