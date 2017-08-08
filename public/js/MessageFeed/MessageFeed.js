
var MessageFeed = function(game){
	this.styles = {
		system: {fill: 'white', font: '30px Exo'},
		warning: {fill: 'red', font: '40px Exo'}
	};

	this.fadeTime = 300;

	Phaser.Group.call(this, game);
};

MessageFeed.prototype = Object.create(Phaser.Group.prototype);
MessageFeed.prototype.constructor = MessageFeed;

MessageFeed.prototype.newMessage = function(message, style, time){
	if(typeof style == 'string'){
		style = this.styles[style];
	}

	var text = this.game.make.text(ui.rope.width + 10, this._getLowestY(), message, style);
	if(time !== undefined){
		text.endTime = Date.now() + time;
	}
	text.setShadow(2, 2, 'rgba(0,0,0,0.8)', 2);
	text.anchor.set(0, 1);
	text.alpha = 0;

	text.fadeTween = this.game.add.tween(text);
	text.fadeTween.to({alpha: 1}, this.fadeTime, Phaser.Easing.Quadratic.Out, true);

	this.shiftMessages(text.height);
	this.add(text);

	return text;
};

MessageFeed.prototype.removeMessage = function(text){
	if(!~this.children.indexOf(text)){
		return;
	}
	text.endTime = Date.now();
	this.update();
};

MessageFeed.prototype.clear = function(){
	var i = this.children.length;
	while (i--){
		this.children[i].endTime = Date.now();
	}
};

MessageFeed.prototype._getLowestY = function(){
	return this.game.screenHeight - 10;
};

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

MessageFeed.prototype._destroyMessage = function(text){
	if(text.fadeTween){
		text.fadeTween.stop();
	}
	if(text.moveTween){
		text.moveTween.stop();
	}
	this.remove(text, true);
};

MessageFeed.prototype._fadeOutMessage = function(text){
	text.destroyTime = Date.now() + this.fadeTime;
	if(text.fadeTween){
		text.fadeTween.stop();
	}
	text.fadeTween = this.game.add.tween(text);
	text.fadeTween.to({alpha: 0}, this.fadeTime, Phaser.Easing.Quadratic.Out, true);
};

MessageFeed.prototype.shiftMessages = function(y){
	if(y === undefined){
		y = 0;
	}
	y = this._getLowestY() - y;
	for(var i = this.children.length - 1; i >= 0; i--){
		var text = this.children[i];
		if(text.destroyTime !== undefined){
			continue;
		}
		if(text.moveTween){
			text.moveTween.stop();
		}
		text.moveTween = this.game.add.tween(text.position);
		text.moveTween.to({y: y}, 300, Phaser.Easing.Quadratic.Out, true);
		y -= text.height;
	}
};
