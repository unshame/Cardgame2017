/**
* Отображает временные сообщения в нижнем левом углу экрана.
* @param {Game} game игра
* @param {string} [name] имя фида
* @class 
* @extends {Phaser.Group}
*/
var MessageFeed = function(game, name){

	/**
	* Стили текста.
	* @type {Object}
	* @property {object} system Белый текст 30px
	* @property {object} warning Красный текст 40px
	*/
	this.styles = {
		system: {fill: 'white', font: '30px Exo'},
		warning: {fill: 'red', font: '40px Exo'}
	};

	/**
	* Время фейда сообщений.
	* @type {Number}
	*/
	this.fadeTime = 300;

	Phaser.Group.call(this, game);

	/**
	* Имя фида для {@link UILayers}.
	* @type {string}
	*/
	this.name = name || 'feed';
};

MessageFeed.prototype = Object.create(Phaser.Group.prototype);
MessageFeed.prototype.constructor = MessageFeed;

/**
* Выводит новое сообщение.
* @param  {string} message Сообщение.
* @param  {string|object} [style='system']   Стиль сообщения - объект со свойствами текста
*                                            или строка, соответствующая стилю из {@link MessageFeed#styles}.
* @param  {number} [time]  Время, после которого сообщение пропадет.
*                          Если не указать, сообщение нужно вручную удалять, 
*                          передавая в {@link MessageFeed#removeMessage}.  
*                          Может быть вторым параметром, вместо `style`.
* @return {Phaser.Text}    Созданный текст объект с сообщением.
*/
MessageFeed.prototype.newMessage = function(message, style, time){
	if(typeof style == 'number'){
		time = style;
		style = undefined;
	}
	if(style === undefined){
		style = 'system';
	}
	if(typeof style == 'string'){
		style = this.styles[style];
	}

	var text = this._createText(message, style);
	if(time !== undefined){
		text.endTime = Date.now() + time;
	}

	this.add(text);
	this._fadeInMessage(text);
	this.shiftMessages();

	return text;
};

/**
* Создает текстовый элемент и применяет к нему стиль.
* @private
* @param  {string} message Сообщение.
* @param  {object} style   Стиль.
* @return {Phaser.Text}    Текстовый элемент.
*/
MessageFeed.prototype._createText = function(message, style){
	var text = this.game.make.text(this._getX(), this._getLowestY(), message, style);
	this._styleText(text);
	return text;
};

/**
* Применяет дополнительные стили к тексту.
* @private
*/
MessageFeed.prototype._styleText = function(text){
	text.setShadow(2, 2, 'rgba(0,0,0,0.8)', 2);
	text.anchor.set(0, 1);
};

/**
* Возвращает позицию сообщений по горизонтали.
* @private
* @return {number} Позиция по горизонтали.
*/
MessageFeed.prototype._getX = function(){
	return ui.rope.width + 10;
};

/**
* Возвращает позицию, над которой отображаются новые сообщения.
* @private
* @return {number} Позиция по вертикали.
*/
MessageFeed.prototype._getLowestY = function(){
	return this.game.screenHeight - 10;
};

/**
* Удаляет переданное отображаемое сообщение, устанавливая его `endTime` на текущее время.
* @param  {Phaser.Text} text Сообщение, которое нужно удалить.
*/
MessageFeed.prototype.removeMessage = function(text){
	if(!~this.children.indexOf(text) || text.destroyTime !== undefined){
		return;
	}
	text.endTime = Date.now();
	this.update();
};

/**
* Удаляет все отображаемые сообщения, устанавливая их `endTime` на текущее время.
*/
MessageFeed.prototype.clear = function(){
	var i = this.children.length;
	while (i--){
		var text = this.children[i];
		if(text.destroyTime === undefined){
			text.endTime = Date.now();
		}
	}
};

/**
* Фейдид и удаляет сообщения, время жизни которых истекло.
*/
MessageFeed.prototype.update = function(){

	var i = this.children.length;
	var now = Date.now();

	while (i--){
		var text = this.children[i];
		if(text.destroyTime !== undefined){
			if(text.destroyTime <= now){
				this._destroyMessage(text);
			}
		}
		else if(text.endTime !== undefined && text.endTime <= now){
			this._fadeOutMessage(text);
			this.shiftMessages();
		}
	}

};

/**
* Удаляет сообщение.
* @private
* @param  {Phaser.Text} text Текст для удаления.
*/
MessageFeed.prototype._destroyMessage = function(text){
	if(text.fadeTween){
		text.fadeTween.stop();
	}
	if(text.moveTween){
		text.moveTween.stop();
	}
	this.remove(text, true);
};

/**
* Фейдид сообщение перед удалением.
* @private
* @param  {Phaser.Text} text Текст.
*/
MessageFeed.prototype._fadeOutMessage = function(text){
	text.destroyTime = Date.now() + this.fadeTime;
	if(text.fadeTween){
		text.fadeTween.stop();
	}
	text.fadeTween = this.game.add.tween(text);
	text.fadeTween.to({alpha: 0}, this.fadeTime, Phaser.Easing.Quadratic.Out, true);
};

/**
* Фейдид сообщение при добавлении.
* @private
* @param  {Phaser.Text} text Текст.
*/
MessageFeed.prototype._fadeInMessage = function(text){
	text.alpha = 0;
	text.fadeTween = this.game.add.tween(text);
	text.fadeTween.to({alpha: 1}, this.fadeTime, Phaser.Easing.Quadratic.Out, true);
};

/**
* Устанавливает правильные позиции сообщениям.
*/
MessageFeed.prototype.shiftMessages = function(){
	var y = this._getLowestY();
	var x = this._getX();
	var i, ii;
	for(i = ii = this.children.length - 1; i >= 0; i--){
		var text = this.children[i];
		if(text.destroyTime !== undefined){
			continue;
		}
		this._moveMessage(text, i, ii, x, y);
		y -= text.height/Math.min(text.scale.y, 1);
		ii--;
	}
};

/**
* Передвигает сообщение в заданную позицию.
* @private
* @param  {Phaser.Text} text Сообщение.
* @param  {number} i    Реальный индекс сообщения в `MessageFeed#children`.
* @param  {number} ii   Индекс сообщения не учитывая сообщения с установленным `destroyTime`.
* @param  {number} y    Позиция сообщения по вертикали.
*/
MessageFeed.prototype._moveMessage = function(text, i, ii, x, y){
	if(text.moveTween){
		text.moveTween.stop();
	}
	text.moveTween = this.game.add.tween(text.position);
	text.moveTween.to({x: x, y: y}, this.fadeTime, Phaser.Easing.Quadratic.Out, true);
};

//@include:AnnouncementFeed
//@include:EventFeed