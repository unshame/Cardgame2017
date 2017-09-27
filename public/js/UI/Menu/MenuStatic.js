// Статические методы меню

/**
* Возвращает объект с настройками кнопки ({@link UI.Button}) для передачи в {@link Menu#createLayout}.
* @static
* @param  {object} options настройки кнопки
*/
Menu.button = function(options){
	return {
		type: 'button',
		options: options
	};
};

/**
* Возвращает объект с настройками кнопки с текстом при наведении ({@link UI.ButtonPopup}) для передачи в {@link Menu#createLayout}.
* @static
* @param  {object} options настройки кнопки
*/
Menu.buttonPopup = function(options){
	return {
		type: Phaser.Device.desktop ? 'buttonPopup' : 'button',
		options: options
	};
};

Menu.stepper = function(options){
	return {
		type: 'stepper',
		options: options
	};
};

/**
* Элементы будут выравнены по левому краю.
* @static
* @see {@link Menu.align}
* @param {(array|...object)} options опции элементов меню
* @return {array} Возвращает массив с настройками элементов и флагом выравнивания.
*/
Menu.alignLeft = function(){
	return Menu.align('left', arguments);
};

/**
* Элементы будут выравнены по правому краю.
* @static
* @see {@link Menu.align}
* @param {(array|...object)} options опции элементов меню
* @return {array} Возвращает массив с настройками элементов и флагом выравнивания.
*/
Menu.alignRight = function(){
	return Menu.align('right', arguments);
};

/**
* Первый элемент будет выравнен по левому краю, последний - по правому, остальные - по центру.
* @static
* @see {@link Menu.align}
* @param {(array|...object)} options опции элементов меню
* @return {array} Возвращает массив с настройками элементов и флагом выравнивания.
*/
Menu.alignJustify = function(){
	return Menu.align('justify', arguments);
};

/**
* Четные элементы будут выравнены по левому краю, нечетные - по правому.
* @static
* @see {@link Menu.align}
* @param {(array|...object)} options опции элементов меню
* @return {array} Возвращает массив с настройками элементов и флагом выравнивания.
*/
Menu.alignAlternate = function(){
	return Menu.align('alternate', arguments);
};

/**
* Возвращает массив с настройками элементов для передачи в {@link Menu#createLayout}
* с установленным флагом выравневания.
* @static
* @param {string}            align   значения флага выравнивания
* @param {(array|...object)} options опции элементов меню
*
* @return {array} Возвращает массив с настройками элементов и флагом выравнивания.
*/
Menu.align = function(align, options){
	var row;
	if(options){
		if(!Array.isArray(options[0])){
			row = [];
			for(var i = 0, len = options.length; i < len; i++){
				row.push(options[i]);
			}
		}
		else{
			row = options[0];
		}
	}
	else{
		row = [];
	}
	row.align = align;
	return row;
};

/**
* Рисует панель с закругленными углами.
* @static
* @param {Phaser.BitmapData} bitmap где рисовать
* @param {number}            width  ширина
* @param {number}            height высота
* @param {number}            x      отступ по краям по горизонтали
* @param {number}            y      отступ по краям по вертикали
* @param {string}            color  цвет панели
* @param {(boolean|number)}  header нужно ли рисовать шапку для названия меню
*/
Menu.drawPanel = function(bitmap, width, height, x, y, color, header, headerColor){
	var ctx = bitmap.ctx;
	var corner = game.cache.getImage('panel_' + color + '_corners');
	var cs = 8;
	var bs = 2;
	var dif = cs - bs*2;
	var colors = ui.colors.menu[color];
	var offset = 0;
	if(header){
		if(typeof header == 'number' && !isNaN(header)){
			offset = header;
		}
		else{
			offset = 40;
		}
		height += offset;
	}
	bitmap.clear();
	bitmap.resize(width, height);

	if(header){
		var headerCorner = game.cache.getImage('panel_' + headerColor + '_corners');
		var headerColors = ui.colors.menu[headerColor];

		ctx.fillStyle = headerColors.background;
		ctx.fillRect(x + bs, y + bs, width - x*2 - bs*2, offset + cs);

		ctx.drawImage(headerCorner, 0, 0, cs, cs, x, y, cs, cs);
		ctx.drawImage(headerCorner, cs, 0, cs, cs, width - x*2 - cs, y, cs, cs);

		ctx.fillStyle = headerColors.outer;
		ctx.fillRect(x + cs, y, width - x*2 - cs*2, bs);
		ctx.fillRect(x, y + cs, bs, offset + cs);
		ctx.fillRect(width - x - cs + dif + bs, y + cs, bs, offset + cs);

		ctx.fillStyle = headerColors.inner;
		ctx.fillRect(x + cs, y + bs, width - x*2 - cs*2, bs);	
		ctx.fillRect(x + bs, y + cs, bs, offset + cs);
		ctx.fillRect(width - x - cs + dif, y + cs, bs, offset + cs);
	}

	ctx.fillStyle = colors.background;
	ctx.fillRect(x + bs, offset + y + bs, width - x*2 - bs*2, height - offset - y*2 - bs*2);

	ctx.drawImage(corner, 0, 0, cs, cs, x, offset + y, cs, cs);
	ctx.drawImage(corner, cs, 0, cs, cs, width - x*2 - cs, offset + y, cs, cs);
	ctx.drawImage(corner, 0, cs, cs, cs, x, height - y*2 - cs, cs, cs);
	ctx.drawImage(corner, cs, cs, cs, cs, width - x*2 - cs, height - y*2 - cs, cs, cs);

	ctx.fillStyle = colors.outer;
	ctx.fillRect(x + cs, offset + y, width - x*2 - cs*2, bs);	
	ctx.fillRect(x + cs, height - y - cs + dif + bs, width - x*2 - cs*2, bs);	
	ctx.fillRect(x, offset + y + cs, bs, height - offset - y*2 - cs*2);
	ctx.fillRect(width - x - cs + dif + bs, offset + y + cs, bs, height - offset - y*2 - cs*2);

	ctx.fillStyle = colors.inner;
	ctx.fillRect(x + cs, offset + y + bs, width - x*2 - cs*2, bs);	
	ctx.fillRect(x + cs, height - y - cs + dif, width - x*2 - cs*2, bs);	
	ctx.fillRect(x + bs, offset + y + cs, bs, height - offset - y*2 - cs*2);
	ctx.fillRect(width - x - cs + dif, offset + y + cs, bs, height - offset - y*2 - cs*2);

	bitmap.update();
};

/**
* Рисует прямоугольник с загругленными углами.
* @param {Phaser.BitmapData}      bitmap      где рисовать
* @param {number}                 width       ширина
* @param {number}                 height      высота
* @param {number}                 x           отступ по краям по горизонтали
* @param {number}                 y           отступ по краям по вертикали
* @param {number}                 radius      радиус углов
* @param {number}                 lineWidth   ширина рамки
* @param {number}                 alpha       прозрачность заливки
* @param {(string|CanvasPattern)} fillStyle   стиль заливки
* @param {(string|CanvasPattern)} strokeStyle стиль рамки
*/
Menu.drawRoundedRectangle = function(bitmap, width, height, x, y, radius, lineWidth, alpha, fillStyle, strokeStyle){
	var ctx = bitmap.ctx;
	x += lineWidth/2;
	y += lineWidth/2;
	bitmap.clear();		
	bitmap.resize(width, height);
	width -= x*2;
	height -= y*2;
	ctx.beginPath();
	ctx.fillStyle = fillStyle;
	ctx.strokeStyle = strokeStyle;
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
	ctx.globalAlpha = alpha;
	ctx.fill();
	ctx.globalAlpha = 1;
	bitmap.update();
};