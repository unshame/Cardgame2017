/**
 * Менеджер модальных меню. 
 * Блокирует нажатия на элементы за модальными меню и предоставляет последовательные закрытия.
 * Модальные меню нужно открывать и закрывать через методы этого модуля для корректной работы.
 * @class 
 * @extends {Phaser.Image}
 */
var ModalManager = function(){
	Phaser.Image.call(this, game, 0, 0);
	this.name = 'modal';
	this.inputEnabled = true;
	this.visible = false;
	this.modals = [];
	this.events.onInputDown.add(this.closeModal, this);
	this.updatePosition();
};

extend(ModalManager, Phaser.Image);

ModalManager.prototype.updatePosition = function(){
	this.width = game.screenWidth;
	this.height = game.screenHeight;
};

ModalManager.prototype.openModal = function(menuName){
	var menu = ui.menus[menuName],
		len = this.modals.length,
		i = this.modals.indexOf(menu);

	// Закрываем текущее верхнее меню
	if(len){
		this.modals[len - 1].fadeOut();
	}

	// Если меню не было уже открыто, добавляем его в массив,
	// иначе убираем все после этого меню в массиве
	if(!~i){
		this.modals.push(menu);
	}
	else if(i != len - 1 && len > 1){
		this.modals.splice(i + 1, len - i - 1);
	}

	menu.fadeIn();
	this.updateVisibility();
};

ModalManager.prototype.closeModal = function(){
	if(!this.modals.length)
		return;
	var len = this.modals.length;

	// Верхнее меню
	var top = this.modals[len - 1];

	// Меню под верхним
	var subtop = this.modals[len - 2];

	// Закрываем верхнее меню
	this.modals.splice(len - 1, 1);
	top.fadeOut();

	// Открываем меню под ним если оно есть
	if(subtop){
		subtop.fadeIn();
	}
	else{
		this.updateVisibility();
	}
};

ModalManager.prototype.updateVisibility = function(){
	var len = this.modals.length;
	if(len && !this.visible){
		this.visible = true;
	}
	else if(!len && this.visible){
		this.visible = false;
	}
};

ModalManager.prototype.toggleModals = function(menuName){
	if(this.modals.length){
		this.closeModal(this.modals.length);
	}
	else{
		this.openModal(menuName);
	}
};

/*
// Вариант функции, сохраняющий и восстанавливающий открытые меню
ModalManager.prototype.toggleModals = function(){
	var len = this.modals.length
	if(this.visible){
		this.modals[len - 1].fadeOut();
		this.visible = false;
	}
	else{
		if(len){
			this.modals[len - 1].fadeIn();
		}
		else{
			this.baseMenu.fadeIn();
			this.modals.push(this.baseMenu);
		}
		this.updateVisibility();
	}
}*/