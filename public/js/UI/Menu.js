var Menu = function(position, z, name){
	this.background = game.add.image(0, 0);
	this.base = ui.layers.addLayer(z, name || 'menu', true);	
	this.position = position;
	this.margin = 50;
	this.opened = true;

	this.base.add(this.background);
	this.buttons = [];
	this.buttonsByName = {};
};

Menu.prototype.addButton = function (action, name, text, context) {
	var button = new Button({
		color: 'grey',
		size: 'wide',
		action: action,
		text: text,
		name: name,
		context: (context === false) ? null : this,
		group: this.base
	});
	this.buttonsByName[name] = button;
	this.buttons.push(button);
	this.update();
};

Menu.prototype.resize = function(){
	var width = 0,
		height = 0;

	for (var i = 0; i < this.buttons.length; i++) {
		var button = this.buttons[i];
		height += button.height;
		if(i < this.buttons.length - 1)
			height += this.margin;
		if(width < button.width)
			width = button.width;
	}

	this.createArea(width + this.margin*2, height + this.margin*2);
};

Menu.prototype.updatePosition = function(position){
	if(position){
		this.position = position;
	}
	else{
		position = this.position;
	}
	if(typeof position == 'function'){
		position = position();
	}
	this.base.x = position.x - this.background.width/2;
	this.base.y = position.y - this.background.height/2;
	for (var i = 0; i < this.buttons.length; i++) {
		var button = this.buttons[i];
		var y = 0;
		for (var k = 0; k < i; k++) {
			y += this.buttons[k].height + this.margin;
		}
		button.updatePosition({x: this.background.width/2 - button.width/2, y: y + this.margin});
	}
};

Menu.prototype.update = function(){
	this.resize();
	this.updatePosition();
	if(!this.opened)
		this.hide();
};

Menu.prototype.hide = function(){
	this.opened = false;
	this.background.visible = false;
	for (var i = 0; i < this.buttons.length; i++) {
		this.buttons[i].hide();
	}
};

Menu.prototype.show = function(){
	this.opened = true;
	this.background.visible = true;
	for (var i = 0; i < this.buttons.length; i++) {
		this.buttons[i].show();
	}
	this.update();
};
Menu.prototype.toggle = function(){
	if(this.opened)
		this.hide();
	else
		this.show();
};
Menu.prototype.createArea = function(width, height){
	var radius = 10,
		lineWidth = 4,
		x =  lineWidth/2,
		y =  lineWidth/2;
		
	var area = this._bitmapArea;
	if(!area){
		area = game.make.bitmapData(width, height);
	}
	else{
		area.clear();		
		area.resize(width, height);
	}
	width -= x*2;
	height -= y*2;
	area.ctx.beginPath();
	area.ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
	area.ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
	area.ctx.lineWidth = lineWidth;
	area.ctx.moveTo(x + radius, y);
	area.ctx.lineTo(x + width - radius, y);
	area.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
	area.ctx.lineTo(x + width, y + height - radius);
	area.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
	area.ctx.lineTo(x + radius, y + height);
	area.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
	area.ctx.lineTo(x, y + radius);
	area.ctx.quadraticCurveTo(x, y, x + radius, y);
	area.ctx.fill();
	area.ctx.stroke();
	area.update();

	this.background.loadTexture(area);
	this._bitmapArea = area;
};