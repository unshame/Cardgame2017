
/**
* Позиционирует меню и элементы.
* @param {object} [position] новая позиция меню `{x, y}`.
*/
Menu.prototype.updatePosition = function(position){
	this._resize();

	if(position){
		this.options.position = position;
	}
	else{
		position = this.options.position;
	}

	if(typeof position == 'function'){
		position = position(this.background.width, this.background.height);
	}

	this.x = position.x - this.background.width/2;
	this.y = position.y - this.background.height/2;

	var y = 0,
		margin = this.options.margin,
		menuWidth = this.background.width - margin*2;


	this.layout.forEach(function(row, ri){
		var rowVisible = false;
		var offset = 0;
		row.forEach(function(element, ei){
			if(element.visible){
				rowVisible = true;
				var align;
				switch(row.align){
					case 'left':
					align = 0;
					break;

					case 'right':
					align = menuWidth - row.width;
					break;

					default:
					align = (menuWidth - row.width)/2;
					break;
				}
				var ex = margin + align + margin*ei + offset;
				var ey = margin + y + row.height/2 - element.height/2;
				element.updatePosition({x: ex, y: ey});
			}
			offset += element.width;
		}, this);
		if(!rowVisible){
			return;
		}

		y += row.height + margin;

	}, this);
};

/**
* Устанавливает размер фона меню в соответствии с элементами.
*/
Menu.prototype._resize = function(){
	var maxWidth = 0,
		height = 0,
		margin = this.options.margin;

	this.layout.forEach(function(row, ri){
		var width = 0;
		var maxHeight = 0;
		var rowHeight = 0;
		row.forEach(function(element, ei){
			var h = this.hiddenElements.indexOf(element);

			if(element.visible && ~h){
				element.hide();
			}
			else if(!element.visible && !~h){
				element.show();
			}

			if(!element.visible){
				return;
			}

			width += element.width;

			if(ei < row.length - 1){
				width += margin;
			}

			if(maxHeight < element.height + margin){
				maxHeight = element.height + margin;
				rowHeight = element.height;
			}
		}, this);
		height += maxHeight;
		row.height = rowHeight;
		row.width = width;
		if(maxWidth < width){
			maxWidth = width;
		}
	}, this);

	this._createArea(maxWidth + margin*2, height + margin);
};

/**
* Рисует фон меню.
*/
Menu.prototype._createArea = function(width, height){

	drawPanel(this._bitmapArea, width, height, 0, 0, this.options.color);

	this.background.loadTexture(this._bitmapArea);	
};
