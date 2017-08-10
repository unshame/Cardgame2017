/*jshint unused:false*/

// Глобальные модули
var actionHandler,
	announcer,
	cardControl,
	cardEmitter,
	cardManager,
	connection,
	eventFeed,
	feed,
	fieldManager,
	gameSeq,
	playerManager,
	skinManager,
	skins,
	ui;

// Глобальные методы

/**
* Fisher–Yates Shuffle (сортировка массивов).
* @param  {array} a массив для сортировки
* @global
* @return {array}   отсортированный массив (тот же, что и на входе)
*/
function shuffleArray(a){
	var currentIndex = a.length,
		temporaryValue,
		randomIndex;

	// While there remain elements to shuffle...
	while (0 !== currentIndex) {

		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		// And swap it with the current element.
		temporaryValue = a[currentIndex];
		a[currentIndex] = a[randomIndex];
		a[randomIndex] = temporaryValue;
	}
	return a;
}

/**
* Совмещает свойства по-умолчанию с неполностью указанными свойствами.  
* @global
* @param  {object} dest   опции по-умолчанию, которые нужно перезаписать
* @param  {object} source опции, которыми нужно перезаписать
* @return {object} 		  Возвращает объект, в котором свойства `dest` заменены на
*                         свойства `source`, если они существуют и там и там.         
*/
function mergeOptions(dest, source){
	if(typeof dest != 'object'){
		console.error('Can\'t merge options: no destination provided');
		return;
	}
	if(typeof source == 'object'){
		for(var o in dest){
			if(source.hasOwnProperty(o) && source[o] !== undefined){
				dest[o] = source[o];
			}
		}
	}
	return dest;
}

/**
* Добавляет нули перед строкой до указанного кол-ва.
* @global
* @param  {string} str 	строка
* @param  {number} [len=2] желаемая длина строки длина
* @return {string}         Полученная строка с нулями.
*/
function leadWithZeros(str, len){
	len = len || 2;
	return (Array(len).join('0') + str).slice(-len);
}

/**
* Конвертирует число в строку по типу `#000000`.
* @global
* @param  {number} number число
* @return {string}        Строка по типу `#000000`.
*/
function numberToHexColor(number){
	var string = leadWithZeros(number.toString(16), 6);
	string = '#' + string;
	return string;
}


// TEST AND DEBUG FUNCTIONS

var	getCard,
	getCards;

/**
* Выводит в консоль имена слоев интерфейса и сами слои
* @type {function}
* @global
* @see  {@link UILayers#getOrder}
*/
function printLayers(){
	console.table(ui.layers.getOrder());
}

/**
* Переносит самую левую карту в руке игрока на стол с задержкой.
* @param  {number} [i=0] id поля стола
* @param {number} [delay=3000] задержка
* @global
*/
function moveFirstPlayerCardToTable(i, delay){
	if(delay === undefined)
		delay = 3000;
	var c = fieldManager.fields[playerManager.pid].cards[0];
	var ci = {cid: c.id, suit: c.suit, value: c.value};
	setTimeout(function(){
		fieldManager.moveCards(fieldManager.fields['TABLE' + (i || 0)], [ci]);
	}, delay);
}

var animTest = {
	win: function(){
		var discard = fieldManager.fields.DISCARD_PILE;			
		discard.addCards(getCards(30, discard.cards));			
		actionHandler.notificationReactions.GAME_ENDED.call(actionHandler, {results: {winners: [game.pid]}});
	},
	lose: function(){
		var discard = fieldManager.fields.DISCARD_PILE;			
		discard.addCards(getCards(30, discard.cards));			
		actionHandler.notificationReactions.GAME_ENDED.call(actionHandler, {results: {loser: game.pid}});
	},
	eh: function(){
		var discard = fieldManager.fields.DISCARD_PILE;			
		discard.addCards(getCards(30, discard.cards));			
		actionHandler.notificationReactions.GAME_ENDED.call(actionHandler, {});
	},
	unlockField: function(){
		fieldManager.unlockField('TABLE5');
	},
	trump: function(){
		var cards = getCards(5),
			cardsInfo = [];
		for(var ci = 0; ci < cards.length; ci++){
			var c = cards[ci];
			cardsInfo.push({cid: c.id, suit: c.suit, value: c.value, pid: c.fieldId});
		}
		actionHandler.actionReactions.TRUMP_CARDS.call(actionHandler, {cards: cardsInfo, pid: game.pid});
	},
	eventFeed: function(){
		for(var i = 0; i < 20; i++){
			eventFeed.newMessage(Math.random(), (20-i)*200);
		}
	},
	countdown: function(i, message){
		if(!i || typeof i != 'number' || isNaN(i) || i < 1){
			i = 5;
		}
		if(!message){
			message = 'GO!';
		}
		var start = Date.now();
		var last = 0;
		var interval = setInterval(function(){
			var now = Date.now();
			if(now - last >= 1000){
				last = now;
				switch(i){
					case 0:
					eventFeed.newMessage(message);
					break;

					case -1:
					eventFeed.clear();
					clearInterval(interval);
					break;

					default:
					eventFeed.newMessage(i + '...');
				}
				i--;
			}
		}, 50);
	}
};
