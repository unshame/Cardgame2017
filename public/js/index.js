// Entry point

//@include:global
//@include:fonts
//@include:loc
//@include:types

//@include:OptionManager
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
//@include:PlayerBadge

// Глобальные модули

var appName = 'durak';
var containerName = 'cardgame';

/**
* Менеджер настроек.
* @global
* @type {OptionManager}
*/
var options = new OptionManager(appName, containerName);

/**
* Менеджер полей
* @type {FieldManager}
* @global
*/
var fieldManager = new FieldManager(options.get('debug_fields'));

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
var skinManager = new SkinManager(options.get('ui_skin'));

/**
* Контроллер карт
* @type {CardControl}
* @global
*/
var cardControl = new CardControl(options.get('debug_control'));

/**
* Менеджер соединения с сервером
* @type {ConnectionManager}
* @global
*/
var connection = new ConnectionManager(serverMethods, clientMethods, 'menu', options.get('debug_connection'));

// Глобальные модули, создаваемые в game.initialize
var cardEmitter,
	cardManager;

/**
* Игра
* @type {Game}
* @global
*/
var game = new Game(containerName, 1, options.get('debug_game'));
game.state.add(stateMenu, false, false);
game.state.add(statePlay, false, false);
// Запускаем загрузку игры
game.state.add(stateBoot, true, true);	

// Останавливаем анимацию загрузки из index.html
window.gameCreated = true;