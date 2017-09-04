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
		if(state != 'Down' && this.parent.isDown){
			this.parent.isDown = false;
			this.parent.updatePosition();
		}
		else if(state == 'Down' && !this.parent.isDown){
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