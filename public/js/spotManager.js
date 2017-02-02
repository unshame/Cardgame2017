/*
 * Модуль, создающий и управляющий полями (Spot)
 * Также создает карты. Этот функционал нужно будет переместить в gameManager
 * TODO:
 *  Расположения полей
 * 	Выделение полей в соотвествии с возможными действиями
 * 	Поле стола должно функционировать одновременно как одно и несолько полей
 * 	Поле стола должно центровать поля 
 */

var SpotManager = function(){

	this.networkCreated = false;

	this.spots = {};
	this.positions = {};
	this.dimensions = {};

	this.players = {}
	this.pid = null;
	this.pi = 0;

	this.cardsToRemove = {};
}


//ПОЛЯ

//Рассчитывает размеры полей
//Нужно будет придумать, как распологать поля на экране
SpotManager.prototype.calculateSizes = function(){

	var id;

	//Initial
	this.positions = {
		DECK: {
			x: 100,
			y: appManager.screenHeight - 250
		},
		DISCARD_PILE: {
			x:appManager.screenWidth - 250,
			y:appManager.screenHeight - 250
		},

		//Поле игрока пока не известен id игрока
		playerHand: {
			x:390,
			y:appManager.screenHeight - 250
		},

		//Позиция первого поля на столе
		firstField: {
			x:100,
			y:400
		},

		//Позиция первого поля соперника
		firstOpponent: {
			x:100,
			y:100
		} 
	}
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
			width:appManager.screenWidth - 700,
			//height: 
		},

		//Размер первого поля соперника
		firstOpponent: {
			//width: ,
			//height: 
		} 
	}

	//Field
	var width = (appManager.screenWidth - 130) / 7 - 50;
	for(var i = 0; i <= 6; i++){
		id = 'FIELD' + i;
		x = this.positions.firstField.x + (width + 50)*i;
		y = this.positions.firstField.y;
		this.positions[id] = {x: x, y: y};
		this.dimensions[id] = {width: width};
	}

	//Player
	this.positions[this.pid] = {
		x: this.positions.playerHand.x,
		y: this.positions.playerHand.y
	};
	this.dimensions[this.pid] = {
		width:this.dimensions.playerHand.width
	};

	//Opponents
	width = (appManager.screenWidth - 130) / (this.players.length - 1) - 50;
	var i = this.pi + 1;
	var oi = 0;
	if(i >= this.players.length)
		i = 0;
	while(i != this.pi){
		var p = this.players[i];
		x = this.positions.firstOpponent.x + (width + 50)*oi;
		y = this.positions.firstOpponent.y;
		this.positions[p.id] = {
			x: x,
			y: y
		};
		this.dimensions[p.id] = {
			width: width
		};
		oi++;
		i++;
		if(i >= this.players.length)
			i = 0;
	}
}

//Создает поля
SpotManager.prototype.createSpotNetwork = function(players){

	this.pid = appManager.pid;
	this.players = players;
	var numOfCards = players.length > 4 ? 52 : 36;
	var id;

	this.pi = players.map(function(p){ return p.id }).indexOf(this.pid);
	if(!~this.pi){
		console.error('Player', this.pid, 'not found in players\n', players);
		return
	}

	this.calculateSizes();

	//Deck
	this.spots['DECK'] = new Spot({
		x: this.positions['DECK'].x,
		y: this.positions['DECK'].y,
		minActiveSpace: numOfCards / 2,
		align: 'right',
		padding: 0,
		margin: 22,
		focusable:false,
		forcedSpace: 0.5,
		texture: 'spot',
		sorting: false,
		type: 'DECK',
		id: 'DECK',
		alignment: 'vertical',
		direction: 'backward',
		delayTime: 50
	});
	this.cardsToRemove['DECK'] = [];

	//Discard pile
	this.spots['DISCARD_PILE'] = new Spot({
		x: this.positions['DISCARD_PILE'].x,
		y: this.positions['DISCARD_PILE'].y,
		minActiveSpace: numOfCards / 2,
		padding:0,
		focusable:false,
		forcedSpace: 0.5,
		texture: 'spot',
		sorting: false,
		type: 'DISCARD_PILE',
		id: 'DISCARD_PILE'
	});
	this.cardsToRemove['DISCARD_PILE'] = [];

	//Field
	for(var i = 0; i <= 6; i++){
		id = 'FIELD' + i;
		this.spots[id] = new Spot({
			x: this.positions[id].x,
			y: this.positions[id].y,
			width: this.dimensions[id].width,
			height: this.dimensions[id].height,
			minActiveSpace: skinManager.skin.trumpOffset/2,
			margin:0,
			texture: 'spot',
			focusable:false,
			sorting:false,
			type: 'FIELD',
			id: 'FIELD' + i
		});
		this.cardsToRemove[id] = [];
	}

	//Player hand
	this.spots[this.pid] = new Spot({
		x:this.positions[this.pid].x,
		y:this.positions[this.pid].y,
		width:this.dimensions.playerHand.width,
		texture: 'spot',
		type: 'HAND',
		id: this.pid
	});
	this.cardsToRemove[this.pid] = [];

	//Opponents
	var i =  this.pi + 1;
	var oi = 0;
	if(i >= players.length)
		i = 0;
	while(i != this.pi){
		var p = players[i];
		this.spots[p.id] = new Spot({
			x: this.positions[p.id].x,
			y: this.positions[p.id].y,
			width: this.dimensions[p.id].width,
			texture: 'spot',
			sorting:false,
			focusable:false,
			type: 'HAND',
			id: p.id
		});
		this.cardsToRemove[p.id] = [];
		oi++;
		i++;
		if(i >= players.length)
			i = 0;
	}
	this.networkCreated = true;
}

//Добавляет поле
SpotManager.prototype.addSpot = function(options){
	if(!options)
		options = {};

	this.spots[options.id] = new Spot(options);
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
 * 			spot,
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
 * 		.spot String
 * 		.suit Number
 * 		.value Number
 *
 * 	DISCARD - карты перекладываются со стола в стопку сброса
 * 		.ids Array of String
 *
 * 	SKIP - игрок пропускает ход
 * 		.pid
 */
SpotManager.prototype.executeAction = function(action){

	if(!this.networkCreated)
		return;

	var delay = 0,
		cards, card, spot;

	this.forEachSpot(function(spot, si){
		spot.setHighlight(false);
	})

	var spot = this.spots[this.pid];
	for(var ci = 0; ci < spot.cards.length; ci++){
		spot.cards[ci].setPlayability(false);
	}

	switch(action.type){

		case 'TRUMP_CARDS':
			console.log(action);
			break;

		case 'CARDS':
			this.resetSpots();
			controller.reset();

			for(var cid in gameManager.cards){
				if(gameManager.cards.hasOwnProperty(cid)){
					gameManager.cards[cid].base.removeAll(true);
				}
			}
			gameManager.cards = {};
			gameManager.cardsGroup.removeAll(true);
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
					gameManager.cards[id] = new Card(options);
					discardCards.push(gameManager.cards[id])
				}
				this.spots['DISCARD_PILE'].addCards(discardCards);
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
			spot = this.spots[action.pid];
			delay = this.placeCards(spot, cards);
			break;
			
		case 'ATTACK':
			//Fall-through

		case 'DEFENSE':
			card = {
				cid: action.cid,
				suit: action.suit,
				value: action.value
			}
			spot = this.spots[action.spot];
			delay = this.placeCards(spot, [card]);
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
			spot = this.spots['DISCARD_PILE'];
			delay = this.placeCards(spot, cards);
			break;

		case 'SKIP':
			break;

		default:
			console.warn('Spot manager: Unknown action type', action.type, action)
	}
	return delay
}

//Подсвечивает карты, которыми можно ходить
SpotManager.prototype.highlightPossibleActions = function(actions){
	if(!this.networkCreated)
		return;
	
	this.forEachSpot(function(spot, si){
		spot.setHighlight(false);
	})
	var spot = this.spots[this.pid];
	for(var ci = 0; ci < spot.cards.length; ci++){
		spot.cards[ci].setPlayability(false);
	}
	for(var ai = 0; ai < actions.length; ai++){
		var action = actions[ai];
		if(action.cid && gameManager.cards[action.cid]){
			gameManager.cards[action.cid].setPlayability(true);
			this.spots[action.spot].setHighlight(true);
		}
	}
}


//РАЗМЕЩЕНИЕ КАРТ

/*
 * Добавляет карты в очередь соответствующим полям
 * @newCards Array of {
 *		cid,
 *		pid || spot,
 *		[suit,]
 *		[value]	
 * }
 */
SpotManager.prototype.queueCards = function(newCards){

	var delay = 0;
	for(var ci = 0; ci < newCards.length; ci++){
		var c = newCards[ci];
		var card = gameManager.cards[c.cid];
		if(card){
			card.presetValue(c.suit, c.value);		
			card.presetSpot(c.spot || c.pid);
		}
		else{
			var options = {
				id: c.cid,
				suit: c.suit,
				value: c.value,
				spotId: c.spot || c.pid
			}
			gameManager.cards[c.cid] = new Card(options);
			card = gameManager.cards[c.cid];
		}
		card.spot && this.cardsToRemove[card.spot.id].push(card);
		var spotId = card.spotId;
		if(spotId == 'BOTTOM')
			spotId = 'DECK';
		delay = this.spots[spotId].queueCards([card], delay);
	}
	return delay

}

/*
 * Добавляет карты в очередь в поле spot
 * @spot Spot - куда добавлять
 * @newCards Array of {
 * 		cid,
 * 		[suit,]
 * 		[value]
 * } 
 */
SpotManager.prototype.placeCards = function(spot, newCards){
	if(!newCards.length)
		return 0;

	var cardsToPlace = [];
	for(var i = 0; i < newCards.length; i++){
		var cid = newCards[i].cid,
			suit = newCards[i].suit,
			value = newCards[i].value, 
			card = gameManager.cards[cid];
		
		if(card){
			card.presetValue(suit, value);
			card.presetSpot(spot.id);
			card.spot && card.spot.removeCard(card);
			cardsToPlace.push(card)
		}
		else{
			console.error('Spot Manager: Card', card.cid, 'not found')
		}
	}
	return spot.addCards(cardsToPlace);
}


//FOR EACH SPOT

//Выполняет callback для каждого поля из this.spots
SpotManager.prototype.forEachSpot = function(callback, context){
	var returnedValues = [];
	for(var si in this.spots){
		if(!this.spots.hasOwnProperty(si))
			return;
		var spot = this.spots[si];
		var returnValue = callback.call(context || this, spot, si);
		if(returnValue !== undefined)
			returnedValues.push(returnValue);
	}
	return returnedValues;
}

//Удаляет карты this.cardsToRemove из соответсвующих полей
SpotManager.prototype.removeMarkedCards = function(){
	this.forEachSpot(function(spot, si){
		var cards = this.cardsToRemove[si];
		if(cards.length){
			spot.removeCards(cards);
			this.cardsToRemove[si] = [];
		}
	})
}

//Выполняет размещение очередей карт каждого поля
SpotManager.prototype.placeQueuedCards = function(){
	this.forEachSpot(function(spot, si){
		spot.placeQueuedCards();
	})
}

//Меняет размеры и устанавливает позицию полей в соотстветсвии с this.positions и this.dimensions
SpotManager.prototype.resizeSpots = function(){
	this.calculateSizes();
	this.forEachSpot(function(spot, si){
		spot.setBase(this.positions[si].x, this.positions[si].y);
		spot.resize(this.dimensions[si].width, this.dimensions[si].height, true);
	})
}

//Применяет текущий скин к полям. На данный момент меняет только высоту поля 
SpotManager.prototype.applySkin = function(){
	this.forEachSpot(function(spot, si){
		spot.resize(null, null, true);
	})
}

//Ресетит поля
SpotManager.prototype.resetSpots = function(){
	this.forEachSpot(function(spot, si){
		spot.reset();
	})
}


//ДЕБАГ

//Обновляет дебаг каждого поля
SpotManager.prototype.updateDebug = function(){
	this.forEachSpot(function(spot, si){
		spot.updateDebug();
	})
}

//Переключает режим дебага в каждом поле
SpotManager.prototype.toggleDebugMode = function(){
	this.forEachSpot(function(spot, si){
		spot.toggleDebugMode();
	})
}