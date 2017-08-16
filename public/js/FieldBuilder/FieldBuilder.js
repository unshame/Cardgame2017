/**
* Модуль, создающий поля для {@link FieldManager}.
* @param {FieldManager} manager Менеджер полей, для которого рассчитываются размеры.
* @class
*/

var FieldBuilder = function(manager){

	/**
	* Ссылка на менеджер полей
	* @type {FieldManager}
	*/
	this.manager = manager;

	/**
	* Отступы полей
	* @type {Object<number>}
	*/
	this.offsets = {};

	/**
	* Минимальные ширины для размещения карт
	* @type {Object<number>}
	*/
	this.minActiveSpaces = {};

	/**
	* Рассчитанные позиции полей
	* @type {Object<Object>}
	*/
	this.positions = {};

	/**
	* Рассчитанные размеры полей
	* @type {Object<Object>}
	*/
	this.dimensions = {};

	/**
	* Стандартный минимальный размер для размещения карт
	* @type {Number}
	*/
	this.minActiveSpace = 10;

	this._possibleTableOrders = {	
		1: [4, 2, 0, 1, 3, 5],		// 1x6
		2: [2, 3, 0, 1, 4, 5],		// 2x3
		3: [3, 1, 4, 2, 0, 5],		// 3x2
		6: [4, 2, 0, 1, 3, 5]		// 6x1
	};

	/**
	* Последовательность полей стола
	* @type {array}
	*/
	this.tableOrder = null;

	/**
	* Количество полей стола
	* @type {Number}
	*/
	this.tableAmount = 6;

	/**
	* Кол-во полей стола в строке
	* @type {Number}
	*/
	this.tablesInRow = 0;

	/**
	* Отступ между полями стола
	* @type {Number}
	* @private
	*/
	this._tableOffset = 0;

	/**
	* Кол-во клеток, занимаемые полями стола
	* @type {Number}
	* @private
	*/
	this._tableCells = 0;
	
	this._opponentPlacement = null;

	this._opponentsOffset = null;	

	Object.seal(this);
};

/** Создает поля */
FieldBuilder.prototype.createFieldNetwork = function(lockedFields){

	var manager = this.manager,
		players = playerManager.players;

	manager.table.length = 0;
	manager.opponents.length = 0;

	this._opponentPlacement = this._countOpponentPlacement(players.length - 1);
	this.calcSizes();

	this._buildDeckField();
	this._buildDiscardField();
	this._buildPlayerField();
	this._buildOpponentFields();
	this._buildTableFields(lockedFields);

	manager.networkCreated = true;
};

/** Правит поля */
FieldBuilder.prototype.adjustFieldNetwork = function(lockedFields){

	var manager = this.manager,
		players = playerManager.players;

	if(!manager.networkCreated){
		this.createFieldNetwork();
		return;
	}

	manager.table.length = 0;
	manager.opponents.length = 0;

	this._opponentPlacement = this._countOpponentPlacement(players.length - 1);
	this.calcSizes();
	this._buildOpponentFields();
	this._buildDiscardField();
	this._buildTableFields(lockedFields);
};

/**
* Расчитывает размеры и позиции полей.
*/
FieldBuilder.prototype.calcSizes = function(){
	this._calcGenSizes();
	this._calcSpecSizes();
};

/**
* Обобщенные (General) размеры
* @private
*/
FieldBuilder.prototype._calcGenSizes = function(){

	// Игрок
	this._calcGenPlayerSizes();

	// Противники
	this._calcGenOpponentSizes();

	// Стол
	var counter = this.tableAmount;
	do{
		this.tablesInRow = counter;
		this._calcGenTableSizes(counter);
		counter = Math.ceil(counter/2);
	}
	while(this._notEnoughSpace(null, 'table', null, true, true) && counter > 1);
};

/**
* Размеры для каждого поля (Specific)
* @private
*/
FieldBuilder.prototype._calcSpecSizes = function(){
	this._calcDeckDiscardSizes();
	this._calcSpecTableSizes();
	this._calcSpecPlayerSizes();
	this._calcSpecOpponentSizes();
};

//@include:FieldBuilderBuild
//@include:FieldBuilderTable
//@include:FieldBuilderPlayer
//@include:FieldBuilderOpponent

/**
* Размеры для колоды и стопки сброса
* @private
*/
FieldBuilder.prototype._calcDeckDiscardSizes = function(){
	var numOfCards = cardManager.numOfCards,
		halfDensity = Math.floor(game.scale.density / 2);

	this.offsets.DECK = 15;
	this.minActiveSpaces.DECK = numOfCards/2;
	this.dimensions.DECK = {};
	this.positions.DECK = game.scale.cellAt(
		game.scale.density + 3,
		-halfDensity,
		-this.offsets.DECK,
		-this.offsets.DECK
	);

	this.offsets.DISCARD_PILE = 15;
	this.minActiveSpaces.DISCARD_PILE = numOfCards/2;
	this.dimensions.DISCARD_PILE = {};
	this.positions.DISCARD_PILE = game.scale.cellAt(
		game.scale.numCols - game.scale.density - 3,
		-halfDensity,
		-this.offsets.DISCARD_PILE,
		-this.offsets.DISCARD_PILE
	);

	this.positions.DECK.x -= skinManager.skin.height;
};

/**
* Выводит предупреждение в консоль, если ширина меньше ширины одной карты
* @private
* @return {boolean}         Меньше ли ширина\высота.
*/
FieldBuilder.prototype._notEnoughSpace = function(id, ref, index, silent, noHeight, noWidth){
	var isArray = typeof index == 'number',
		width = isArray ? this.dimensions[ref][index].width : this.dimensions[ref].width,
		height = isArray ? this.dimensions[ref][index].height : this.dimensions[ref].height,
		minActiveSpace = isArray ? this.minActiveSpaces[ref][index] : this.minActiveSpaces[ref],
		requiredWidth = skinManager.skin.width + minActiveSpace,
		requiredHeight = skinManager.skin.height + minActiveSpace,
		str = null;

	if(!this.manager.inDebugMode){
		silent = true;
	}

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
	return false;
};