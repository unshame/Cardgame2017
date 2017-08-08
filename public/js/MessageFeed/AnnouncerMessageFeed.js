/**
* Отображает важные временные сообщения по центру экрана.
* Также отличается от {@link MessageFeed} стилями сообщений и 
* тем, что старые сообщения уменьшаются в размере.
* @param {Game} game игра
* @param {string} [name] имя фида
* @class 
* @extends {MessageFeed}
*/
var AnnouncerMessageFeed = function(game, name){

	MessageFeed.call(this, game);

	/**
	* Стили текста.
	* @type {Object}
	* @property {object} system Красный текст 50px
	* @property {object} important Красный текст 100px
	*/
	this.styles = {
		'system': {fill: 'red', font: '50px Exo'},
		'important': {fill: 'red', font: '100px Exo'}
	};

	/**
	* Имя фида для {@link UILayers}.
	* @type {string}
	*/
	this.name = name || 'announcer';

	/**
	* Масштаб сообщений.
	* @private
	* @type {Array}
	*/
	this._scales = [1, 0.75, 0.5, 0.25, 0];
};

AnnouncerMessageFeed.prototype = Object.create(MessageFeed.prototype);
AnnouncerMessageFeed.prototype.constructor = AnnouncerMessageFeed;

AnnouncerMessageFeed.prototype._createText = function(message, style){
	var text = this.game.make.text(this._getX(), this._getLowestY(), message, style);
	text.setShadow(2, 2, 'rgba(0,0,0,0.8)', 2);
	text.anchor.set(0.5, 0.5);
	return text;
};

AnnouncerMessageFeed.prototype._getX = function(){
	return this.game.screenWidth/2;
};

AnnouncerMessageFeed.prototype._getLowestY = function(){
	return this.game.screenHeight/2 - 100;
};

AnnouncerMessageFeed.prototype._destroyMessage = function(text){
	if(text.scaleTween){
		text.scaleTween.stop();
	}
	Object.getPrototypeOf(AnnouncerMessageFeed.prototype)._destroyMessage.call(this, text);
};

AnnouncerMessageFeed.prototype._moveMessage = function(text, i, ii, y){
	if(text.moveTween){
		text.moveTween.stop();
	}
	if(text.scaleTween){
		text.scaleTween.stop();
	}

	var len = this.children.length;
	ii = Math.min(len - 1 - ii, 4);
	var scale = this._scales[ii];

	text.moveTween = this.game.add.tween(text.position);
	text.moveTween.to({y: y}, this.fadeTime, Phaser.Easing.Quadratic.Out, true);

	text.scaleTween = this.game.add.tween(text.scale);
	text.scaleTween.to({x: scale, y: scale}, this.fadeTime, Phaser.Easing.Quadratic.Out, true);
};