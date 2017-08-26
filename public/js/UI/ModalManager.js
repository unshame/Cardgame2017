/**
* Менеджер модальных меню. 
* Блокирует нажатия на элементы за модальными меню и предоставляет последовательные закрытия.
* Модальные меню нужно открывать и закрывать через методы этого модуля для корректной работы.
* @class 
* @extends {Phaser.Image}
*/
UI.ModalManager = function(){
	Phaser.Image.call(this, game, 0, 0);
	this.name = 'modal';
	this.inputEnabled = true;
	this.visible = false;
	this.modals = [];
	this.events.onInputDown.add(this.closeModal, this);
	this.updatePosition();
};

extend(UI.ModalManager, Phaser.Image);

/** Обновляет позицию блокировщика нажатий. */
UI.ModalManager.prototype.updatePosition = function(){
	this.width = game.screenWidth;
	this.height = game.screenHeight;
};

UI.ModalManager.prototype.makeModal = function(menus){
	for(var i = 0; i < menus.length; i++){
		var menu = menus[i];
		if(!menu.fadeIn || !menu.fadeOut){
			console.error('UI.ModalManager: menu doesn\'t have required methods');
			continue;
		}
		menu.modal = true;
		menu._fadeIn = menu.fadeIn;
		menu._fadeOut = menu.fadeOut;
		menu._fadeToggle = menu.fadeToggle;
		menu.fadeIn = menu.fadeOut = menu.fadeToggle = this._preventDirectCall.bind(menu);
	}
};

UI.ModalManager.prototype._preventDirectCall = function(){
	console.error('UI.ModalManager: menu should be opened/closed through UI.ModalManager', this);
};

UI.ModalManager.prototype.openModal = function(menuName){
	var menu = ui.menus[menuName],
		len = this.modals.length,
		i = this.modals.indexOf(menu);

	if(!menu.modal){
		console.error('Modal manager: cannot open non-modal menu');
		return;
	}

	// Закрываем текущее верхнее меню
	if(len){
		this.modals[len - 1]._fadeOut();
	}

	// Если меню не было уже открыто, добавляем его в массив,
	// иначе убираем все после этого меню в массиве
	if(!~i){
		this.modals.push(menu);
	}
	else if(i != len - 1 && len > 1){
		this.modals.splice(i + 1, len - i - 1);
	}

	menu._fadeIn();
	this.updateVisibility();

	ui.layers.updateModalIndex(menu);
};

UI.ModalManager.prototype.closeModal = function(){
	if(!this.modals.length){
		return;
	}
	var len = this.modals.length;

	// Верхнее меню
	var top = this.modals[len - 1];

	// Меню под верхним
	var subtop = this.modals[len - 2];

	// Закрываем верхнее меню
	this.modals.splice(len - 1, 1);
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
	var len = this.modals.length;
	if(len && !this.visible){
		this.visible = true;
	}
	else if(!len && this.visible){
		this.visible = false;
	}
};

UI.ModalManager.prototype.toggleModals = function(menuName){
	if(this.modals.length){
		this.closeModal();
	}
	else{
		this.openModal(menuName);
	}
};

/*
// Вариант функции, сохраняющий и восстанавливающий открытые меню
UI.ModalManager.prototype.toggleModals = function(){
	var len = this.modals.length
	if(this.visible){
		this.modals[len - 1]._fadeOut();
		this.visible = false;
	}
	else{
		if(len){
			this.modals[len - 1]._fadeIn();
		}
		else{
			this.baseMenu._fadeIn();
			this.modals.push(this.baseMenu);
		}
		this.updateVisibility();
	}
}*/