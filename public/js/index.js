// Entry point

/* jshint unused:false */

//@include:global
//@include:fonts
//@include:loc
//@include:types

//@include:OptionManager
//@include:ActionHandler
//@include:Card
//@include:ConnectionManager
//@include:UI
//@include:Field
//@include:Game
//@include:State
//@include:ScaleManager
//@include:GameInfo
//@include:Sequencer
//@include:SkinManager
//@include:MessageFeed
//@include:Badge

// Глобальные модули
var gameOptions,
	actionHandler,
	gameInfo,
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
	gameOptions = new OptionManager(appName, containerName);

	/**
	* Менеджер игроков.
	* @type {GameInfo}
	* @global
	*/
	gameInfo = new GameInfo();

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
	skinManager = new SkinManager(gameOptions.get('ui_skin'));

	/**
	* Контроллер карт
	* @type {CardControl}
	* @global
	*/
	cardControl = new CardControl(gameOptions.get('debug_control'));


	/**
	* Менеджер соединения с сервером
	* @type {ConnectionManager}
	* @global
	*/
	connection = new ConnectionManager(serverMethods, clientMethods, 'menu', gameOptions.get('debug_connection'));
	
	/**
	* Обработчик действий сервера.
	* @type {ActionHandler}
	* @global
	*/
	actionHandler = new ActionHandler();
	actionHandler.addChannel('primary', CHANNEL_TYPE.RESPOND, 'play', reactPrimary);
	actionHandler.addChannel('secondary', CHANNEL_TYPE.INTERRUPT, 'play', reactSecondary);
	actionHandler.addChannel('possible_actions', CHANNEL_TYPE.USER_INVOLVED, 'play');
	actionHandler.addChannel('extra', CHANNEL_TYPE.NO_ACTION, 'play', reactExtra);
	actionHandler.addChannel('queue', CHANNEL_TYPE.INTERRUPT, 'queue', reactQueue, ['menu', 'play', 'credits']);
	actionHandler.addChannel('menu', CHANNEL_TYPE.NO_ACTION, 'menu', reactMenu, ['credits']);
	actionHandler.addChannel('system', CHANNEL_TYPE.NO_ACTION, null, reactSystem);

	/**
	* Игра
	* @type {Game}
	* @global
	*/
	game = new Game(containerName, 1, gameOptions.get('debug_game'));
	
	// Phaser плагины
	game.add.plugin(PhaserInput.Plugin);

	// Состояния игры
	game.state.add(stateMenu, false, false);
	game.state.add(statePlay, false, false);
	game.state.add(stateQueue, false, false);
	game.state.add(stateCredits, false, false);
	// Запускаем загрузку игры
	game.state.add(stateBoot, true, true);	

	// Останавливаем анимацию загрузки из index.html
	window.gameCreated = true;
});
