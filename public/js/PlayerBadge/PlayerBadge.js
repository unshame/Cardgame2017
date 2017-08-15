var PlayerBadge = function(field, name, align){
	Phaser.Group.call(this, game, null, name);
	this.field = field;
	this.align = align;
	this.status = game.add.text(0, 0, '', {fill: 'white', font: '30px Exo'}, this);
	this.name = game.add.text(0, 0, name, {fill: 'white', font: '30px Exo'}, this);

	this.updatePosition();
};

extend(PlayerBadge, Phaser.Group);

PlayerBadge.prototype.updatePosition = function(){
	var field = this.field;
	switch(this.align){
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
		this.name.y = field.area.height;

		this.status.x = 0;
		this.status.y = 0;

		this.name.anchor.set(0, 0);
		this.status.anchor.set(0, 1);

		break;

		case 'right':
		this.name.x = field.area.width;
		this.name.y = field.area.height;

		this.status.x = field.area.width;
		this.status.y = 0;

		this.name.anchor.set(1, 0);
		this.status.anchor.set(1, 1);
		break;

		default:
		console.error('PlayerBadge: invalid align', this.align);
		break;
	}
}

