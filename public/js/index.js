//Entry point

/**
 * Игра
 * @type {Game}
 * @global
 */
window.game = new Game();
game.state.add('Play', playState, true);