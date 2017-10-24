UI.Checkbox = function(options){
	this.options = mergeOptions(this.getDefaultCheckboxOptions(), options);

	this.options.size = 'checkbox';
	this.options.downOffset = 0;
	this.options.mobileClickProtect = false;
	this.options.action = this.check.bind(this);

	this.checked = this.options.checked;
	this.actionEnable = this.options.actionEnable;
	this.actionDisable = this.options.actionDisable;

	var hoverPlacement = this.options.hoverPlacement;
	var hoverText = this.options.hoverText;

	UI.Button.call(this, this.options);

	if(this.checked){
		this.frame = 1;
	}
	UI.ButtonBase.setStateFrames(this, this.frame);

	if(this.label){
		this.label.inputEnabled = true;
		this.label.events.onInputUp.add(this.action);
		this.label.anchor.set(0, 0);
		if(hoverText && Phaser.Device.desktop){
			UI.PopupComponent.call(
				this,
				this.label,
				hoverPlacement,
				hoverText,
				[this.button]
			);
		}
	}
};

extend(UI.Checkbox, UI.Button, [UI.PopupComponent]);

UI.Checkbox.prototype.getDefaultCheckboxOptions = function(){
	return {
		position: {
			x: 0,
			y: 0
		},
		color: 'grey',
		actionEnable: function(){},
		actionDisable: function(){},
		text: '',
		name: null,
		textColor: 'black',
		font: 'Exo, Helvetica',
		fontSize: 26,
		context: null,
		group: null,
		scale: 1,
		checked: false,
		hoverText: null,
		hoverPlacement: 'top'
	};
};


UI.Checkbox.prototype.check = function(){
	if(this.checked){
		this.checked = false;
		this.actionDisable.call(this.options.context || this);
		this.frame = 0;
	}
	else{
		this.checked = true;
		this.actionEnable.call(this.options.context || this);
		this.frame = 1;
	}
	UI.ButtonBase.setStateFrames(this, this.frame);
};


UI.Checkbox.prototype.updatePosition = function(position){
	supercall(UI.Checkbox).updatePosition.call(this, position);
	if(this.label){
		this.label.x = this.button.x + this.button.width;
		this.label.y = this.button.y + this.button.height/2 - this.label.height/2 + 3;
	}
};

UI.Checkbox.prototype.enable = function(){
	supercall(UI.Checkbox).enable.call(this);
	this.alpha = 1;
};

UI.Checkbox.prototype.disable = function(passive){
	supercall(UI.Checkbox).disable.call(this, passive);
	if(!passive){
		this.alpha = 0.75;
	}
};