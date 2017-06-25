//Entry point

//@include:ActionHandler
//@include:Card
//@include:CardControl
//@include:CardEmitter
//@include:CardManager
//@include:ConnectionManager
//@include:Field
//@include:FieldBuilder
//@include:FieldManager
//@include:Game
//@include:Grid
//@include:PlayerManager
//@include:Sequencer
//@include:SkinManager
//@include:UI

/**
* Игра
* @type {Game}
* @global
*/
window.game = new Game();
game.state.add(statePlay.key, statePlay, false);
game.state.add(stateBoot.key, stateBoot, true);

/*jshint unused:false*/
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
	}
};

/**
 * Fisher–Yates Shuffle
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
