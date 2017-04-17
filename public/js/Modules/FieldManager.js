/*
 * Модуль, создающий и управляющий полями (Field)
 * Также создает карты. Этот функционал нужно будет переместить в game
 * TODO:
 *  Расположения полей
 * 	Выделение полей в соотвествии с возможными действиями
 * 	Поле стола должно функционировать одновременно как одно и несолько полей
 * 	Поле стола должно центровать поля 
 */

var FieldManager = function(isInDebugMode){

	this.networkCreated = false;

	this.offsets = {};
	this.minActiveSpaces = {};
	this.fields = {};
	this.positions = {};
	this.dimensions = {};

	this.players = {}
	this.pid = null;
	this.pi = 0;

	this.cardsToRemove = {};

	this.tableOrder = [4, 2, 0, 1, 3, 5];

	this.isInDebugMode = isInDebugMode;
}


//ПОЛЯ

//Создает поля
FieldManager.prototype.createFieldNetwork = function(players){

	this.pid = game.pid;
	this.players = players;
	var numOfCards = players.length > 3 ? 52 : 36;
	var id;

	this.pi = players.map(function(p){ return p.id }).indexOf(this.pid);
	if(!~this.pi){
		console.error('Field manager: Player', this.pid, 'not found in players\n', players);
		return
	}

	this.opponentPlacement = this.calculateOpponentPlacement(this.players.length - 1);
	this.calculateSizes(numOfCards);

	//Deck
	this.fields['DECK'] = new Field({
		x: this.positions['DECK'].x,
		y: this.positions['DECK'].y,
		minActiveSpace: this.minActiveSpaces['DECK'],
		align: 'right',
		padding: 0,
		margin: this.offsets['DECK'],
		focusable:false,
		forcedSpace: 0.5,
		texture: 'field',
		sorting: false,
		type: 'DECK',
		id: 'DECK',
		alignment: 'horizontal',
		direction: 'backward',
		delayTime: 50,
		debug: this.isInDebugMode
	});
	this.cardsToRemove['DECK'] = [];

	//Discard pile
	this.fields['DISCARD_PILE'] = new Field({
		x: this.positions['DISCARD_PILE'].x,
		y: this.positions['DISCARD_PILE'].y,
		minActiveSpace: this.minActiveSpaces['DISCARD_PILE'],
		padding:0,
		margin: this.offsets['DISCARD_PILE'],
		focusable:false,
		forcedSpace: 0.5,
		texture: 'field',
		align: 'left',
		sorting: false,
		type: 'DISCARD_PILE',
		id: 'DISCARD_PILE',
		debug: this.isInDebugMode
	});
	this.cardsToRemove['DISCARD_PILE'] = [];

	//Field
	for(var i = 0; i < this.tableOrder.length; i++){
		id = 'TABLE' + i;
		this.fields[id] = new Field({
			x: this.positions[id].x,
			y: this.positions[id].y,
			width: this.dimensions[id].width,
			height: this.dimensions[id].height,
			minActiveSpace: this.minActiveSpaces.firstTable,
			forcedSpace: this.minActiveSpaces.firstTable,
			margin: this.offsets.firstTable,
			texture: 'field',
			focusable:false,
			sorting:false,
			type: 'TABLE',
			id: 'TABLE' + i,
			specialId: i + 1,
			debug: this.isInDebugMode
		});
		this.cardsToRemove[id] = [];
	}

	//Player hand
	this.fields[this.pid] = new Field({
		x:this.positions[this.pid].x,
		y:this.positions[this.pid].y,
		width:this.dimensions.playerHand.width,
		minActiveSpace: this.minActiveSpaces.playerHand,
		margin:this.offsets.playerHand,
		texture: 'field',
		type: 'HAND',
		id: this.pid,
		specialId: this.pi + 1,
		debug: this.isInDebugMode
	});
	this.cardsToRemove[this.pid] = [];

	//Opponents
	var i =  this.pi + 1;
	var oi = 0;
	if(i >= players.length)
		i = 0;
	while(i != this.pi){
		var p = players[i];
		this.fields[p.id] = new Field({
			x: this.positions[p.id].x,
			y: this.positions[p.id].y,
			width: this.dimensions[p.id].width,
			minActiveSpace: this.minActiveSpaces.firstOpponent[1],
			margin:this.offsets.firstOpponent[1],
			texture: 'field',
			sorting:false,
			focusable:false,
			alignment: this.dimensions[p.id].alignment,
			direction: this.dimensions[p.id].direction,
			flipped: this.dimensions[p.id].flipped,
			type: 'HAND',
			id: p.id,
			name: p.name,
			specialId: i + 1,
			debug: this.isInDebugMode
		});
		this.cardsToRemove[p.id] = [];
		oi++;
		i++;
		if(i >= players.length)
			i = 0;
	}
	this.networkCreated = true;
}

//Рассчитывает размеры полей
FieldManager.prototype.calculateSizes = function(numOfCards){
	this.calculateGeneralSizes(numOfCards);
	this.calculateSpecificSizes();
}

//Обобщенные размеры
FieldManager.prototype.calculateGeneralSizes = function(numOfCards){

	var defaultFieldOptions = Field.prototype.getDefaultOptions();

	//Отступы
	this.offsets = {
		DECK: 22,					//Колода		
		DISCARD_PILE: 22,			//Стопка сброса		
		playerHand: 10,				//Поле игрока пока не известен id игрока
		firstTable: 4,				//Первое поле на столе		
		firstOpponent: [10, 10, 10]	//Первые поля соперника
	}

	//Минимальное место для расположения карт в поле
	this.minActiveSpaces = {
		DECK: numOfCards/2,
		DISCARD_PILE: numOfCards/2,
		playerHand: defaultFieldOptions.minActiveSpace,
		firstTable: skinManager.skin.trumpOffset,
		firstOpponent: [
			defaultFieldOptions.minActiveSpace,
			defaultFieldOptions.minActiveSpace,
			defaultFieldOptions.minActiveSpace
		]
	}

	//Позиции полей
	this.positions = {
		DECK: grid.at(
			-2,
			Math.floor(grid.numRows / 2) - 1,
			-this.offsets['DECK'],
			-this.offsets['DECK'],
			'middle left'
		),
		DISCARD_PILE: grid.at(
			grid.numCols - grid.density + 1,
			Math.floor(grid.numRows / 2) - 1,
			-this.offsets['DISCARD_PILE'],
			-this.offsets['DISCARD_PILE'],
			'middle left'
		),
		playerHand: grid.at(
			1,
			grid.numRows - grid.density - 1,
			-this.offsets.playerHand,
			-this.offsets.playerHand
		),
		firstTable: grid.at(
			1 + grid.density,
			Math.floor(grid.numRows / 2) - 1,
			-this.offsets.firstTable,
			-this.offsets.firstTable,
			'middle left'
		),
		firstOpponent: [
			grid.at(
				1,
				2,
				-this.offsets.firstOpponent[0],
				-this.offsets.firstOpponent[0]
			),
			grid.at(
				1,
				-Math.floor(grid.density / 2 - 1),
				-this.offsets.firstOpponent[1],
				-this.offsets.firstOpponent[1]
			),
			grid.at(
				1,
				8,
				-this.offsets.firstOpponent[2],
				-this.offsets.firstOpponent[2]
			)
		]
	}

	//Кол-во колонок и отступы для рук противников и мест на столе
	var tableCols = this.tableCols = Math.round(grid.numCols - 4 - grid.density * 1.5),
		tableOffset = this.tableOffset = this.offsets.firstTable * 2,
		opponentsCols = this.opponentsCols = [
			Math.round(grid.numCols - 2),
			Math.round(grid.numCols - 2),
			Math.round(grid.numCols - 2)
		],
		opponentsOffset = this.opponentsOffset = [
			(grid.cellWidth + this.offsets.firstOpponent[0] * 2 ),
			(grid.cellWidth + this.offsets.firstOpponent[1] * 2 ),
			(grid.cellWidth + this.offsets.firstOpponent[2] * 2 )
		];
	if(tableCols <= 0){
		console.warn('Field manager: Negative amount of columns for field firstTable (', tableCols, '), defaulting to 0\n', this);
		tableCols = 0;
	}
	for(var i = 0; i < opponentsCols.length; i++){
		if(opponentsCols[i] <= 0){
			console.warn('Field manager: Negative amount of columns for field firstOpponent[', i, '] (', opponentsCols[i], '), defaulting to 0\n', this);
			opponentsCols[i] = 0;
		}
	}

	//Размеры полей
	this.dimensions = {
		DECK:{
			//width: ,
			//height: 
		},
		DISCARD_PILE: {
			//width: ,
			//height: 
		},

		//Поле игрока пока не известен id игрока
		playerHand: {
			width: (grid.numCols - 2)*grid.cellWidth,
			//height: 
		},

		firstTable: {
			width: (tableCols * grid.cellWidth - tableOffset * (this.tableOrder.length - 1)) / this.tableOrder.length
			//height:
		},

		//Размер первого поля соперника
		firstOpponent: [
			{
				width: (opponentsCols[0] * grid.cellWidth - opponentsOffset[0] * (this.opponentPlacement[0] - 1)) / this.opponentPlacement[0]
				//height: 
			},
			{
				width: (opponentsCols[1] * grid.cellWidth - opponentsOffset[1] * (this.opponentPlacement[1] - 1)) / this.opponentPlacement[1]
				//height: 
			},
			{
				width: (opponentsCols[2] * grid.cellWidth - opponentsOffset[2] * (this.opponentPlacement[2] - 1)) / this.opponentPlacement[2]
				//height: 
			}
		]
	}
}

//Размеры для каждого поля
FieldManager.prototype.calculateSpecificSizes = function(){

	var tableCols = this.tableCols,
		tableOffset = this.tableOffset,
		opponentsCols = this.opponentsCols,
		opponentsOffset = this.opponentsOffset;

	//Выводит предупреждение в консоль, если ширина меньше ширины одной карты
	function notEnoughSpace(self, id, ref, index){
		var isArray = typeof index == 'number',
			width = isArray ? self.dimensions[ref][index] : self.dimensions[ref].width,
			minActiveSpace = isArray ? self.minActiveSpaces[ref][index] : self.minActiveSpaces[ref],
			requiredWidth = skinManager.skin.width + minActiveSpace;

		if(width < requiredWidth){
			console.warn('Field manager: Not enough space for field', id, '(', width, '<', requiredWidth, ')\n', self.fields[id]);
			return true;
		}
		else
			return false;
	}

	//Table
	var id,
		width = this.dimensions.firstTable.width;
	for(var i = 0; i < this.tableOrder.length; i++){
		id = 'TABLE' + this.tableOrder[i];
		x = this.positions.firstTable.x + (width + tableOffset)*i;
		y = this.positions.firstTable.y;
		this.positions[id] = {x: x, y: y};
		this.dimensions[id] = {width: width};		
		notEnoughSpace(this, id, 'firstTable')
	}

	//Player
	this.positions[this.pid] = {
		x: this.positions.playerHand.x,
		y: this.positions.playerHand.y
	};
	this.dimensions[this.pid] = {
		width:this.dimensions.playerHand.width
	};
	notEnoughSpace(this, this.pid, 'playerHand')

	//Opponents
	function copyPlacement(v){
		return v;
	}
	var dimensions = this.dimensions.firstOpponent,
		i = this.pi + 1,
		oi = 0,
		pi = 0,
		placement = this.opponentPlacement.map(copyPlacement),
		directions = ['backward', 'forward', 'forward'],
		flipped = [false, true, true],
		alignment = ['vertical', 'horizontal', 'vertical'];


	if(i >= this.players.length)
		i = 0;
	
	while(i != this.pi){
		var p = this.players[i];

		x = this.positions.firstOpponent[pi].x + (dimensions[pi].width + opponentsOffset[pi])*oi;
		y = this.positions.firstOpponent[pi].y;
		this.positions[p.id] = {
			x: x,
			y: y
		};
		this.dimensions[p.id] = {
			width: dimensions[pi].width,
			height: dimensions[pi].height,
			direction: directions[pi],
			flipped: flipped[pi],
			alignment: alignment[pi]
		};
		notEnoughSpace(this, p.id, 'firstOpponent', pi)
		oi++;
		i++;
		if(i >= this.players.length)
			i = 0;

		placement[pi]--;
		if(!placement[pi]){
			pi++;
			oi = 0;
		}
	}
}

//Расчитывает положение полей противников (слева, сверху, справа)
FieldManager.prototype.calculateOpponentPlacement = function(n){
	var a = [0, 0, 0];
	var i = 0;
	while(n--){
		if(i > 2)
			i = 0;
		if(n >= 2)
			a[i]++
		else if(a[0] == a[2])
			a[1]++
		else
			a[2]++;
		i++;
	}
	return a
}

//Добавляет поле
FieldManager.prototype.addField = function(options){
	if(!options)
		options = {};

	this.fields[options.id] = new Field(options);
}


//ОБРАБОТКА КОМАНД СЕРВЕРА

/*
 * Выполняет действие
 * action.type
 * 	TRUMP_CARDS - наименьшии козырные карты у каждого игрока и наименьшая козырная карта из них
 * 		.cards Array of {
 * 			cid,
 * 			pid,
 * 			suit,
 * 			value
 * 		}
 * 		.pid String
 * 		
 * 	CARDS - карты, присутствующие в игре
 * 		.cards Array of {
 * 			cid,
 * 			field,
 * 			[suit,]
 * 			[value]
 * 		}
 * 		[.numDiscarded Number]
 * 		[.trumpSuit Number]
 *
 * 	DRAW - раздача карт
 * 		.cards Array of {
 * 			cid,
 * 			pid,
 * 			[suit,]
 * 			[value]
 * 		}
 *
 * 	TAKE - игрок либо хочет взять, либо уже берет карты, зависит от присутствия .cards
 * 		[.cards Array of {
 * 			cid,
 * 			[suit,]
 * 			[value]
 * 		}]
 * 		.pid String
 *
 * 	DEFENSE, ATTACK - игрок атакует/защищается
 * 		.cid String
 * 		.pid String
 * 		.field String
 * 		.suit Number
 * 		.value Number
 *
 * 	DISCARD - карты перекладываются со стола в стопку сброса
 * 		.ids Array of String
 *
 * 	SKIP - игрок пропускает ход
 * 		.pid
 */
FieldManager.prototype.executeAction = function(action){
	if(action.type == 'GAME_INFO' && action.players.length){
		fieldManager.resetNetwork();
		fieldManager.createFieldNetwork(action.players);
		action.type = 'CARDS';
	}

	if(!this.networkCreated){
		console.error('Field manager: field network hasn\'t been created')
		return;
	}

	var delay = 0,
		cards, card, field;

	this.forEachField(function(field, si){
		field.setHighlight(false);
	})

	var field = this.fields[this.pid];
	for(var ci = 0; ci < field.cards.length; ci++){
		field.cards[ci].setPlayability(false);
	}

	switch(action.type){

	case 'TRUMP_CARDS':
		break;

	case 'CARDS':
		this.resetFields();
		controller.reset();

		for(var cid in game.cards){
			if(game.cards.hasOwnProperty(cid)){
				game.cards[cid].base.removeAll(true);
			}
		}
		game.cards = {};
		game.cardsGroup.removeAll(true);
		delay = this.queueCards(action.cards);
		this.removeMarkedCards();
		this.placeQueuedCards();
		if(action.numDiscarded){
			var discardCards = [];
			for (var i = 0; i < action.numDiscarded; i++) {
				var id = 'discarded_'+i;
				var options = {
					id: id
				}
				game.cards[id] = new Card(options);
				discardCards.push(game.cards[id])
			}
			this.fields['DISCARD_PILE'].addCards(discardCards);
		}
		break;

	case 'DRAW':
		delay = this.queueCards(action.cards);
		this.removeMarkedCards();
		this.placeQueuedCards();
		break;

	case 'TAKE':
		if(!action.cards)
			break;
		cards = [];
		for(var i = 0; i < action.cards.length; i++){
			cards.push({
				cid: action.cards[i].cid,
				suit: action.cards[i].suit,
				value: action.cards[i].value
			})
		}
		field = this.fields[action.pid];
		delay = this.placeCards(field, cards, true);
		break;
		
	case 'ATTACK':
		//Fall-through

	case 'DEFENSE':
		card = {
			cid: action.cid,
			suit: action.suit,
			value: action.value
		}
		field = this.fields[action.field];
		delay = this.placeCards(field, [card]);
		break;

	case 'DISCARD':
		cards = [];
		for(var i = 0; i < action.ids.length; i++){
			cards.push({
				cid: action.ids[i],
				suit: null,
				value: 0
			})
		}
		field = this.fields['DISCARD_PILE'];
		delay = this.placeCards(field, cards);
		break;

	case 'SKIP':
		break;

	default:
		console.warn('Field manager: Unknown action type', action.type, action)
	}
	return delay
}

//Подсвечивает карты, которыми можно ходить
FieldManager.prototype.highlightPossibleActions = function(actions){
	if(!this.networkCreated){
		console.error('Field manager: field network hasn\'t been created')
		return;
	}
	
	this.forEachField(function(field, si){
		field.setHighlight(false);
	})
	var field = this.fields[this.pid];
	for(var ci = 0; ci < field.cards.length; ci++){
		field.cards[ci].setPlayability(false);
	}
	for(var ai = 0; ai < actions.length; ai++){
		var action = actions[ai];
		if(action.cid && game.cards[action.cid]){
			game.cards[action.cid].setPlayability(true);
			this.fields[action.field].setHighlight(true);
		}
	}
}


//РАЗМЕЩЕНИЕ КАРТ

/*
 * Добавляет карты в очередь соответствующим полям
 * @newCards Array of {
 *		cid,
 *		pid || field,
 *		[suit,]
 *		[value]	
 * }
 */
FieldManager.prototype.queueCards = function(newCards){

	var delay = 0;
	for(var ci = 0; ci < newCards.length; ci++){
		var c = newCards[ci];
		var card = game.cards[c.cid];
		if(card){
			card.presetValue(c.suit, c.value);		
			card.presetField(c.field || c.pid);
		}
		else{
			var options = {
				id: c.cid,
				suit: c.suit,
				value: c.value,
				fieldId: c.field || c.pid
			}
			game.cards[c.cid] = new Card(options);
			card = game.cards[c.cid];
		}
		card.field && this.cardsToRemove[card.field.id].push(card);
		var fieldId = card.fieldId;
		if(fieldId == 'BOTTOM')
			fieldId = 'DECK';
		delay = this.fields[fieldId].queueCards([card], delay);
	}
	return delay

}

/*
 * Добавляет карты в очередь в поле field
 * @field Field - куда добавлять
 * @newCards Array of {
 * 		cid,
 * 		[suit,]
 * 		[value]
 * } 
 */
FieldManager.prototype.placeCards = function(field, newCards, noDelay){
	if(!newCards.length)
		return 0;

	var cardsToPlace = [];
	for(var i = 0; i < newCards.length; i++){
		var cid = newCards[i].cid,
			suit = newCards[i].suit,
			value = newCards[i].value, 
			card = game.cards[cid];
		
		if(card){
			card.presetValue(suit, value);
			card.presetField(field.id);
			card.field && card.field.removeCard(card);
			cardsToPlace.push(card)
		}
		else{
			console.error('Field Manager: Card', card.cid, 'not found')
		}
	}
	return field.addCards(cardsToPlace, noDelay);
}


//FOR EACH FIELD

//Выполняет callback для каждого поля из this.fields
FieldManager.prototype.forEachField = function(callback, context){
	var returnedValues = [];
	for(var si in this.fields){
		if(!this.fields.hasOwnProperty(si))
			continue;
		var field = this.fields[si];
		var returnValue = callback.call(context || this, field, si);
		if(returnValue !== undefined)
			returnedValues.push(returnValue);
	}
	return returnedValues;
}

//Удаляет карты this.cardsToRemove из соответсвующих полей
FieldManager.prototype.removeMarkedCards = function(){
	this.forEachField(function(field, si){
		var cards = this.cardsToRemove[si];
		if(cards.length){
			field.removeCards(cards);
			this.cardsToRemove[si] = [];
		}
	})
}

//Выполняет размещение очередей карт каждого поля
FieldManager.prototype.placeQueuedCards = function(){
	this.forEachField(function(field, si){
		field.placeQueuedCards();
	})
}

//Меняет размеры и устанавливает позицию полей в соотстветсвии с this.positions и this.dimensions
FieldManager.prototype.resizeFields = function(){
	this.calculateSizes();
	this.forEachField(function(field, si){
		field.setBase(this.positions[si].x, this.positions[si].y);
		field.resize(this.dimensions[si].width, this.dimensions[si].height, true);
	})
}

//Ресетит поля
FieldManager.prototype.resetFields = function(){
	this.forEachField(function(field, si){
		field.reset();
	})
}

//Убирает поля
FieldManager.prototype.resetNetwork = function(){
	this.forEachField(function(field, si){
		field.destroy();
	})
	this.fields = {};
}

//ДЕБАГ

//Обновляет дебаг каждого поля
FieldManager.prototype.updateDebug = function(){
	this.forEachField(function(field, si){
		field.updateDebug();
	})
}

//Переключает режим дебага в каждом поле
FieldManager.prototype.toggleDebugMode = function(){
	this.isInDebugMode = !this.isInDebugMode;
	this.forEachField(function(field, si){
		if(field.isInDebugMode != this.isInDebugMode)
			field.toggleDebugMode();
	});
	actions && actions.length && this.highlightPossibleActions(actions);
}