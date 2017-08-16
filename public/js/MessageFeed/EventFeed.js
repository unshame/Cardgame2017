/**
* Отображает сообщения о игровых событиях чуть выше центра экрана.
* Также отличается от {@link MessageFeed} стилями сообщений и 
* тем, что старые сообщения уменьшаются в размере.
* @param {Game}   game   игра
* @param {string} [name] имя фида
* @class 
* @extends {MessageFeed}
*/
var EventFeed = function(game, name){

	MessageFeed.call(this, game);

	/**
	* Стили текста.
	* @type {Object}
	* @property {object} system Красный текст 50px
	* @property {object} important Красный текст 100px
	*/
	this.styles = {
		'system': {fill: 'red', font: '50px Exo'},
		'positive': {fill: 'green', font: '50px Exo'},
		'important': {fill: 'red', font: '100px Exo'}
	};

	this.name = name || 'eventFeed';

	/**
	* Масштаб сообщений.
	* @private
	* @type {Array}
	*/
	this._scales = [1, 0.75, 0.5];
};

extend(EventFeed, MessageFeed);

EventFeed.prototype._styleText = function(text){
	text.setShadow(2, 2, 'rgba(0,0,0,0.8)', 2);
	text.anchor.set(0.5, 0.5);
};

EventFeed.prototype._getX = function(){
	return this.game.screenWidth/2;
};

EventFeed.prototype._getLowestY = function(){
	return this.game.screenHeight*0.25;
};

EventFeed.prototype._destroyMessage = function(text){
	if(text.scaleTween){
		text.scaleTween.stop();
	}
	Object.getPrototypeOf(EventFeed.prototype)._destroyMessage.call(this, text);
};

EventFeed.prototype._moveMessage = function(text, i, ii, x, y){
	if(text.moveTween){
		text.moveTween.stop();
	}
	if(text.scaleTween){
		text.scaleTween.stop();
	}

	var len = this.children.length;
	ii = len - 1 - ii;

	// Удаляем сообщения, для которых не задан масштаб
	if(ii >= this._scales.length){
		this.removeMessage(text);
	}

	var scale = this._scales[ii] || 0;

	text.moveTween = this.game.add.tween(text);
	text.moveTween.to({x: x, y: y, alpha: scale}, this.fadeTime, Phaser.Easing.Quadratic.Out, true);

	text.scaleTween = this.game.add.tween(text.scale);
	text.scaleTween.to({x: scale, y: scale}, this.fadeTime, Phaser.Easing.Quadratic.Out, true);
};