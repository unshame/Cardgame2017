var AnnouncementFeed = function(game, name){

	MessageFeed.call(this, game);

	/**
	* Стили текста.
	* @type {Object}
	* @property {object} system Красный текст 50px
	* @property {object} important Красный текст 100px
	*/
	this.styles = {
		'system': {fill: 'darkorange', font: '100px Exo'}
	};

	this.name = name || 'AnnouncementFeed';
};

AnnouncementFeed.prototype = Object.create(MessageFeed.prototype);
AnnouncementFeed.prototype.constructor = AnnouncementFeed;

AnnouncementFeed.prototype._styleText = function(text){
	text.setShadow(2, 2, 'rgba(0,0,0,0.8)', 2);
	text.anchor.set(0.5, 0.5);
};

AnnouncementFeed.prototype._getX = function(){
	return this.game.screenWidth/2;
};

AnnouncementFeed.prototype._getLowestY = function(){
	return this.game.screenHeight/2;
};

AnnouncementFeed.prototype.update = function(){

	var i = this.children.length;
	var now = Date.now();

	while (i--){
		var text = this.children[i];
		if(text.destroyTime !== undefined){
			if(text.destroyTime <= now){
				this._destroyMessage(text);
				this.shiftMessages();
			}
		}
		else if(this.children.indexOf(text) === 0 && text.endTime !== undefined && text.endTime <= now){
			this._fadeOutMessage(text);
		}
	}

};

AnnouncementFeed.prototype._fadeInMessage = function(text){
	text.addTime = Date.now();
	if(this.children.indexOf(text) === 0){
		Object.getPrototypeOf(AnnouncementFeed.prototype)._fadeInMessage.call(this, text);
	}
	else{
		text.alpha = 0;
	}
};

AnnouncementFeed.prototype.removeMessage = function(text){
	if(!~this.children.indexOf(text) || text.destroyTime !== undefined){
		return;
	}
	text.endTime = text.addTime = Date.now();
	this.update();
};

AnnouncementFeed.prototype.clear = function(){
	var i = this.children.length;
	while (i--){
		var text = this.children[i];
		if(i === 0){
			if(text.destroyTime === undefined){
				text.endTime = Date.now();
			}
		}
		else{
			this._destroyMessage(text);
		}
	}
};

AnnouncementFeed.prototype._moveMessage = function(text, i, ii, x, y){
	if(!text.fadeTween && text.alpha === 0 && this.children.indexOf(text) === 0){
		if(text.addTime !== undefined && text.endTime !== undefined){
			text.endTime = Date.now() + (text.endTime - text.addTime);
			text.addTime = undefined;
		}
		Object.getPrototypeOf(AnnouncementFeed.prototype)._fadeInMessage.call(this, text);
	}
};