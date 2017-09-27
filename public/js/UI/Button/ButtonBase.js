/**
* Кнопка, сдвигающая `label` у `parent` при нажатии.
* @class
* @extends {Phaser.Button}
*/
UI.ButtonBase = function(){
	Phaser.Button.apply(this, arguments);
};

extend(UI.ButtonBase, Phaser.Button);

/**
* Вызывается игрой для смены состояния кнопки.
* @param {string} state новое состояние
*
* @return {boolean} Было ли присвоено новое состояние.
*/
UI.ButtonBase.prototype.changeStateFrame = function (state) {
	if(this.parent && this.parent.label && this.inputEnabled){
		if(state != UI.ButtonBase.States.STATE_DOWN && this.parent.isDown){
			this.parent.isDown = false;
			this.parent.updatePosition();
		}
		else if(state == UI.ButtonBase.States.STATE_DOWN && !this.parent.isDown){
			this.parent.isDown = true;
			this.parent.label.y += this.parent.options.downOffset;
		}
	}
	if(this.parent && this.parent.label){
		this.parent.label.state = state;
	}

	if(this.inputEnabled){
		return supercall(UI.ButtonBase).changeStateFrame.call(this, state);
	}
};


UI.ButtonBase.setStateFrames = function(button, frame){
	if(button.options){
		button.options.defaultFrame = button.options.overFrame = button.options.disabledFrame = button.options.downFrame = frame;
	}
	if(!(button instanceof Phaser.Button)){
		button = button.button;
	}
	if(!(button instanceof Phaser.Button)){
		console.error('UI: isn\'t a button');
		return;
	}
    button.setStateFrame(UI.ButtonBase.States.STATE_OVER, frame, button.input.pointerOver()); 
    button.setStateFrame(UI.ButtonBase.States.STATE_OUT, frame, !button.input.pointerOver()); 
    button.setStateFrame(UI.ButtonBase.States.STATE_DOWN, frame, button.input.pointerDown()); 
    button.setStateFrame(UI.ButtonBase.States.STATE_UP, frame, button.input.pointerUp());
    button.frame = frame;
}

UI.ButtonBase.States = { 
    STATE_OVER: 'Over', 
    STATE_OUT: 'Out', 
    STATE_DOWN: 'Down', 
    STATE_UP: 'Up' 
}