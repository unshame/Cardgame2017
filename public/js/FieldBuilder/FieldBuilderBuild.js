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
		sortable: true,
		focusable: true,
		draggable: true,
		area: 'curved'
	});
};

//Table
FieldBuilder.prototype._buildTableFields = function(lockedFields){
	var manager = this.manager;

	manager.addField({
		type: 'DUMMY',
		id: 'dummy',
		debug: manager.inDebugMode
	},
	{
		x: this.positions.dummy.x,
		y: this.positions.dummy.y,
		width: this.dimensions.dummy.width,
		height: this.dimensions.dummy.height,
		padding: this.offsets.dummy,
		sortable: false
	});
	
	for(var i = 0; i < this.tableAmount; i++){
		var id = 'TABLE' + i;
		var icon = ~lockedFields.indexOf(id) ? 'lock' : null;
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
			randomAngle: 'uni',
			padding: this.offsets.table,
			area: 'glowing',
			horizontalAlign: 'centerLeft'
		},
		{
			texture: icon,
			shouldHide: true,
			visible: false
		});
	}
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
	var iconStyle;
	if(skinManager.skin.hasSuits){
		iconStyle = {
			texture: skinManager.skin.suitsName,
			scale: skinManager.skin.scale,
			offset: {x: 0, y: skinManager.skin.trumpOffset + skinManager.skin.height/2 - 20 - skinManager.skin.width / 2},
			visible: false
		};
	}
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
		forcedSpace: 0.5,
		axis: 'vertical',
		direction: 'backward',
		addTo: 'back',
		adjust: false
	},
	iconStyle);
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
		forcedSpace: 0.5,
		horizontalAlign: 'right',
		axis: 'vertical',
		direction: 'backward',
		addTo: 'back',
		adjust: false
	});
};