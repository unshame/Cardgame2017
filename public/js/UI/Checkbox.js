UI.Checkbox = function(options){
	this.options = mergeOptions(this.getDefaultCheckboxOptions(), options);
	this.options.size = 'checkbox';
	this.options.downOffset = 0;
	this.options.mobileClickProtect = false;
	this.actionEnable = this.options.actionEnable;
	this.actionDisable = this.options.actionDisable;
	this.options.action = this.check.bind(this);
	UI.Button.call(this, this.options);
	this._onOverFrame = 0;
	this._onOutFrame = 0;
	this._onDownFrame = 0;
	this._onUpFrame = 0;
	this.checked = false;
	this.setStateFrames(this.frame);
	this.currentFrame = this.frame;
}
// Наследуем класс Button
extend(UI.Checkbox, UI.Button);

// заопминаем состояния кнопки, наследуемые у класса Phaser.Button
UI.States = {
	STATE_OVER: 'Over',
	STATE_OUT: 'Out',
	STATE_DOWN: 'Down',
	STATE_UP: 'Up'
}

UI.Checkbox.prototype.getDefaultCheckboxOptions = function(){
	return {
		position: {
			x: 0,
			y: 0
		},
		color: 'grey',
		actionEnable: function(){},
		actionDisable: function(){},
		text: 'KJASDHKSAH',
		name: null,
		textColor: 'black',
		font: 'Exo',
		fontSize: 26,
		context: null,
		group: null,
		scale: 1
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
	this.setStateFrames(this.frame);

}
// функция смены фрейма()
UI.Checkbox.prototype.setStateFrames = function(frame){
	this.button.setStateFrame(UI.States.STATE_OVER, frame, this.button.input.pointerOver());
	this.button.setStateFrame(UI.States.STATE_OUT, frame, !this.button.input.pointerOver());
	this.button.setStateFrame(UI.States.STATE_DOWN, frame, this.button.input.pointerDown());
	this.button.setStateFrame(UI.States.STATE_UP, frame, this.button.input.pointerUp());	
}


UI.Checkbox.prototype.updatePosition = function(position){
	if(position){
		this.defaultPosition = position;
	}
	else{
		position = this.defaultPosition;
	}
	if(typeof position == 'function'){
		position = position.call(this, this.button.width, this.button.height);
	}
	this.x = position.x;
	this.y = position.y;
	if(this.label){
		this.label.x = this.button.x + this.button.width+80;
		this.label.y = this.button.centerY + this.label.height/16;
		
	}
	this.setStateFrames(this.frame);
};
/*UI.Checkbox.prototype.updatePosition = function(position){
	supercall(UI.Checkbox).updatePosition(position);

};*/

UI.Checkbox.prototype.show = function(){
	this.show();
	}/*
UI.Checkbox.prototype.hide = function(){
	this.visible = false;
}
UI.Checkbox.prototype.updatePosition = function(position){
	if(position){
		this.defaultPosition = position;
	}
	else{
		position = this.defaultPosition;
	}
	if(typeof position == 'function'){
		position = position.call(this, this.width, this.height);
	}
	this.x = position.x;
	this.y = position.y;
}

UI.Checkbox.prototype.enable = function(){};
UI.Checkbox.prototype.disable = function(){};*/