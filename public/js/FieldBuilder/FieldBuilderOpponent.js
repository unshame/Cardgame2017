FieldBuilder.prototype._calcGenOpponentSizes = function(){
	
	/* Константы */
	this.offsets.opponent = [10, 10, 10];
	this.minActiveSpaces.opponent = [
		this.minActiveSpace,
		this.minActiveSpace,
		this.minActiveSpace
	];
	/*--*/

	var halfDensity = Math.floor(grid.density / 2);

	//Кол-во колонок и отступы для рук противников и мест на столе
	var opponentNumRows = Math.round(grid.numRows - grid.density*2 + halfDensity - 2),
		opponentCells = [
			opponentNumRows,
			grid.numCols - grid.density*4 - 2,
			opponentNumRows
		],
		_opponentsOffset = this._opponentsOffset = [
			(grid.cellHeight + this.offsets.opponent[0]* 2 ),
			(grid.cellWidth + this.offsets.opponent[1]* 2 ),
			(grid.cellHeight + this.offsets.opponent[2]* 2 )
		];

	for(var i = 0; i < opponentCells.length; i++){
		if(opponentCells[i] <= 0){
			if(this.manager.inDebugMode){
				console.warn('Field builder: Negative amount of columns for field opponent[', i, '] (', opponentCells[i], '), defaulting to 0\n', this);
			}
			opponentCells[i] = 0;
		}
	}

	this.dimensions.opponent = [
		{
			//width: , 
			height: (opponentCells[0]* grid.cellHeight - _opponentsOffset[0]* (this._opponentPlacement[0] - 1)) / this._opponentPlacement[0]
		},
		{
			width: (opponentCells[1]* grid.cellWidth - _opponentsOffset[1]* (this._opponentPlacement[1] - 1)) / this._opponentPlacement[1]
			//height: 
		},
		{
			//width: , 
			height: (opponentCells[2]* grid.cellHeight - _opponentsOffset[2]* (this._opponentPlacement[2] - 1)) / this._opponentPlacement[2]
		}
	];

	//Позиции полей
	this.positions.opponent = [
		grid.at(
			halfDensity + 1,
			grid.numRows - grid.density,
			-this.offsets.opponent[0],
			-this.offsets.opponent[0]
		),
		grid.at(
			Math.floor(grid.density*2) + 1,
			-halfDensity,
			-this.offsets.opponent[1],
			-this.offsets.opponent[1]
		),
		grid.at(
			grid.numCols - halfDensity - 1,
			grid.density,
			-this.offsets.opponent[0],
			-this.offsets.opponent[0]
		),
	];

	this.positions.opponent[0].x -= skinManager.skin.height;
};

//Размеры для полей противников
FieldBuilder.prototype._calcSpecOpponentSizes = function(){
	var players = playerManager.players,
		_opponentsOffset = this._opponentsOffset,
		i = playerManager.pi + 1,	//индекс первого противника по кругу после игрока
		oi = 0,	//Счетчик размещенных полей
		pi = 0;	//Индекс позиции для размещения

	var dimensions = this.dimensions.opponent,
		placement = this._opponentPlacement.map(function(v){
			return v;
		}),

		//Данные для разных позиций
		directions = ['backward', 'forward', 'forward'],
		flipped = [false, true, true],
		axis = ['vertical', 'horizontal', 'vertical'],
		addTo = ['back', 'front', 'front'],
		xs = [
			0,
			dimensions[1].width + _opponentsOffset[1],
			0
		],
		ys = [
			-(dimensions[0].height + _opponentsOffset[0]),
			0,
			dimensions[2].height + _opponentsOffset[2]
		];

	if(i >= players.length)
		i = 0;
	
	while(i != playerManager.pi){

		if(!placement[pi]){
			pi++;
			oi = 0;
		}

		var p = players[i],
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
			addTo: addTo[pi],
			specialId: i + '('+ oi + ')'
		};
		this.offsets[p.id] = this.offsets.opponent[pi];
		this._notEnoughSpace(p.id, 'opponent', pi);
		oi++;
		i++;
		if(i >= players.length)
			i = 0;

		placement[pi]--;
	}
};

//Рассчитывает положение полей противников (слева, сверху, справа)
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