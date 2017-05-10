/*
 * Измененные методы Phaser
 */

//Партиклям присваивается случайный угол
Phaser.Particles.Arcade.Emitter.prototype.emitParticle = function (x, y, key, frame) {

    if (x === undefined) { x = null; }
    if (y === undefined) { y = null; }

    var particle = this.getFirstExists(false);

    if (particle === null)
    {
        return false;
    }

    var rnd = this.game.rnd;

    if (key !== undefined && frame !== undefined)
    {
        particle.loadTexture(key, frame);
    }
    else if (key !== undefined)
    {
        particle.loadTexture(key);
    }

    var emitX = this.emitX;
    var emitY = this.emitY;

    if (x !== null)
    {
        emitX = x;
    }
    else if (this.width > 1)
    {
        emitX = rnd.between(this.left, this.right);
    }

    if (y !== null)
    {
        emitY = y;
    }
    else if (this.height > 1)
    {
        emitY = rnd.between(this.top, this.bottom);
    }

    particle.reset(emitX, emitY);

    particle.angle = Math.floor(Math.random()*360-180);
    particle.lifespan = this.lifespan;

    if (this.particleBringToTop)
    {
        this.bringToTop(particle);
    }
    else if (this.particleSendToBack)
    {
        this.sendToBack(particle);
    }

    if (this.autoScale)
    {
        particle.setScaleData(this.scaleData);
    }
    else if (this.minParticleScale !== 1 || this.maxParticleScale !== 1)
    {
        particle.scale.set(rnd.realInRange(this.minParticleScale, this.maxParticleScale));
    }
    else if ((this._minParticleScale.x !== this._maxParticleScale.x) || (this._minParticleScale.y !== this._maxParticleScale.y))
    {
        particle.scale.set(rnd.realInRange(this._minParticleScale.x, this._maxParticleScale.x), rnd.realInRange(this._minParticleScale.y, this._maxParticleScale.y));
    }

    if (frame === undefined)
    {
        if (Array.isArray(this._frames))
        {
            particle.frame = this.game.rnd.pick(this._frames);
        }
        else
        {
            particle.frame = this._frames;
        }
    }

    if (this.autoAlpha)
    {
        particle.setAlphaData(this.alphaData);
    }
    else
    {
        particle.alpha = rnd.realInRange(this.minParticleAlpha, this.maxParticleAlpha);
    }

    particle.blendMode = this.blendMode;

    var body = particle.body;

    body.updateBounds();

    body.bounce.copyFrom(this.bounce);
    body.drag.copyFrom(this.particleDrag);

    body.velocity.x = rnd.between(this.minParticleSpeed.x, this.maxParticleSpeed.x);
    body.velocity.y = rnd.between(this.minParticleSpeed.y, this.maxParticleSpeed.y);
    body.angularVelocity = rnd.between(this.minRotation, this.maxRotation);

    body.gravity.y = this.gravity;
    body.angularDrag = this.angularDrag;

    particle.onEmit();

    return true;

};

//disableVisibilityChange = true по умолчанию
var PhaserStage = Phaser.Stage.prototype;
Phaser.Stage = function (game) {

    this.game = game;

    PIXI.DisplayObjectContainer.call(this);

    this.name = '_stage_root';

    this.disableVisibilityChange = true;

    this.exists = true;

    this.worldTransform = new PIXI.Matrix();

    this.stage = this;

    this.currentRenderOrderID = 0;

    this._hiddenVar = 'hidden';

    this._onChange = null;

    this._bgColor = { r: 0, g: 0, b: 0, a: 0, color: 0, rgba: '#000000' };

    if (!this.game.transparent)
    {
        this._bgColor.a = 1;
    }

    if (game.config)
    {
        this.parseConfig(game.config);
    }

};

Phaser.Stage.prototype = PhaserStage;