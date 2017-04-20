/*
 * Модуль, создающий поля для FieldManager
 */

var FieldBuilder = function(manager){

	this.manager = manager;

	this.offsets = {};
	this.minActiveSpaces = {};
	this.positions = {};
	this.dimensions = {};

	this.tableOrder = [4, 2, 0, 1, 3, 5];
};

//Рассчитывает размеры полей
FieldBuilder.prototype.calculateSizes = function(numOfCards){
	this.calculateGeneralSizes(numOfCards);
	this.calculateSpecificSizes();
};

//Обобщенные размеры
FieldBuilder.prototype.calculateGeneralSizes = function(numOfCards){

	var defaultFieldOptions = Field.prototype.getDefaultOptions();

	//Отступы
	this.offsets = {
		DECK: 22,					//Колода		
		DISCARD_PILE: 22,			//Стопка сброса		
		player: 10,				//Поле игрока пока не известен id игрока
		table: 4,				//Первое поле на столе		
		opponent: [10, 10, 10]	//Первые поля соперника
	};

	//Минимальное место для расположения карт в поле
	this.minActiveSpaces = {
		DECK: numOfCards/2,
		DISCARD_PILE: numOfCards/2,
		player: defaultFieldOptions.minActiveSpace,
		table: skinManager.skin.trumpOffset,
		opponent: [
			defaultFieldOptions.minActiveSpace,
			defaultFieldOptions.minActiveSpace,
			defaultFieldOptions.minActiveSpace
		]
	};

	var halfRows = Math.floor(grid.numRows / 2),
		halfDensity = Math.floor(grid.density / 2);

	//Кол-во колонок и отступы для рук противников и мест на столе
	var tableCells = this.tableCells = this.opponentPlacement[0] ? Math.round(grid.numCols - 4 - grid.density * 1.5) : grid.numCols - 2,
		tableOffset = this.tableOffset = this.offsets.table * 2,

		numRows = Math.round(grid.numRows - grid.density*2 + halfDensity - 4),
		opponentCells = this.opponentCells = [
			numRows,
			grid.numCols - grid.density*4 - 2,
			numRows
		],
		opponentsOffset = this.opponentsOffset = [
			(grid.cellHeight + this.offsets.opponent[0] * 2 ),
			(grid.cellWidth + this.offsets.opponent[1] * 2 ),
			(grid.cellHeight + this.offsets.opponent[2] * 2 )
		];
	if(tableCells <= 0){
		console.warn('Field builder: Negative amount of columns for field table (', tableCells, '), defaulting to 0\n', this);
		tableCells = 0;
	}
	for(var i = 0; i < opponentCells.length; i++){
		if(opponentCells[i] <= 0){
			console.warn('Field builder: Negative amount of columns for field opponent[', i, '] (', opponentCells[i], '), defaulting to 0\n', this);
			opponentCells[i] = 0;
		}
	}

	//Размеры полей (по умолчанию равны размерам карты)
	this.dimensions = {
		DECK:{
			//width: ,
			//height: 
		},
		DISCARD_PILE: {
			//width: ,
			//height: 
		},

		//Поле игрока пока не известен id игрока
		player: {
			width: (grid.numCols - 2)*grid.cellWidth,
			//height: 
		},

		table: {
			width: (tableCells * grid.cellWidth - tableOffset * (this.tableOrder.length - 1)) / this.tableOrder.length
			//height:
		},

		//Размер первого поля соперника
		opponent: [
			{
				//width: , 
				height: (opponentCells[0] * grid.cellHeight - opponentsOffset[0] * (this.opponentPlacement[0] - 1)) / this.opponentPlacement[0]
			},
			{
				width: (opponentCells[1] * grid.cellWidth - opponentsOffset[1] * (this.opponentPlacement[1] - 1)) / this.opponentPlacement[1]
				//height: 
			},
			{
				//width: , 
				height: (opponentCells[2] * grid.cellHeight - opponentsOffset[2] * (this.opponentPlacement[2] - 1)) / this.opponentPlacement[2]
			}
		]
	};

	//Позиции полей
	this.positions = {
		DECK: grid.at(
			grid.density + 3,
			-(halfDensity - 1),
			-this.offsets.DECK,
			-this.offsets.DECK
		),
		DISCARD_PILE: grid.at(
			grid.numCols - grid.density - 3,
			-(halfDensity - 1),
			-this.offsets.DISCARD_PILE,
			-this.offsets.DISCARD_PILE
		),
		player: grid.at(
			1,
			grid.numRows - grid.density - 1,
			-this.offsets.player,
			-this.offsets.player
		),
		table: grid.at(
			this.opponentPlacement[0] ? 1 + grid.density : 1,
			halfRows - 1,
			-this.offsets.table,
			-this.offsets.table,
			'middle left'
		),
		opponent: [
			grid.at(
				grid.density,
				grid.numRows - grid.density - 2,
				-this.offsets.opponent[0],
				-this.offsets.opponent[0]
			),
			grid.at(
				Math.floor(grid.density*2) + 1,
				-(halfDensity - 1),
				-this.offsets.opponent[1],
				-this.offsets.opponent[1]
			),
			grid.at(
				grid.numCols - grid.density,
				grid.density,
				-this.offsets.opponent[0],
				-this.offsets.opponent[0]
			),
		]
	};

	//Выравниваем некоторые поля по левому краю
	this.positions.DECK.x -= skinManager.skin.height;
	this.positions.opponent[0].x -= skinManager.skin.height;
};

//Размеры для каждого поля
FieldBuilder.prototype.calculateSpecificSizes = function(){

	var tableOffset = this.tableOffset,
		i, x, y, id;

	//Table
	var width = this.dimensions.table.width;
	for(i = 0; i < this.tableOrder.length; i++){
		id = 'TABLE' + this.tableOrder[i];
		x = this.positions.table.x + (width + tableOffset)*i;
		y = this.positions.table.y;

		this.positions[id] = {x: x, y: y};
		this.dimensions[id] = {width: width};		
		this.notEnoughSpace(id, 'table');
	}

	//Player
	this.positions[this.manager.pid] = {
		x: this.positions.player.x,
		y: this.positions.player.y
	};
	this.dimensions[this.manager.pid] = {
		width:this.dimensions.player.width
	};
	this.notEnoughSpace(this.manager.pid, 'player');

	//Opponents
	this.calculateOpponentSizes();
};

//Размеры для полей противников
FieldBuilder.prototype.calculateOpponentSizes = function(){
	var opponentsOffset = this.opponentsOffset,
		i = this.manager.pi + 1,	//индекс первого противника по кругу после игрока
		oi = 0,	//Счетчик размещенных полей
		pi = 0;	//Индекс позиции для размещения

	var dimensions = this.dimensions.opponent,
		placement = this.opponentPlacement.map(function(v){
			return v;
		}),

		//Данные для разных позиций
		directions = ['backward', 'forward', 'forward'],
		flipped = [false, true, true],
		axis = ['vertical', 'horizontal', 'vertical'],
		addTo = ['back', 'front', 'front'],
		xs = [
			0,
			dimensions[1].width + opponentsOffset[1],
			0
		],
		ys = [
			-(dimensions[0].height + opponentsOffset[0]),
			0,
			dimensions[2].height + opponentsOffset[2]
		];

	if(i >= this.manager.players.length)
		i = 0;
	
	while(i != this.manager.pi){

		if(!placement[pi]){
			pi++;
			oi = 0;
		}

		var p = this.manager.players[i],
			x = this.positions.opponent[pi].x + xs[pi]*oi,
			y = this.positions.opponent[pi].y + ys[pi]*oi;

		if(directions[pi] == 'backward'){
			if(axis[pi] == 'horizontal')
				x -= dimensions[pi].width;
			else
				y -= dimensions[pi].height;
		}

		this.positions[p.id] = {
			x: x,
			y: y
		};

		this.dimensions[p.id] = {
			width: dimensions[pi].width,
			height: dimensions[pi].height,
			direction: directions[pi],
			flipped: flipped[pi],
			axis: axis[pi],
			addTo: addTo[pi]
		};
		this.notEnoughSpace(p.id, 'opponent', pi);
		oi++;
		i++;
		if(i >= this.manager.players.length)
			i = 0;

		placement[pi]--;
	}
};

//Расчитывает положение полей противников (слева, сверху, справа)
FieldBuilder.prototype._countOpponentPlacement = function(n){
	var a = [0, 0, 0];
	var i = 0;
	while(n--){
		if(i > 2)
			i = 0;
		if(n >= 2)
			a[i]++;
		else if(a[0] == a[2])
			a[1]++;
		else
			a[2]++;
		i++;
	}
	return a;
};

//Создает поля
FieldBuilder.prototype.createFieldNetwork = function(players){

	var manager = this.manager;

	manager.pid = game.pid;
	manager.players = players;
	var numOfCards = players.length > 3 ? 52 : 36,
		id, i;

	manager.pi = players.map(function(p){ return p.id; }).indexOf(manager.pid);
	if(!~manager.pi){
		console.error('Field builder: Player', manager.pid, 'not found in players\n', players);
		return;
	}

	this.opponentPlacement = this._countOpponentPlacement(manager.players.length - 1);
	this.calculateSizes(numOfCards);

	//Deck
	manager.fields.DECK = new Field({
		x: this.positions.DECK.x,
		y: this.positions.DECK.y,
		minActiveSpace: this.minActiveSpaces.DECK,
		horizontalAlign: 'right',
		padding: 0,
		margin: this.offsets.DECK,
		focusable:false,
		forcedSpace: 0.5,
		texture: 'field',
		sorted: false,
		type: 'DECK',
		id: 'DECK',
		axis: 'vertical',
		direction: 'backward',
		reversed: true,
		delayTime: 50,
		debug: manager.isInDebugMode
	});
	manager.cardsToRemove.DECK = [];

	//Discard pile
	manager.fields.DISCARD_PILE = new Field({
		x: this.positions.DISCARD_PILE.x,
		y: this.positions.DISCARD_PILE.y,
		minActiveSpace: this.minActiveSpaces.DISCARD_PILE,
		padding:0,
		margin: this.offsets.DISCARD_PILE,
		focusable:false,
		forcedSpace: 0.5,
		texture: 'field',
		horizontalAlign: 'right',
		sorted: false,
		axis: 'vertical',
		direction: 'backward',
		addTo: 'back',
		type: 'DISCARD_PILE',
		id: 'DISCARD_PILE',
		debug: manager.isInDebugMode
	});
	manager.cardsToRemove.DISCARD_PILE = [];

	//Field
	for(i = 0; i < this.tableOrder.length; i++){
		id = 'TABLE' + i;
		manager.fields[id] = new Field({
			x: this.positions[id].x,
			y: this.positions[id].y,
			width: this.dimensions[id].width,
			height: this.dimensions[id].height,
			minActiveSpace: this.minActiveSpaces.table,
			forcedSpace: this.minActiveSpaces.table,
			margin: this.offsets.table,
			texture: 'field',
			focusable:false,
			sorted:false,
			type: 'TABLE',
			id: 'TABLE' + i,
			specialId: i + 1,
			debug: manager.isInDebugMode
		});
		manager.cardsToRemove[id] = [];
	}

	//Player hand
	manager.fields[manager.pid] = new Field({
		x:this.positions[manager.pid].x,
		y:this.positions[manager.pid].y,
		width:this.dimensions.player.width,
		minActiveSpace: this.minActiveSpaces.player,
		margin:this.offsets.player,
		texture: 'field',
		type: 'HAND',
		id: manager.pid,
		specialId: manager.pi + 1,
		debug: manager.isInDebugMode
	});
	manager.cardsToRemove[manager.pid] = [];

	//Opponents
	i =  manager.pi + 1;
	var oi = 0;
	if(i >= players.length)
		i = 0;
	while(i != manager.pi){
		var p = players[i];
		manager.fields[p.id] = new Field({
			x: this.positions[p.id].x,
			y: this.positions[p.id].y,
			width: this.dimensions[p.id].width,
			height: this.dimensions[p.id].height,
			minActiveSpace: this.minActiveSpaces.opponent[1],
			margin:this.offsets.opponent[1],
			texture: 'field',
			sorted:false,
			focusable:false,
			axis: this.dimensions[p.id].axis,
			flipped: this.dimensions[p.id].flipped,
			direction: this.dimensions[p.id].direction,
			addTo: this.dimensions[p.id].addTo,
			type: 'HAND',
			id: p.id,
			name: p.name,
			specialId: i + 1,
			debug: manager.isInDebugMode
		});
		manager.cardsToRemove[p.id] = [];
		oi++;
		i++;
		if(i >= players.length)
			i = 0;
	}
	manager.networkCreated = true;
};

//Выводит предупреждение в консоль, если ширина меньше ширины одной карты
FieldBuilder.prototype.notEnoughSpace = function(id, ref, index){
	var isArray = typeof index == 'number',
		width = isArray ? this.dimensions[ref][index].width : this.dimensions[ref].width,
		height = isArray ? this.dimensions[ref][index].height : this.dimensions[ref].height,
		minActiveSpace = isArray ? this.minActiveSpaces[ref][index] : this.minActiveSpaces[ref],
		requiredWidth = skinManager.skin.width + minActiveSpace,
		requiredHeight = skinManager.skin.height + minActiveSpace,
		str = null;

	if((width || width === 0) && width < requiredWidth){
		str = ['Field builder: Not enough space for field', id, '(', width, '<', requiredWidth, ')\n'];
	}
	else if((height || height === 0) && height < requiredHeight){
		str = ['Field builder: Not enough space for field', id, '(', height, '<', requiredHeight, ')\n'];
	}

	if(str){
		str.push(this.manager.fields[id]);
		console.warn.apply(console, str);
		return true;
	}
	else return false;
};