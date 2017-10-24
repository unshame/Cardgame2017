/**
* Отображает сообщения о игровых событиях чуть выше центра экрана.
* Также отличается от {@link MessageFeed} стилями сообщений и 
* тем, что старые сообщения уменьшаются в размере.
* @param {Game}   game   игра
* @param {string} [name] имя фида
* @class 
* @extends {MessageFeed}
*/
MessageFeed.EventFeed = function(game, name){

	MessageFeed.call(this, game);

	/**
	* Стили текста.
	* @type {Object}
	* @property {object} system Красный текст 50px
	*/
	this.styles = {
		'system': {
			fill: ui.colors.menu.red.background, 
			stroke: ui.colors.menu.red.outer, 
			font: '50px Exo, Helvetica', 
			strokeThickness: 2, 
			wordWrap: true,
			align: 'center'
		},
		'positive': {
			fill: ui.colors.menu.green.background, 
			stroke: ui.colors.menu.green.outer, 
			font: '50px Exo, Helvetica',
			strokeThickness: 2, 
			wordWrap: true,
			align: 'center'
		},
		'neutral': {
			fill: ui.colors.menu.orange.background, 
			stroke: ui.colors.menu.orange.outer, 
			font: '50px Exo, Helvetica',
			strokeThickness: 2, 
			wordWrap: true,
			align: 'center'
		}
	};

	this.name = name || 'eventFeed';

	/**
	* Масштаб сообщений.
	* @type {Array}
	*/
	this._scales = [1, 0.75];
};

extend(MessageFeed.EventFeed, MessageFeed);

MessageFeed.EventFeed.prototype._styleText = function(text){
	text.setShadow(2, 2, 'rgba(0,0,0,1)', 5);
	text.anchor.set(0.5, 0.5);
};

MessageFeed.EventFeed.prototype._getX = function(){
	return this.game.screenWidth/2;
};

MessageFeed.EventFeed.prototype._getLowestY = function(){
	return game.scale.cellRelation < 2.1 ? game.scale.cellAt(0, 4).y : this.game.screenHeight*0.25;
};

MessageFeed.EventFeed.prototype._destroyMessage = function(text){
	if(text.scaleTween){
		text.scaleTween.stop();
	}
	supercall(MessageFeed.EventFeed)._destroyMessage.call(this, text);
};

MessageFeed.EventFeed.prototype._moveMessage = function(text, i, ii, x, y){
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