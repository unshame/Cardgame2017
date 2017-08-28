// Player hand
FieldBuilder.prototype._buildPlayerField = function(){
	var manager = this.manager;
	var player = playerManager.players[playerManager.pi];
	var field = manager.addPlayerField({
		type: 'HAND',
		id: playerManager.pid,
		name: player.name,
		specialId: playerManager.pi,
		debug: manager.inDebugMode
	},
	{
		x:this.positions[playerManager.pid].x,
		y:this.positions[playerManager.pid].y,
		width:this.dimensions.player.width,
		alwaysVisible: true,
		minActiveSpace: this.minActiveSpaces.player,
		padding:this.offsets.player,
		sortable: true,
		focusable: true,
		draggable: true,
		animateAppearance: 'bottom'
	},
	{
		align: 'top'
	});
	player.badge = field.badge;
};

// Table
FieldBuilder.prototype._buildTableFields = function(lockedFields){
	if(!lockedFields){
		lockedFields = [];
	}
	
	var manager = this.manager;

	manager.addGenericField({
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
		var icon = null;
		if(~lockedFields.indexOf(id)){
			icon = {
				texture: 'lock',
				shouldHide: true,
				visible: false
			};
		}
		manager.addTableField({
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
			horizontalAlign: 'centerLeft'
		},
		icon);
	}
};

// Opponents
FieldBuilder.prototype._buildOpponentFields = function(){
	var manager = this.manager,
		players = playerManager.players,
		i = playerManager.pi + 1,
		oi = 0;
	if(i >= players.length){
		i = 0;
	}
	while(i != playerManager.pi){
		var p = players[i];
		var field = manager.addOpponentField({
			type: 'HAND_OPPONENT',
			id: p.id,
			name: p.name,
			specialId: this.options[p.id].specialId,
			debug: manager.inDebugMode
		},
		{
			x: this.positions[p.id].x,
			y: this.positions[p.id].y,
			width: this.dimensions[p.id].width,
			height: this.dimensions[p.id].height,
			alwaysVisible: true,
			minActiveSpace: this.minActiveSpaces[p.id],
			padding:this.offsets[p.id],
			axis: this.styles[p.id].axis,
			flipped: this.styles[p.id].flipped,
			direction: this.styles[p.id].direction,
			addTo: this.styles[p.id].addTo,
			animateAppearance: this.styles[p.id].animateAppearance,
			alpha: 0.15
		},
		{
			align: this.badgeStyles[p.id].align
		},
		{
			numCardsText: 'Cards in hand'
		});
		p.badge = field.badge;
		oi++;
		i++;
		if(i >= players.length){
			i = 0;
		}
	}
};

// Deck
FieldBuilder.prototype._buildDeckField = function(){
	var manager = this.manager;
	var iconStyle;
	if(skinManager.skin.hasSuits){
		iconStyle = {
			texture: skinManager.skin.suitsName,
			scale: skinManager.skin.scale,
			offset: {
				x: 0,
				y: skinManager.skin.trumpOffset + skinManager.skin.height/2 - 20 - skinManager.skin.width / 2
			},
			visible: false
		};
	}
	manager.addField(Field.PopupField, {
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
	{
		area: iconStyle ? 'icon' : 'area',
		getTextFunction: function(){
			return (
				'Cards in deck: ' + this.cards.length + '\n' +
			    'Trump suit: ' + getSuitStrings('EN')[this.icon.frame]
			);
		}
	},
	iconStyle);
};

// Discard pile
FieldBuilder.prototype._buildDiscardField = function(){
	var manager = this.manager;
	manager.addField(Field.PopupField, {
		type: 'DISCARD_PILE',
		id: 'DISCARD_PILE',
		debug: manager.inDebugMode
	},
	{
		x: this.positions.DISCARD_PILE.x,
		y: this.positions.DISCARD_PILE.y,
		alwaysVisible: true,
		minActiveSpace: this.minActiveSpaces.DISCARD_PILE,
		spacing:0,
		padding: this.offsets.DISCARD_PILE,
		forcedSpace: 0.5,
		horizontalAlign: 'right',
		axis: 'vertical',
		direction: 'backward',
		addTo: 'back',
		adjust: false,
		animateAppearance: 'top',
		alpha: 0.15
	},
	{
		numCardsText: 'Cards discarded'
	},
	{
		texture: 'skull',
		shouldHide: false,
		visible: true,
		offset: {
			x:0,
			y: game.scale.cellHeight/2
		}
	});
};