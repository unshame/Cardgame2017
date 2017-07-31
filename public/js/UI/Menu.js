var Menu = function(options){
	this.options = Menu.getDefaultOptions();
	for(var o in options){
		if(options.hasOwnProperty(o) && options[o] !== undefined){
			this.options[o] = options[o];
		}
	}

	this.background = game.add.image(0, 0);
	this.background.visible = false;
	this.background.tint = this.options.color || ui.colors.orange;

	this.position = this.options.position;
	this.margin = this.options.margin;
	this.opened = false;

	this.base = ui.layers.addLayer(this.options.z, this.options.name, true);	
	this.base.add(this.background);

	this.elements = [];
	this.elementsByName = {};
};

Menu.getDefaultOptions = function(){
	return {
		position: {
			x: 0,
			y: 0
		},
		z: 0,
		margin: 25,
		name: 'default',
		alpha: 0.8,
		color: ui.colors.orange,
		elementColor: 'orange',
		textColor: 'white'
	};
};

Menu.prototype.addButton = function (action, name, text, context) {
	var button = new Button({
		color: this.options.elementColor,
		textColor: this.options.textColor,
		size: 'wide',
		action: action,
		text: text,
		name: name,
		context: (context === false) ? undefined : this,
		group: this.base
	});
	this.elementsByName[name] = button;
	this.elements.push(button);
	if(!this.opened){
		button.hide();
	}
	this.update();
};

Menu.prototype.resize = function(){
	var width = 0,
		height = 0;

	for (var i = 0; i < this.elements.length; i++) {
		var element = this.elements[i];
		if(element.visible && !this.opened){
			element.hide();
		}
		if(!element.visible)
			continue;
		height += element.height;
		if(i < this.elements.length - 1){
			height += this.margin;
		}
		if(width < element.width){
			width = element.width;
		}
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
	var y = 0;
	for (var i = 0; i < this.elements.length; i++) {
		var element = this.elements[i];
		if(!element.visible)
			continue;
		element.updatePosition({x: this.background.width/2 - element.width/2, y: y + this.margin});
		y += element.height + this.margin;
	}
};

Menu.prototype.update = function(){
	if(!this.opened)
		return;
	this.resize();
	this.updatePosition();
};

Menu.prototype.hide = function(){
	this.opened = false;
	this.background.visible = false;
	for (var i = 0; i < this.elements.length; i++) {
		this.elements[i].hide();
	}
};

Menu.prototype.show = function(){
	this.opened = true;
	this.background.visible = true;
	for (var i = 0; i < this.elements.length; i++) {
		this.elements[i].show();
	}
	this.update();
};
Menu.prototype.toggle = function(){
	if(this.opened){
		this.hide();
	}
	else{
		this.show();
	}
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
	area.ctx.fillStyle = 'rgba(255, 255, 255, ' + this.options.alpha + ')';
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