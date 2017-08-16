// Перезапись существующих функций Phaser.Game.prototype

/**
* Создает и бутит все модули игры.
* Перезапись `Phaser.Game.prototype.boot`.
*/
Game.prototype.boot = function(){

    if (this.isBooted)
    {
        return;
    }

    this.onPause = new Phaser.Signal();
    this.onResume = new Phaser.Signal();
    this.onBlur = new Phaser.Signal();
    this.onFocus = new Phaser.Signal();

    this.isBooted = true;

    PIXI.game = this;

    this.math = Phaser.Math;

    /**
     * Менеджер размера и масштаба.
     * @type {ScaleManager}
     */
    this.scale = new ScaleManager({
        game: this,
    	width: this._width,
    	height: this._height,
        debug: options.get('debug_grid')
    });
    this.stage = new Phaser.Stage(this);

    this.setUpRenderer();

    this.world = new Phaser.World(this);
    this.add = new Phaser.GameObjectFactory(this);
    this.make = new Phaser.GameObjectCreator(this);
    this.cache = new Phaser.Cache(this);
    this.load = new Phaser.Loader(this);
    this.time = new Phaser.Time(this);
    this.tweens = new Phaser.TweenManager(this);
    this.input = new Phaser.Input(this);
    this.sound = new Phaser.SoundManager(this);
    this.physics = new Phaser.Physics(this, this.physicsConfig);
    this.particles = new Phaser.Particles(this);
    this.create = new Phaser.Create(this);
    this.plugins = new Phaser.PluginManager(this);
    this.net = new Phaser.Net(this);

    this.time.boot();
    this.time.advancedTiming = this.inDebugMode; // Для вывода FPS

    this.stage.boot();
    this.world.boot();

    this.scale.boot();
    // Форсим свойства ScaleManager
    this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    this.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;

    this.input.boot();
    this.sound.boot();
    this.state.boot();

    if (this.config['enableDebug'])
    {
        this.debug = new Phaser.Utils.Debug(this);
        this.debug.boot();
    }
    else
    {
        this.debug = { preUpdate: function () {}, update: function () {}, reset: function () {} };
    }

    this.showDebugHeader();

    this.isRunning = true;

    if (this.config && this.config['forceSetTimeOut'])
    {
        this.raf = new Phaser.RequestAnimationFrame(this, this.config['forceSetTimeOut']);
    }
    else
    {
        this.raf = new Phaser.RequestAnimationFrame(this, false);
    }

    this._kickstart = true;

    if (window['focus'])
    {
        if (!window['PhaserGlobal'] || (window['PhaserGlobal'] && !window['PhaserGlobal'].stopFocus))
        {
            window.focus();
        }
    }

    this.raf.start();

};

/**
* Обрабатывает переданный конфиг. 
* Перезапись `Phaser.Game.prototype.parseConfig`. 
* @param  {object} config конфиг
*/
Game.prototype.parseConfig = function (config) {

    this.config = config;

    if (config['enableDebug'] === undefined)
    {
        this.config.enableDebug = true;
    }

    if (config['width'])
    {
        this._width = config['width'];
    }

    if (config['height'])
    {
        this._height = config['height'];
    }

    if (config['renderer'])
    {
        this.renderType = config['renderer'];
    }

    if (config['parent'])
    {
        this.parent = config['parent'];
    }

    if (config['transparent'] !== undefined)
    {
        this.transparent = config['transparent'];
    }

    if (config['antialias'] !== undefined)
    {
        this.antialias = config['antialias'];
    }

    if (config['resolution'])
    {
        this.resolution = config['resolution'];
    }

    if (config['preserveDrawingBuffer'] !== undefined)
    {
        this.preserveDrawingBuffer = config['preserveDrawingBuffer'];
    }

    if (config['physicsConfig'])
    {
        this.physicsConfig = config['physicsConfig'];
    }

    var seed = [(Date.now() * Math.random()).toString()];

    if (config['seed'])
    {
        seed = config['seed'];
    }

    this.rnd = new Phaser.RandomDataGenerator(seed);

    var state = null;

    if (config['state'])
    {
        state = config['state'];
    }

    this.state = new StateManager(this);

};
