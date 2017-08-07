var NotificationManager = function(){
	this.styles = {
		system: {fill: 'white', font: '30px Exo'},
		warning: {fill: 'red', font: '40px Exo'}
	}

	Phaser.Group.call(this, game);
};

NotificationManager.prototype = Object.create(Phaser.Group.prototype);
NotificationManager.prototype.constructor = NotificationManager;

NotificationManager.prototype.newMessage = function(message, style, time){
	if(typeof style == 'string'){
		style = this.styles[style];
	}
	var text = game.make.text(ui.rope.width + 10, this.getLowestY(), message, style);
	if(time != undefined){
		text.endTime = Date.now() + time;
	}
	text.anchor.set(0, 1)
	text.alpha = 0;
	text.fadeTween = game.add.tween(text);
	text.fadeTween.to({alpha: 1}, 300, Phaser.Easing.Quadratic.Out, true);
	this.shiftMessages(text.height);
	this.add(text);
	return text;
};

NotificationManager.prototype.removeMessage = function(text){
	if(!~this.children.indexOf(text)){
		return;
	}
	text.endTime = Date.now();
	this.update();
}

NotificationManager.prototype.clear = function(){
	var i = this.children.length;
	while (i--){
		this.children[i].endTime = Date.now();
	}
}

NotificationManager.prototype.getLowestY = function(){
	return game.screenHeight - 10;
}

NotificationManager.prototype.update = function(){

	var i = this.children.length;
	var now = Date.now();

	while (i--){
		var text = this.children[i];
		if(text.destroyTime !== undefined){
			if(text.destroyTime <= now){
				this.remove(text, true);
			}
		}
		else if(text.endTime !== undefined && text.endTime <= now){
			var fadeTime = 300;
			text.destroyTime = now + fadeTime;
			if(text.moveTween){
				text.moveTween.stop();
				text.moveTween = null;
			}
			if(text.fadeTween){
				text.fadeTween.stop();
			}
			text.fadeTween = game.add.tween(text);
			text.fadeTween.to({alpha: 0}, fadeTime, Phaser.Easing.Quadratic.Out, true);
			this.shiftMessages();
		}
	}

};

NotificationManager.prototype.shiftMessages = function(y){
	if(y === undefined){
		y = 0;
	}
	y = this.getLowestY() - y;
	for(var i = this.children.length - 1; i >= 0; i--){
		var text = this.children[i];
		if(text.destroyTime !== undefined){
			continue;
		}
		if(text.moveTween){
			text.moveTween.stop();
		}
		text.moveTween = game.add.tween(text.position);
		text.moveTween.to({y: y}, 300, Phaser.Easing.Quadratic.Out, true);
		y -= text.height;
	}
};