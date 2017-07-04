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
        debug: this.inDebugMode
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
    this.stage.boot();
    this.world.boot();
    this.scale.boot();
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

}

