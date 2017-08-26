var PopupManager = function(){
	Phaser.Group.call(this, game, null, 'popupManager');

	this.delay = null;
	this.delayTime = 200;

	this.margin = 10;

	this.showing = false;

	this.background = game.make.image(0, 0);
	this.add(this.background);
	this._bitmapData = game.make.bitmapData();
	this.text = game.add.text(0, 0, 'Test popup', {fill: 'black', font: '18px Exo', wordWrap: true, wordWrapWidth: 250, align: 'center'}, this);
	this.text.anchor.set(0.5, 0.5);
	this.text.setShadow(1, 1, 'rgba(0,0,0,0.5)', 3);
	this.visible = false;
};

extend(PopupManager, Phaser.Group);

PopupManager.prototype.hoverOver = function(el, text, now){
	if(this.overElement == el){
		return;
	}
	this.overElement = el;
	this.overText = text;
	this._resetDelay();
	if(now){
		this._showPopup();
	}
	else{
		this.delay = setTimeout(this._showPopup.bind(this), this.delayTime);
	}
};

PopupManager.prototype.hoverOut = function(){
	if(!this.overElement){
		return;
	}
	if(this.showing){
		this.showing = false;
		this.visible = false;
	}
	this.overElement = null;
	this.overText = null;
	this._resetDelay();
};


PopupManager.prototype._showPopup = function(){
	this.showing = true;
	this._updateText(this.overText);
	this.updatePosition();
};

PopupManager.prototype._updateText = function(text){
	this.text.setText(text);
	Menu.drawPanel(
		this._bitmapData, 
		this.text.width + this.margin*2, 
		this.text.height + this.margin*2, 
		0, 
		0, 
		'grey'
	);
	this.background.loadTexture(this._bitmapData);

	this.text.x = this.background.width/2;
	this.text.y = this.background.height/2 + 3;
}

PopupManager.prototype.updatePosition = function(){
	if(!this.showing){
		return;
	}
	if(!ui.cursor.inGame){
		this.hoverOut();
		return;
	}
	if(!this.visible){
		this.visible = true;
	}
	var text = this.overElement.getHoverText();
	if(text){
		this._updateText(text);
	}
	var x = Math.max(Math.min(game.input.x - this.background.width/2, game.screenWidth - this.background.width), 0);
	var y = Math.min(game.input.y - this.background.height - 5, game.screenHeight - this.background.height);
	if(y < 0){
		y = Math.max(game.input.y + ui.cursor.height + 5, 0);
	}
	this.x = x;
	this.y = y;
};

PopupManager.prototype.update = function(){
	this.updatePosition();
}

PopupManager.prototype._resetDelay = function(){
	if(this.delay){
		clearTimeout(this.delay);
		this.delay = null;
	}
};


