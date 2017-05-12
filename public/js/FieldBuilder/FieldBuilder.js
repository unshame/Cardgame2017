/**
* Модуль, создающий поля для FieldManager
* @class
*/

var FieldBuilder = function(manager){

	this.manager = manager;

	this.offsets = {};
	this.minActiveSpaces = {};
	this.positions = {};
	this.dimensions = {};

	this.minActiveSpace = 10;

	this.possibleTableOrders = [	
		[4, 2, 0, 1, 3, 5],		//никогда не понадобится
		[2, 3, 0, 1, 4, 5],		//никогда не понадобится
		[5, 1, 3, 4, 0, 2],		//3x2
		null,					//невозможно
		null,					//невозможно
		[4, 2, 0, 1, 3, 5]		//6x1
	];
	this.tableOrder = [];
	this.tableOrder.length = 6;
};

//Создает поля
FieldBuilder.prototype.createFieldNetwork = function(){

	var manager = this.manager,
		players = playerManager.players;


	this.opponentPlacement = this._countOpponentPlacement(players.length - 1);
	this.calcSizes();

	this._buildDeckField();
	this._buildDiscardField();
	this._buildPlayerField();
	this._buildOpponentFields();
	this._buildTableFields();

	manager.networkCreated = true;
};

//Правит поля
FieldBuilder.prototype.adjustFieldNetwork = function(){

	var manager = this.manager,
		players = playerManager.players;

	if(!manager.networkCreated){
		this.createFieldNetwork();
		return;
	}

	manager.table.length = 0;

	this.opponentPlacement = this._countOpponentPlacement(players.length - 1);
	this.calcSizes();
	this._buildOpponentFields();
	this._buildDiscardField();
	this._buildTableFields();
};

FieldBuilder.prototype.calcSizes = function(){
	this._calcGenSizes();
	this._calcSpecSizes();
}

//FieldBuilderProtoBuild

//Обобщенные (General) размеры
FieldBuilder.prototype._calcGenSizes = function(){

	//Игрок
	this._calcGenPlayerSizes();

	//Противники
	this._calcGenOpponentSizes();

	//Стол
	var counter = this.tableOrder.length;
	do{
		this.tablesInRow = counter;
		this._calcGenTableSizes(counter);
		counter = Math.ceil(counter/2);
	}
	while(this._notEnoughSpace(null, 'table', null, true, true) && counter > 1);
};

//Размеры для каждого поля (Specific)
FieldBuilder.prototype._calcSpecSizes = function(){
	this._calcDeckDiscardSizes();
	this._calcSpecTableSizes();
	this._calcSpecPlayerSizes();
	this._calcSpecOpponentSizes();
};

//FieldBuilderProtoTable
//FieldBuilderProtoPlayer
//FieldBuilderProtoOpponent

//Размеры для колоды и стопки сброса
FieldBuilder.prototype._calcDeckDiscardSizes = function(){
	var numOfCards = playerManager.players.length > 3 ? 52 : 36,
		halfDensity = Math.floor(grid.density / 2);

	this.offsets.DECK = 22;
	this.minActiveSpaces.DECK = numOfCards/2;
	this.dimensions.DECK = {};
	this.positions.DECK = grid.at(
		grid.density + 3,
		-halfDensity,
		-this.offsets.DECK,
		-this.offsets.DECK
	);

	this.offsets.DISCARD_PILE = 22;
	this.minActiveSpaces.DISCARD_PILE = numOfCards/2;
	this.dimensions.DISCARD_PILE = {};
	this.positions.DISCARD_PILE = grid.at(
		grid.numCols - grid.density - 3,
		-halfDensity,
		-this.offsets.DISCARD_PILE,
		-this.offsets.DISCARD_PILE
	);

	this.positions.DECK.x -= skinManager.skin.height;
};

//Выводит предупреждение в консоль, если ширина меньше ширины одной карты
FieldBuilder.prototype._notEnoughSpace = function(id, ref, index, silent, noHeight, noWidth){
	var isArray = typeof index == 'number',
		width = isArray ? this.dimensions[ref][index].width : this.dimensions[ref].width,
		height = isArray ? this.dimensions[ref][index].height : this.dimensions[ref].height,
		minActiveSpace = isArray ? this.minActiveSpaces[ref][index] : this.minActiveSpaces[ref],
		requiredWidth = skinManager.skin.width + minActiveSpace,
		requiredHeight = skinManager.skin.height + minActiveSpace,
		str = null;

	if(!noWidth && (width || width === 0) && width < requiredWidth){
		str = ['Field builder: Not enough space for field', id, '(', width, '<', requiredWidth, ')\n'];
	}
	else if(!noHeight && (height || height === 0) && height < requiredHeight){
		str = ['Field builder: Not enough space for field', id, '(', height, '<', requiredHeight, ')\n'];
	}

	if(str){
		if(!silent){
			str.push(this.manager.fields[id]);
			console.warn.apply(console, str);
		}
		return true;
	}
	else return false;
};