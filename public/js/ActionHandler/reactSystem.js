/* exported reactSystem */
var reactSystem = {
	NAME_INVALID: function(action, seq){
		ui.menus.name.notifyInvalidName();
	},

	NAME_CHANGED: function(action, seq){
		ui.menus.name.updateName(action.name);
	}
};