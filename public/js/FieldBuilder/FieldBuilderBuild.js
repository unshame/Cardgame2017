//Player hand
FieldBuilder.prototype._buildPlayerField = function(){
	var manager = this.manager;

	manager.addField({
		x:this.positions[playerManager.pid].x,
		y:this.positions[playerManager.pid].y,
		width:this.dimensions.player.width,
		minActiveSpace: this.minActiveSpaces.player,
		margin:this.offsets.player,
		texture: 'field',
		areaType: 'curved',
		type: 'HAND',
		id: playerManager.pid,
		specialId: playerManager.pi,
		debug: manager.inDebugMode
	});
};

//Table
FieldBuilder.prototype._buildTableFields = function(){
	var manager = this.manager;
	
	for(var i = 0; i < this.tableOrder.length; i++){
		var id = 'TABLE' + i;
		var icon = i == this.tableOrder.length - 1 ? 'lock' : null;
		manager.addField({
			x: this.positions[id].x,
			y: this.positions[id].y,
			width: this.dimensions[id].width,
			height: this.dimensions[id].height,
			minActiveSpace: this.minActiveSpaces.table, 
			forcedSpace: this.minActiveSpaces.table, 
			padding:0,
			randomAngle: true,
			margin: this.offsets.table,
			areaType: 'glowing',
			horizontalAlign: 'left',
			texture: 'field',
			focusable:false,
			icon: icon,
			iconShouldHide: true,
			sorted: false,
			type: 'TABLE',
			id: id,
			specialId: i,
			debug: manager.inDebugMode
		});
	}

	manager.addField({
		x: this.positions.dummy.x,
		y: this.positions.dummy.y,
		width: this.dimensions.dummy.width,
		height: this.dimensions.dummy.height,
		margin: this.offsets.dummy,
		type: 'dummy',
		id: 'dummy',
		debug: manager.inDebugMode
	});
};

//Opponents
FieldBuilder.prototype._buildOpponentFields = function(){
	var manager = this.manager,
		players = playerManager.players,
		i =  playerManager.pi + 1,
		oi = 0;
	if(i >= players.length)
		i = 0;
	while(i != playerManager.pi){
		var p = players[i];
		manager.addField({
			x: this.positions[p.id].x,
			y: this.positions[p.id].y,
			width: this.dimensions[p.id].width,
			height: this.dimensions[p.id].height,
			minActiveSpace: this.minActiveSpaces[p.id],
			margin:this.offsets[p.id],
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
			specialId: this.dimensions[p.id].specialId,
			debug: manager.inDebugMode
		});
		oi++;
		i++;
		if(i >= players.length)
			i = 0;
	}
};

//Deck
FieldBuilder.prototype._buildDeckField = function(){
	var manager = this.manager;
	manager.addField({
		x: this.positions.DECK.x,
		y: this.positions.DECK.y,
		minActiveSpace: this.minActiveSpaces.DECK,
		horizontalAlign: 'right',
		padding: 0,
		margin: this.offsets.DECK,
		focusable:false,
		forcedSpace: 0.5,
		texture: 'field',
		icon: 'suits',
		iconOffset: {x: 0, y: skinManager.skin.trumpOffset + skinManager.skin.height/2 - 20 - skinManager.skin.width / 2},
		sorted: false,
		type: 'DECK',
		id: 'DECK',
		axis: 'vertical',
		direction: 'backward',
		reversed: true,
		delayTime: 50,
		debug: manager.inDebugMode
	});
	manager.fields.DECK.icon.visible = false;
};

//Discard pile
FieldBuilder.prototype._buildDiscardField = function(){
	var manager = this.manager;
	manager.addField({
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
		debug: manager.inDebugMode
	});
};