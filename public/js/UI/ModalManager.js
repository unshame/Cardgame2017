/**
* Менеджер модальных элементов. 
* Блокирует нажатия на элементы за модальными элементами и предоставляет последовательные закрытия.
* Модальные элементы нужно показывать и прятать через методы этого модуля для корректной работы.
* @class 
* @extends {Phaser.Image}
*/
UI.ModalManager = function(){
	Phaser.Image.call(this, game, 0, 0);
	this.name = 'modal';
	this.inputEnabled = true;
	this.visible = false;
	this.modals = {};
	this.openModals = [];
	this.events.onInputDown.add(this.closeModal, this);
	this.updatePosition();
};

extend(UI.ModalManager, Phaser.Image);

/** Обновляет позицию блокировщика нажатий. */
UI.ModalManager.prototype.updatePosition = function(){
	this.width = game.screenWidth;
	this.height = game.screenHeight;
};

UI.ModalManager.prototype.makeModal = function(){
	for(var i = 0; i < arguments.length; i++){
		var modal = arguments[i];
		if(!modal.fadeIn || !modal.fadeOut){
			console.error('UI.ModalManager: modal doesn\'t have required methods');
			continue;
		}
		this.modals[modal.name] = modal;
		modal.modal = true;
		modal._fadeIn = modal.fadeIn;
		modal._fadeOut = modal.fadeOut;
		modal._fadeToggle = modal.fadeToggle;
		modal.fadeIn = modal.fadeOut = modal.fadeToggle = this._preventDirectCall.bind(modal);
	}
};

UI.ModalManager.prototype._preventDirectCall = function(){
	console.error('UI.ModalManager: modal should be opened/closed through UI.ModalManager', this);
};

UI.ModalManager.prototype.openModal = function(modalName){
	var modal = this.modals[modalName] || this.modals['menu_' + modalName],
		len = this.openModals.length,
		i = this.openModals.indexOf(modal);

	if(!modal.modal){
		console.error('Modal manager: cannot open non-modal modal');
		return;
	}

	// Закрываем текущее верхнее меню
	if(len){
		this.openModals[len - 1]._fadeOut();
	}

	// Если меню не было уже открыто, добавляем его в массив,
	// иначе убираем все после этого меню в массиве
	if(!~i){
		this.openModals.push(modal);
	}
	else if(i != len - 1 && len > 1){
		this.openModals.splice(i + 1, len - i - 1);
	}

	modal._fadeIn();
	this.updateVisibility();

	ui.layers.updateModalIndex(modal);
};

UI.ModalManager.prototype.closeModal = function(){
	if(!this.openModals.length){
		return;
	}
	var len = this.openModals.length;

	// Верхнее меню
	var top = this.openModals[len - 1];

	// Меню под верхним
	var subtop = this.openModals[len - 2];

	// Закрываем верхнее меню
	this.openModals.splice(len - 1, 1);
	top._fadeOut();

	// Открываем меню под ним если оно есть
	if(subtop){
		subtop._fadeIn();
	}
	else{
		this.updateVisibility();
	}

	ui.layers.updateModalIndex(subtop);
};

UI.ModalManager.prototype.updateVisibility = function(){
	var len = this.openModals.length;
	if(len && !this.visible){
		this.visible = true;
	}
	else if(!len && this.visible){
		this.visible = false;
	}
};

UI.ModalManager.prototype.toggleModals = function(modalName){
	if(this.openModals.length){
		this.closeModal();
	}
	else{
		this.openModal(modalName);
	}
};

/*
// Вариант функции, сохраняющий и восстанавливающий открытые меню
UI.ModalManager.prototype.toggleModals = function(){
	var len = this.openModals.length
	if(this.visible){
		this.openModals[len - 1]._fadeOut();
		this.visible = false;
	}
	else{
		if(len){
			this.openModals[len - 1]._fadeIn();
		}
		else{
			this.baseModal._fadeIn();
			this.openModals.push(this.baseModal);
		}
		this.updateVisibility();
	}
}*/