//Player hand
FieldBuilder.prototype._buildPlayerField = function(){
	var manager = this.manager;

	manager.addField({
		type: 'HAND',
		id: playerManager.pid,
		specialId: playerManager.pi,
		debug: manager.inDebugMode
	},
	{
		x:this.positions[playerManager.pid].x,
		y:this.positions[playerManager.pid].y,
		width:this.dimensions.player.width,
		minActiveSpace: this.minActiveSpaces.player,
		padding:this.offsets.player,
		area: 'curved'
	});
};

//Table
FieldBuilder.prototype._buildTableFields = function(){
	var manager = this.manager;
	
	for(var i = 0; i < this.tableAmount; i++){
		var id = 'TABLE' + i;
		var icon = i == this.tableAmount - 1 ? 'lock' : null;
		manager.addField({
			type: 'TABLE',
			id: id,
			specialId: i,
			debug: manager.inDebugMode
		},
		{
			x: this.positions[id].x,
			y: this.positions[id].y,
			width: this.dimensions[id].width,
			height: this.dimensions[id].height,
			minActiveSpace: this.minActiveSpaces.table, 
			forcedSpace: this.minActiveSpaces.table, 
			spacing:0,
			focusable:false,
			sortable: false,
			randomAngle: true,
			padding: this.offsets.table,
			area: 'glowing',
			horizontalAlign: 'left'
		},
		{
			texture: icon,
			shouldHide: true,
			visible: false
		});
	}

	manager.addField({
		type: 'dummy',
		id: 'dummy',
		debug: manager.inDebugMode
	},
	{
		x: this.positions.dummy.x,
		y: this.positions.dummy.y,
		width: this.dimensions.dummy.width,
		height: this.dimensions.dummy.height,
		padding: this.offsets.dummy
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
			type: 'HAND',
			id: p.id,
			name: p.name,
			specialId: this.dimensions[p.id].specialId,
			debug: manager.inDebugMode
		},
		{
			x: this.positions[p.id].x,
			y: this.positions[p.id].y,
			width: this.dimensions[p.id].width,
			height: this.dimensions[p.id].height,
			minActiveSpace: this.minActiveSpaces[p.id],
			padding:this.offsets[p.id],
			sortable:false,
			focusable:false,
			axis: this.dimensions[p.id].axis,
			flipped: this.dimensions[p.id].flipped,
			direction: this.dimensions[p.id].direction,
			addTo: this.dimensions[p.id].addTo
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
		type: 'DECK',
		id: 'DECK',
		delayTime: 50,
		debug: manager.inDebugMode
	},
	{
		x: this.positions.DECK.x,
		y: this.positions.DECK.y,
		minActiveSpace: this.minActiveSpaces.DECK,
		horizontalAlign: 'right',
		spacing: 0,
		padding: this.offsets.DECK,
		sortable: false,
		focusable: false,
		forcedSpace: 0.5,
		axis: 'vertical',
		direction: 'backward',
		reversed: true
	},
	{
		texture: 'suits',
		offset: {x: 0, y: skinManager.skin.trumpOffset + skinManager.skin.height/2 - 20 - skinManager.skin.width / 2},
		visible: false
	});
};

//Discard pile
FieldBuilder.prototype._buildDiscardField = function(){
	var manager = this.manager;
	manager.addField({
		type: 'DISCARD_PILE',
		id: 'DISCARD_PILE',
		debug: manager.inDebugMode
	},
	{
		x: this.positions.DISCARD_PILE.x,
		y: this.positions.DISCARD_PILE.y,
		minActiveSpace: this.minActiveSpaces.DISCARD_PILE,
		spacing:0,
		padding: this.offsets.DISCARD_PILE,
		focusable:false,
		sortable: false,
		forcedSpace: 0.5,
		horizontalAlign: 'right',
		axis: 'vertical',
		direction: 'backward',
		addTo: 'back'
	});
};