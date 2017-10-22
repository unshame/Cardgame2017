/* exported reactSystem */
var reactSystem = {
	NAME_INVALID: function(action, seq){
		ui.feed.newMessage('Invalid name', 2000);
		ui.cornerButtons.getByName('name').show();
		ui.menus.name.enableElement('change');
	},

	NAME_CHANGED: function(action, seq){
		var name = action.name;
		var oldName = gameOptions.get('profile_name');
		if(name != oldName){
			ui.feed.newMessage('Hello, ' + name, 2000);
			gameOptions.set('profile_name', name);
			gameOptions.save();
		}
		else{
			ui.feed.newMessage('Welcome back, ' + name, 2000);
		}
		ui.menus.name.enableElement('change');
		ui.modalManager.closeAllModals();
		ui.cornerButtons.getByName('name').hide();
		var field = ui.menus.name.getElementByName('name');
		field.placeHolder.setText(name, true);
		field.resetText();
	}
};