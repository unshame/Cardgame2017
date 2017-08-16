// Entry point

/* jshint unused:false */

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
var options,
	actionHandler,
	playerManager,
	ui,
	skinManager,
	cardControl,
	connection,
	game;

// Глобальные модули, создаваемые в game.initialize
var fieldManager,
	cardEmitter,
	cardManager;

// Создаем модули, когда Phaser.Device инициализировался,
// чтобы знать на каком типе девайса запущена игра
Phaser.Device.whenReady(function(){

	var appName = 'durak';
	var containerName = 'cardgame';

	/**
	* Менеджер настроек.
	* @global
	* @type {OptionManager}
	*/
	options = new OptionManager(appName, containerName);

	/**
	* Обработчик действий сервера.
	* @type {ActionHandler}
	* @global
	*/
	actionHandler = new ActionHandler('play', actionReactions, notificationReactions);

	/**
	* Менеджер игроков.
	* @type {PlayerManager}
	* @global
	*/
	playerManager = new PlayerManager();

	/**
	* Менеджер интерфейса.
	* @type {UI}
	* @global
	*/
	ui = new UI();

	/**
	* Менеджер скинов.
	* @type {SkinManager}
	* @global
	*/
	skinManager = new SkinManager(options.get('ui_skin'));

	/**
	* Контроллер карт
	* @type {CardControl}
	* @global
	*/
	cardControl = new CardControl(options.get('debug_control'));

	/**
	* Менеджер соединения с сервером
	* @type {ConnectionManager}
	* @global
	*/
	connection = new ConnectionManager(serverMethods, clientMethods, 'menu', options.get('debug_connection'));

	/**
	* Игра
	* @type {Game}
	* @global
	*/
	game = new Game(containerName, 1, options.get('debug_game'));
	game.state.add(stateMenu, false, false);
	game.state.add(statePlay, false, false);
	// Запускаем загрузку игры
	game.state.add(stateBoot, true, true);	

	// Останавливаем анимацию загрузки из index.html
	window.gameCreated = true;
});
