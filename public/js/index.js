// Entry point

//@include:global
//@include:fonts
//@include:loc
//@include:types

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
//@include:State
//@include:ScaleManager
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
game.state.add(stateMenu.key, stateMenu, false);
game.state.add(statePlay.key, statePlay, false);
game.state.add(stateBoot.key, stateBoot, true);