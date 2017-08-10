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
//@include:StateManager
//@include:State
//@include:ScaleManager
//@include:PlayerManager
//@include:Sequencer
//@include:SkinManager
//@include:UI
//@include:MessageFeed

/**
* Игра
* @type {Game}
* @global
*/
var game = new Game('cardgame', 1, localStorage.getItem('durak_debug') == 'true');
game.state.add(stateMenu, false, false);
game.state.add(statePlay, false, false);
game.state.add(stateBoot, true, true);