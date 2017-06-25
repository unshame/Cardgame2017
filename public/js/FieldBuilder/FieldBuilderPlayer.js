FieldBuilder.prototype._calcGenPlayerSizes = function(){

	/* Константы */
	this.offsets.player = 12;
	this.minActiveSpaces.player = this.minActiveSpace;
	/*--*/

	var playerNumCols = Math.min((game.scale.numCols - 8), 40);

	this.dimensions.player = {
		width: playerNumCols*game.scale.cellWidth
	};

	this.positions.player = game.scale.cellAt(
		(game.scale.numCols - playerNumCols)/2,
		game.scale.numRows - game.scale.density + 1,
		-this.offsets.player,
		-this.offsets.player - game.scale.cellHeight/2
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