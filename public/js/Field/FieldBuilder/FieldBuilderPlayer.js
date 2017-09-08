FieldBuilder.prototype._calcGenPlayerSizes = function(){

	/* Константы */
	this.offsets.player = 15;
	this.minActiveSpaces.player = this.minActiveSpace;
	/*--*/

	var reduce = game.scale.cellRelation > this._reduceTopOpponentsNumberRelation;
	var playerNumCols = reduce ? Math.min((game.scale.numCols - 8), 40) : game.scale.numCols - 6;

	this.dimensions.player = {
		width: playerNumCols*game.scale.cellWidth
	};

	this.positions.player = game.scale.cellAt(
		(game.scale.numCols - playerNumCols)/2,
		game.scale.numRows - game.scale.density + 1,
		-this.offsets.player,
		-this.offsets.player - game.scale.cellHeight/2 + 5
	);
};

FieldBuilder.prototype._calcSpecPlayerSizes = function(){
	this.positions[gameInfo.pid] = {
		x: this.positions.player.x,
		y: this.positions.player.y
	};
	this.dimensions[gameInfo.pid] = {
		width:this.dimensions.player.width
	};
	this.offsets[gameInfo.pid] = this.offsets.player;
	this._notEnoughSpace(gameInfo.pid, 'player');
};