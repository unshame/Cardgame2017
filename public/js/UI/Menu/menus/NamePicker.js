var NamePicker = function(options){

	this.options = mergeOptions(this.getDefaultMenuOptions(), options);

	this.nameMaxLength = 8;

	this.cornerButton = ui.cornerButtons.getByName('name');

	this.nameChanged = false;

	var layout = [[
		Menu.inputField({
			name: 'name',
			placeHolder: 'Player1',
			maxChars: this.nameMaxLength
		}),
		{
			text: 'Change Name',
			name: 'change',
			color: 'orange',
			textColor: 'white',
			action: this.pickName
		}
	]];

	this.options.layout = layout;
	
	Menu.call(this, this.options);
};

extend(NamePicker, Menu);

NamePicker.prototype.getDefaultMenuOptions = function(){
	var modifier;
	if(Phaser.Device.desktop){
		modifier = 2;
	}
	else if(game.scale.isPortrait){
		modifier = 3;
	}
	else{
		modifier = 4;
	}
	return {
		position: function(){
			return {
				x: game.screenWidth / 2,
				y: game.screenHeight / modifier
			};
		}, 
		z: -4,
		color: 'grey',
		elementColor: 'grey',
		textColor: 'black',
		name: 'menu_name',
		header: 'Enter Name',
		modal: true,
		closeButton: function(){
			ui.modalManager.closeModal();
		},
		closeButtonCrossColor: 'grey'
	};
};

NamePicker.prototype.pickName = function(){

	var name = this.getElementByName('name').getText();
	var oldName = gameOptions.get('profile_name');

	if(oldName && oldName == name){
		ui.feed.newMessage('Please enter a different name', 3000);
	}
	else if(name.length > 0 && name.length <= this.nameMaxLength){
		this.disableElement('change');
		connection.proxy.changeClientName(name);
	}
	else{
		ui.feed.newMessage(name.length > 0 ? 'Name is too long (' + this.nameMaxLength + ' characters max)' : 'Please enter name', 3000);
	}
};

NamePicker.prototype.notifyInvalidName = function(){
	ui.feed.newMessage('Invalid name', 2000);
	this.enableElement('change');
	if(!this.nameChanged){
		this.cornerButton.show();
	}
};

NamePicker.prototype.updateName = function(name){
	var oldName = gameOptions.get('profile_name');

	if(name != oldName){
		ui.feed.newMessage('Hello, ' + name, 2000);
		gameOptions.set('profile_name', name);
		gameOptions.save();
	}
	else{
		ui.feed.newMessage('Welcome back, ' + name, 2000);
	}

	this.enableElement('change');
	ui.modalManager.closeAllModals();
	this.cornerButton.hide();
	this.nameChanged = true;
	
	var field = this.getElementByName('name');
	field.placeHolder.setText(name, true);
	field.resetText();
};
