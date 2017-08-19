FieldBuilder.prototype._calcGenOpponentSizes = function(){
	
	/* Константы */
	this.offsets.opponent = [10, 10, 10];
	this.minActiveSpaces.opponent = [
        1, 
        1, 
        1 
	];
	/*--*/

	var halfDensity = Math.floor(game.scale.density / 2);

	// Кол-во колонок и отступы для рук противников и мест на столе
	// Оппоненты размещаются в трех разных позициях - справа, сверху и слева
	
	// Отступ уменьшается, если поле не вмещается
	var topOpponentOffsetMultiplier = this._topOpponentFits ? 4 : 2;

	// Кол-во строк, выделенные на поля
	var opponentNumRows = Math.round(game.scale.numRows - game.scale.density*2 - 1);

	// Кол-во клеток, выделенные на поля
	var opponentCells = [
		opponentNumRows,
		game.scale.numCols - game.scale.density*topOpponentOffsetMultiplier - 2,
		opponentNumRows
	];

	// Отступы между полями
	var opponentsOffset = this._opponentsOffset = [
		(game.scale.cellHeight + this.offsets.opponent[0]* 2 ),
		(game.scale.cellWidth + this.offsets.opponent[1]* 2 ),
		(game.scale.cellHeight + this.offsets.opponent[2]* 2 )
	];

	// Выводим предупреждение, если на оппонентов было выделено отрицательное число клеток
	for(var i = 0; i < opponentCells.length; i++){
		if(opponentCells[i] <= 0){
			if(this.manager.inDebugMode){
				console.warn('Field builder: Negative amount of columns for field opponent[', i, '] (', opponentCells[i], '), defaulting to 0\n', this);
			}
			opponentCells[i] = 0;
		}
	}

	// Размеры полей
	this.dimensions.opponent = [
		{
			width: skinManager.skin.width, 
			height: (opponentCells[0] * game.scale.cellHeight - opponentsOffset[0]* (this._opponentPlacement[0] - 1)) / this._opponentPlacement[0]
		},
		{
			width: (opponentCells[1] * game.scale.cellWidth - opponentsOffset[1]* (this._opponentPlacement[1] - 1)) / this._opponentPlacement[1],
			height: skinManager.skin.height
		},
		{
			width: skinManager.skin.width, 
			height: (opponentCells[2] * game.scale.cellHeight - opponentsOffset[2]* (this._opponentPlacement[2] - 1)) / this._opponentPlacement[2]
		}
	];

	// Позиции полей
	this.positions.opponent = [
		game.scale.cellAt(
			game.scale.density,
			game.scale.numRows - game.scale.density*1.5 + 1,
			-this.offsets.opponent[0],
			-this.offsets.opponent[0]
		),
		game.scale.cellAt(
			this._topOpponentFits ? Math.floor(game.scale.density*2) + 1 : game.scale.density + 1,
			-halfDensity,
			-this.offsets.opponent[1],
			-this.offsets.opponent[1]
		),
		game.scale.cellAt(
			game.scale.numCols - game.scale.density,
			game.scale.density,
			-this.offsets.opponent[0],
			-this.offsets.opponent[0]
		),
	];

	// Сдвигаем позицию оппонентов слева на высоту карты
	this.positions.opponent[0].x -= skinManager.skin.height;
};

// Размеры для полей противников
FieldBuilder.prototype._calcSpecOpponentSizes = function(){
	var players = playerManager.players,
		opponentsOffset = this._opponentsOffset,
		i = playerManager.pi + 1,	// индекс первого противника по кругу после игрока
		oi = 0,	// Счетчик размещенных полей
		pi = 0;	// Индекс позиции для размещения

	var dimensions = this.dimensions.opponent,
		placement = this._opponentPlacement.slice(),

		// Данные для разных позиций
		directions = ['backward', 'forward', 'forward'],
		flipped = [false, true, true],
		axis = ['vertical', 'horizontal', 'vertical'],
		addTo = ['back', 'front', 'front'],
		badges = ['right', 'bottom', 'left'],
		animateFrom = ['left', 'top', 'right'],
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

	if(i >= players.length){
		i = 0;
	}
	
	// Начиная от оппонента после игрока и заканчивая оппонентом перед игроком
	// расчитываем и сохраняем позиции и свойства полей противников 
	// для трех позиций их размещения в соответствии с рассчитанным ранее
	// количеством оппонентов в каждой позиции
	while(i != playerManager.pi){
		
		// Достаточно игроков расположено в текущей позиции, переходим в следующую
		if(!placement[pi]){
			pi++;
			oi = 0;
			continue;
		}

		var p = players[i],
			x = this.positions.opponent[pi].x + xs[pi]*oi,
			y = this.positions.opponent[pi].y + ys[pi]*oi;

		// Сдвиг для полей с направлением в обратную стророну
		if(directions[pi] == 'backward'){
			if(axis[pi] == 'horizontal'){
				x -= dimensions[pi].width;
			}
			else{
				y -= dimensions[pi].height;
			}
		}

		this.positions[p.id] = {
			x: x,
			y: y
		};
		this.dimensions[p.id] = {
			width: dimensions[pi].width,
			height: dimensions[pi].height
		};
		this.options[p.id] = {
			badge: badges[pi],
			specialId: i + '('+ oi + ')'
		};
		this.styles[p.id] = {
			direction: directions[pi],
			flipped: flipped[pi],
			axis: axis[pi],
			addTo: addTo[pi],
			animateAppearance: animateFrom[pi],
		};
		this.badgeStyles[p.id] = {
			align: badges[pi]
		}
		this.offsets[p.id] = this.offsets.opponent[pi];
		this._notEnoughSpace(p.id, 'opponent', pi, false, pi == 1, pi != 1);
		oi++;
		i++;
		if(i >= players.length){
			i = 0;
		}

		placement[pi]--;
	}
};

// Рассчитывает положение полей противников (слева, сверху, справа)
FieldBuilder.prototype._countOpponentPlacement = function(n){
	var a = [0, 0, 0];
	var i = 0;
	if(game.scale.cellRelation > this._reduceTopOpponentsNumberRelation){
		while(n--){
			if(i > 2){
				i = 0;
			}
			if(n >= 2){
				a[i]++;
			}
			else if(a[0] == a[2]){
				a[1]++;
			}
			else{
				a[2]++;
			}
			i++;
		}
	}
	else if(n == 1){
		a[1]++;
	}
	else{
		while(n--){
			if(i > 2){
				i = 0;
			}
			if(n > 2){
				a[i]++;
			}
			else if(a[1] < a[0] && a[1] < a[2]){
				a[1]++;
			}
			else if(a[0] <= a[2]){
				a[0]++;
			}
			else{
				a[2]++;
			}
			i++;
		}
	}
	return a;
};