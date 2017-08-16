var PlayerBadge = function(field, name){
	Phaser.Group.call(this, game, null, name);
	this.field = field;
	this.status = game.add.text(0, 0, '', {fill: 'white', font: '24px Exo'}, this);
	this.name = game.add.text(0, 0, name, {fill: 'white', font: '24px Exo'}, this);
	this.nameText = name;
	this.statusText = '';
	
	this.updatePosition();
};

extend(PlayerBadge, Phaser.Group);

PlayerBadge.prototype.updatePosition = function(){
	var field = this.field;
	var width = this.field.area.width;
	var align = this.field.style.badgeAlign;
	switch(align){
		case 'top':
		this.name.x = 0;
		this.name.y = 0;

		this.status.x = field.area.width;
		this.status.y = 0;

		this.name.anchor.set(0, 1);
		this.status.anchor.set(1, 1);
		break;

		case 'bottom':
		this.name.x = 0;
		this.name.y = field.area.height;

		this.status.x = field.area.width;
		this.status.y = field.area.height;

		this.name.anchor.set(0, 0);
		this.status.anchor.set(1, 0);
		break;

		case 'left':
		this.name.x = 0;
		this.name.y = 0;

		this.status.x = 0;
		this.status.y = field.area.height;

		this.name.anchor.set(0, 1);
		this.status.anchor.set(0, 0);
		
		width = this.field.area.width + Math.min(game.screenWidth - (this.field.x + width), 0);
		break;

		case 'right':
		this.name.x = field.area.width;
		this.name.y = 0;

		this.status.x = field.area.width;
		this.status.y = field.area.height;

		this.name.anchor.set(1, 1);
		this.status.anchor.set(1, 0);
		width = this.field.area.width + Math.min(this.field.x, 0);
		break;

		default:
		console.error('PlayerBadge: invalid align', align);
		break;
	}
	this._limitTextWidth(this.name, this.nameText, width);
	this._limitTextWidth(this.status, this.statusText, width);
};

PlayerBadge.prototype._limitTextWidth = function(textDisplay, text, width){
	textDisplay.setText(text);
	if(textDisplay.width > width){
		textDisplay.setText(text + '...');
		while(textDisplay.width > width && text.length > 3){
			text = text.slice(0, -1);
			textDisplay.setText(text + '...');
		}
	}
};
