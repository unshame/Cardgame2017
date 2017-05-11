//ВЫДЕЛЕНИЕ КАРТ КУРСОРОМ

/**
* Запускает таймер, во время которого карты не реагируют на курсор.
* @param {number} time время таймера
*/
Field.prototype.setUninteractibleTimer = function(time){

	if(!time || typeof time != 'number' || isNaN(time))
		return;

	if(this.uninteractibleTimer){
		clearTimeout(this.uninteractibleTimer);
		this.uninteractibleTimer = null;
	}

	if(game.paused)
		return;

	function makeInteracible(){
		this.zAlignCards();
		this.uninteractibleTimer = null;
	}

	this.uninteractibleTimer = setTimeout(makeInteracible.bind(this), time/game.speed);
};

/**
* Выделяет карту, над которой находится курсор.
* @param  {Card} card      выделенная карта
* @param  {Phaser.Pointer} pointer курсор
* @param  {boolean} [forced]  заставляет поле выделить карту, даже если она не находится в пределах поля
* или поле не выделяет карты при наведении
*/
Field.prototype.focusOnCard = function(card, pointer, forced){
	if(!card || !~this.cards.indexOf(card) || !forced && (!this.focusable || !this.cardIsInside(card)))
		return;

	this.focusedCard = card;
	if(!this.uninteractibleTimer || forced){
		this.placeCards(null, BRING_TO_TOP_ON.INIT);
	}
};

/**
* Убирает выделение карты.
* @param  {Card} card   выделенная карта
* @param  {boolean} [forced] заставляет поле убрать выделение карты, даже если поле не стало бы этого делать
*/
Field.prototype.focusOffCard = function(card, forced){
	if(
		!card ||
		!~this.cards.indexOf(card) ||
		!this.focusedCard ||
		!forced && (
			!this.focusable ||
			!this.cardIsInside(this.focusedCard, false) ||
			card != this.focusedCard ||
			~this.cards.indexOf(cardControl.card)
		)
	)
		return;

	this.focusedCard = null;
	if(!this.uninteractibleTimer || forced)
		this.placeCards(null, BRING_TO_TOP_ON.INIT);
};
