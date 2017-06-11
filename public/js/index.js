//Entry point

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
 * Переносит самую левую карты в руке игрока на стол с задержкой.
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