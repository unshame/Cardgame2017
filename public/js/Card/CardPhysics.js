Card.prototype.enablePhysics = function(makeDraggable){
	if(this.mover){
		this.setDraggability(false);
		this._shouldEnablePhysics = makeDraggable ? 2 : 1;
		return;
	}
	this._shouldEnablePhysics = false;
	if(makeDraggable){
		this.setDraggability(true);
	}
	else{
		this.setDraggability(false);
	}
	this.game.physics.arcade.enable(this.sprite);
	this.sprite.body.velocity = {x: Math.random()*100 - 50, y: Math.random()*100 - 50};
	this.sprite.body.drag = {x: Math.random()*25, y: Math.random()*25};
	this.sprite.body.angularVelocity = Math.random()*20 - 10;
	this.sprite.body.angularDrag = Math.random()*5;
};

Card.prototype.disablePhysics = function(){
	this._shouldEnablePhysics = false;
	if(this.sprite.body){
		this.sprite.body.destroy();
	}
};
