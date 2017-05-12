FieldBuilder.prototype._calcGenPlayerSizes = function(){

	/* Константы */
	this.offsets.player = 10;
	this.minActiveSpaces.player = this.minActiveSpace;
	/*--*/

	var playerNumCols = Math.min((grid.numCols - 8), 40);

	this.dimensions.player = {
		width: playerNumCols*grid.cellWidth
	};

	this.positions.player = grid.at(
		(grid.numCols - playerNumCols)/2,
		grid.numRows - grid.density + 1,
		-this.offsets.player,
		-this.offsets.player - grid.cellHeight/2
	);


};

FieldBuilder.prototype._calcSpecPlayerSizes = function(){
	this.positions[playerManager.pid] = {
		x: this.positions.player.x,
		y: this.positions.player.y
	};
	this.dimensions[playerManager.pid] = {
		width:this.dimensions.player.width
	};
	this.offsets[playerManager.pid] = this.offsets.player;
	this._notEnoughSpace(playerManager.pid, 'player');
};