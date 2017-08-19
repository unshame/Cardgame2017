FieldBuilder.prototype._calcGenTableSizes = function(numOfTables){

	/* Константы */
	this.offsets.table = 0;
	this.minActiveSpaces.table = skinManager.skin.trumpOffset;
	this.offsets.dummy = 0;
	/*--*/
	
	var halfDensity = Math.floor(game.scale.density / 2);

	var halfRows = Math.floor(game.scale.numRows / 2),
		tableCells = this._tableCells = this._opponentPlacement[0] ? Math.round(game.scale.numCols - 6 - game.scale.density* 1.5) : game.scale.numCols - 2,
		tableOffset = this._tableOffset = this.offsets.table* 2;

	if(tableCells <= 0){
		if(this.manager.inDebugMode){
			console.warn('Field builder: Negative amount of columns for field table (', tableCells, '), defaulting to 0\n', this);
		}
		tableCells = 0;
	}

	// Пытаемся выровнять поля стола по центру
	var minTableSpace = skinManager.skin.width + this.minActiveSpaces.table,
		extraSpace = (tableCells * game.scale.cellWidth) / numOfTables - minTableSpace,
		tableWidth;

	if(extraSpace > 0 && numOfTables == this.tableAmount){
		this.offsets.table = this.offsets.dummy = extraSpace / 4;
		this._tableOffset = tableOffset = extraSpace / 2;
		tableWidth = (tableCells * game.scale.cellWidth - extraSpace / 2 * (numOfTables - 1)) / numOfTables;
	}
	else{
		tableWidth = (tableCells * game.scale.cellWidth - tableOffset * (numOfTables - 1)) / numOfTables;
	}

	var addedCell = numOfTables == this.tableAmount ? 1 : 0;

	this.dimensions.table = {
		width: tableWidth,
		height: (game.scale.density + addedCell) * game.scale.cellHeight
	};
	this.dimensions.dummy = {
		width: tableWidth*numOfTables + this.offsets.table * 2 * (numOfTables-1)
	};

	this.positions.table = game.scale.cellAt(
		this._opponentPlacement[0] ? 2 + game.scale.density : 1,
		halfRows - halfDensity - 1,
		-this.offsets.table,
		-this.offsets.table
	);
	this.positions.dummy = this.positions.table;

};

FieldBuilder.prototype._calcSpecTableSizes = function(){
	var offset = this._tableOffset,
 		inRow = this.tablesInRow,
 		total = this.tableAmount,
		width = this.dimensions.table.width,
		height = this.dimensions.table.height,
		mult = Math.ceil(total/inRow),
		firstX = this.positions.table.x,
		y = this.positions.table.y - (mult - 1) * (height / 2),
		ci = 0,
		ri = 0,
		ti = inRow;

	this.positions.dummy.y = y;
	this.dimensions.dummy.height = height * mult + game.scale.cellHeight * (mult-1);
	
	this.tableOrder = this._possibleTableOrders[inRow];

	for(var i = 0; i < total; i++){
		if(ti === 0){
			ti = inRow;
			ci = 0;
			ri++;
			y += height + game.scale.cellHeight;
		}
		var id = 'TABLE' + this.tableOrder[i];
		var x = firstX + (width + offset)*ci;

		this.positions[id] = {x: x, y: y};
		this.offsets[id] = this.offsets.table;
		this.dimensions[id] = {width: width, height: height};		
		this._notEnoughSpace(id, 'table', null, false, true);
		ti--;
		ci++;
	}
};