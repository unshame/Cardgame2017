var Menu = function(options){
	this.options = mergeOptions(this.getDefaultOptions(), options);

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
	this.hiddenElements = [];

	this._bitmapArea = game.make.bitmapData();
	if(this.options.texture){
		var image = game.cache.getImage(this.options.texture);
		this.pattern = this._bitmapArea.ctx.createPattern(image, 'repeat');
	}
};

Menu.prototype.getDefaultOptions = function(){
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
		texture: null,
		elementColor: 'orange',
		textColor: 'white',
		corner: 10,
		border: 4
	};
};

Menu.prototype.getByName = function (name) {
	return this.elementsByName[name];
}

Menu.prototype.hideElement = function(name){
	var el = this.elementsByName[name];
	if(!el)
		return;
	this.hiddenElements.push(el);
	if(this.opened){
		el.hide();
		this.update();
	}
}

Menu.prototype.showElement = function(name){
	var el = this.elementsByName[name];
	var i = this.hiddenElements.indexOf(el);
	if(!el || !~i)
		return;
	this.hiddenElements.splice(i, 1);
	if(this.opened){
		el.show();
		this.update();
	}
}

Menu.prototype.addButton = function (action, name, text, context) {
	var button = new Button({
		color: this.options.elementColor,
		textColor: this.options.textColor,
		size: 'wide',
		action: action,
		text: text,
		name: name,
		context: (context === false) ? undefined : (context || this),
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
		if(~this.hiddenElements.indexOf(this.elements[i]))
			continue;
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
	var radius = this.options.corner,
		lineWidth = this.options.border,
		x =  lineWidth/2,
		y =  lineWidth/2;
		
	var background = this._bitmapArea,
		ctx = background.ctx;
	background.clear();		
	background.resize(width, height);
	width -= x*2;
	height -= y*2;
	ctx.beginPath();
	ctx.fillStyle = this.pattern || 'rgba(255, 255, 255, 1)';
	ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
	ctx.lineWidth = lineWidth;
	ctx.moveTo(x + radius, y);
	ctx.lineTo(x + width - radius, y);
	ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
	ctx.lineTo(x + width, y + height - radius);
	ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
	ctx.lineTo(x + radius, y + height);
	ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
	ctx.lineTo(x, y + radius);
	ctx.quadraticCurveTo(x, y, x + radius, y);
	ctx.stroke();
	ctx.globalAlpha = this.options.alpha;
	ctx.fill();
	ctx.globalAlpha = 1;
	background.update();

	this.background.loadTexture(background);	
};