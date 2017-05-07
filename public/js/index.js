//Entry point

/**
 * Игра
 * @type {Game}
 * @global
 */
window.game = new Game();
game.state.add('Play', playState, true);

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