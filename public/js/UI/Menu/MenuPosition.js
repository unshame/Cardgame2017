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

	var y = this.options.header ? this.options.headerHeight : 0,
		margin = this.options.margin,
		menuWidth = this.background.width - margin*2;


	this.layout.forEach(function(row, ri){
		var rowVisible = false;
		var offset = 0;
		row.forEach(function(element, ei){
			var elWidth = element.fixedWidth !== undefined ? element.fixedWidth : element.width;
			var elHeight = element.fixedHeight !== undefined ? element.fixedHeight : element.height;
			if(element.visible){
				rowVisible = true;
				var align = this._calculateAlign(row, ei, menuWidth);
				var ex = margin + align + margin*ei + offset;
				var ey = margin + y + row.height/2 - elHeight/2;
				element.updatePosition({x: ex, y: ey});
			}
			offset += elWidth;
		}, this);
		if(!rowVisible){
			return;
		}

		y += row.height + margin;

	}, this);

	this.specialElements.forEach(function(el){
		el.updatePosition();
	});

	if(this.header){
		this.header.x = this.background.width/2;
		this.header.y = this.options.headerHeight/2 + 4;
	}
};

/**
* Возвращает отступ для выравнивания элемента.
* @return {number}
*/
Menu.prototype._calculateAlign = function(row, i, menuWidth){
	var rowAlign = row.align,
		rowWidth = row.width,
		rowLength = row.length;
	switch(rowAlign){
		case 'justify':
		switch(i){
			case 0:
			rowAlign = 'left';
			break;

			case (rowLength - 1):						
			rowAlign = 'right';
			break;

			default:
			rowAlign = 'center';
			break;
		}
		break;

		case 'special':
		rowAlign = row.aligns[i];
		break;

		case 'alternate':
		rowAlign = ((i % 2) == 1) ? 'right' : 'left';
	}
	switch(rowAlign){

		case 'left':
		return 0;

		case 'right':
		return menuWidth - rowWidth;

		default:
		return (menuWidth - rowWidth)/2;
	}
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

			var elWidth = element.fixedWidth !== undefined ? element.fixedWidth : element.width;
			var elHeight = element.fixedHeight !== undefined ? element.fixedHeight : element.height;

			width += elWidth;

			if(ei < row.length - 1){
				width += margin;
			}

			if(maxHeight < elHeight + margin){
				maxHeight = elHeight + margin;
				rowHeight = elHeight;
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

	Menu.drawPanel(
		this._bitmapArea, 
		width, 
		height, 
		0, 
		0, 
		this.options.color, 
		this.options.header && this.options.headerHeight, 
		this.options.headerColor
	);
};
