// ДЕЙСТВИЯ НАД КАРТОЙ

/**
* Поднимает карту.
* @param {Card}           card    карта
* @param {Phaser.Pointer} pointer указатель, нажавший на карту
*/
CardControl.prototype.cardPickup = function(card, pointer){
	if(!card){
		console.warn('Card control: cardPickup called but no Card assigned.');
		return;
	}

	this.pickNotifier.choose(card);

	this.card = card;
	this.pointer = pointer;
	
	if(!this._cardPointerInbound() && !cardManager.physicsEnabled || (this.pointer.isMouse && !this.pointer.leftButton.isDown)){
		this.reset('clicked out of bounds or wrong mouse button');
		return;
	}

	if(this.inDebugMode){
		console.log('Card control: Picked up', this.card.id);
	}

	if(this._inertiaHistory.length){
		this._inertiaHistory = [];
	}
	this.cardLastX = this.card.x + this.card.sprite.x;
	this.cardLastY = this.card.y + this.card.sprite.y;

	this._setCardClickTimer();
	this._trailShouldReappend = true;

	this.card.setAngle(0);
	this._cardSetPathToCursor();
	cardManager.bringCardToTop(this.card, false);

	actionHandler.highlightPossibleActions();
};

/**
* Устанавливает путь и время смещения карты к курсору.
* @private
*/
CardControl.prototype._cardSetPathToCursor = function(){

	if(this.card.mover){
		this.card.mover.stop();
		this.card.mover = null;
	}
	this.cardShiftPosition = {
		x: this.pointer.x - this.card.x - this.card.sprite.x,
		y: this.pointer.y - this.card.y - this.card.sprite.y
	};
	this.cardShiftEndTime = Date.now() + (this.cardShiftDuration/game.speed);
};

/** Кладет карту обратно на поле, на новое поле или бросает ее. */
CardControl.prototype.cardPutDown = function(){

	if(!this.card){
		console.warn('Card control: cardPutDown called but no Card assigned.');
		return;
	}

	if(this.inDebugMode){
		console.log('Card control: Putting down', this.card.id);
	}

	var fields = this._cardOnValidField();

	// У карты включена физика, бросаем ее
	if(cardManager.physicsEnabled && this.card.sprite.body){
		this.cardThrow();
	}
	// Карта находится над валидным полем, перемещаем ее
	else if(fields && !this.pointer.rightButton.isDown){
		this.cardMoveToField(fields);
	}
	// Возвращаем карту на свое поле\базу
	else{
		this.cardReturn();
	}
};

/**
* Перемещает карту в новое поле.
* @param {Field[]} fields Поля, над котором находится карта.
*/
CardControl.prototype.cardMoveToField = function(fields){

	if(!this.card){
		console.warn('Card control: cardMoveToField called but no Card assigned.');
		return;
	}

	var field, 
		success = false;
	for(var i = 0; i < fields.length; i++){
		field = fields[i];
		success = connection.server.sendAction(field, this.card);
		if(success){
			break;
		}
	}

	if(!success){
		this.cardReturn();
		return;
	}

	this.pickNotifier.reject(this.card);

	this._setTrailResetTimer();

	var card = this.card;
	this.card = null;
	this.pointer = null;
	if(field.linkedField){
		if(!field.icon && !field.cards.length){
			fieldManager.swapFields(field, field.linkedField);

		}
		field = field.linkedField;
	}

	fieldManager.moveCards(field, [{
		cid: card.id,
		suit: card.suit,
		value: card.value
	}], BRING_TO_TOP_ON.START, true);

	actionHandler.highlightPossibleActions();
};

/** Возвращает карту на ее поле. */
CardControl.prototype.cardReturn = function(){

	if(!this.card){
		console.warn('Card control: cardReturn called but no Card assigned.');
		return;
	}

	if(cardManager.physicsEnabled && this.card.sprite.body){
		this.cardThrow();
		return;
	}

	if(this.inDebugMode){
		console.log('Card control: Returning', this.card.id, 'to base');
	}

	this.pickNotifier.reject(this.card);

	this._setTrailResetTimer();

	if(this._inertiaHistory.length){
		this._inertiaHistory = [];
	}

	var card = this.card;
	var stillInbound = this._cardPointerInbound();

	this.card = null;
	this.pointer = null;

	if(card.raised){
		card.raised = false;
	}

	if(card.field){
		if(!stillInbound){
			card.field.focusedCard = null;
		}
		card.field.placeCards([card], BRING_TO_TOP_ON.END_ALL, true);
	}
	else{
		card.returnToBase(this.cardReturnTime, 0);
	}

	actionHandler.highlightPossibleActions();
};

/** Кидает карту. */
CardControl.prototype.cardThrow = function(){
	var	dx = 0,
		dy = 0, 
		counted = 0;

	// Находим среднюю скорость перемещения карты
	this._saveCardInertia(Date.now(), 100);
	for(var i = 0; i < this._inertiaHistory.length; i++){
		counted++;
		dx += this._inertiaHistory[i][1];
		dy += this._inertiaHistory[i][2];
	}
	dx /= counted;
	dy /= counted;

	var velMult = 40,	// Множитель для скорости передвижения
		angMult = 10,	// Множитель для скорости поворота
		card = this.card;

	this.card = null;
	this.pointer = null;

	// Устанавливаем свойства тела карты
	card.sprite.body.collideWorldBounds = true;
	card.sprite.body.velocity = {
		x: dx*velMult,
		y: dy*velMult
	};
	card.sprite.body.drag = {
		x: Math.abs(dx*velMult),
		y: Math.abs(dy*velMult)
	};
	card.sprite.body.angularVelocity = dx*angMult;
	card.sprite.body.angularDrag = Math.abs(dx*angMult);

	card.setScale(1);
	card.setDraggability(false);

	this._inertiaHistory = [];
	this._setTrailResetTimer();

	card.destroy(1000);
};

// ТАЙМЕР НАЖАТИЯ

/**
* Запускает таймер клика по карте.
* @private
*/
CardControl.prototype._setCardClickTimer = function(){
	this._resetCardClickTimer();
	this.cardClickTimer = setTimeout(this._resetCardClickTimer.bind(this), this.cardClickMaxDelay);
};

/**
* Обнуляет таймер клика по карте
* @private
*/
CardControl.prototype._resetCardClickTimer = function(){
	if(this.cardClickTimer){
		clearTimeout(this.cardClickTimer);
		this.cardClickTimer = null;
	}
};