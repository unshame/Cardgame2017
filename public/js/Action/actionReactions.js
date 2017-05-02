/**
 * Действия, выполняемые в ответ на действия сервера  
 * Выполняются в контексте {@link ActionHandler}
 * @namespace actionReactions
 */
window.actionReactions = {
	
	/**
	 * Наименьшии козырные карты у каждого игрока и наименьшая козырная карта из них
	 * @param {object} action - Обрабатываемое действие
	 * @param {object[]} action.cards - Информация о козырных картах
	 * @param {string} action.cards[].cid - id карты
	 * @param {string} action.cards[].pid - id игрока
	 * @param {number} action.cards[].suit - масть карты
	 * @param {number} action.cards[].value - значение карты
	 * @param {string} action.pid - id игрока с наименьшим козырем
	 * @return {number} Время выполнения действия
	 * @memberof actionReactions
	 */
	TRUMP_CARDS: function(action){
		var delay = 0, card;
		if(!action.cards || !action.cards.length)
			return 0;

		delay = 3000/game.speed;

		//Показываем козырные карты
		for(var ci = 0; ci < action.cards.length; ci++){
			var c = action.cards[ci];
			card = game.cards[c.cid];

			if(action.pid != c.pid)
				fieldManager.fields[c.pid].setHighlight(true, game.colors.red);

			card.raised = true;

			if(card.field.id != playerManager.pid){	
				card.presetValue(c.suit, c.value);	
			}
			card.field.placeCards(null, 'init', true);
		}		

		//Выделяем поле игрока с наибольшим козырем
		fieldManager.fields[action.pid].setHighlight(true, game.colors.green);

		//Прячем козырные карты
		function hideTrumpCards(){
			var cards = this.action.cards;			
			for(var ci = 0; ci < cards.length; ci++){
				var c = cards[ci];
				card = game.cards[c.cid];	

				fieldManager.fields[c.pid].setHighlight(false);		

				card.raised = false;

				if(card.field.id != playerManager.pid){					
					card.presetValue(null, null);
				}
				card.field.placeCards(null, 'init', true);
			}			
		}
		this.setTimedAction(hideTrumpCards, this, delay);

		delay += 500;
		return delay;
	},

	/**
	 * Карты, присутствующие в игре
	 * @param {object} action - Обрабатываемое действие
	 * @param {object[]} action.cards - Информация о картах
	 * @param {string} action.cards[].cid - id карты
	 * @param {string} action.cards[].field - id поля карты
	 * @param {number} [action.cards[].suit] - масть карты
	 * @param {number} [action.cards[].value] - значение карты
	 * @param {number} [action.numDiscarded] - Количество карт в стопке сброса
	 * @param {number} [action.trumpSuit] - Масть козырных карт
	 * @return {number} Время до начала добавления последней карты
	 * @memberof actionReactions
	 */
	CARDS: function(action){

		fieldManager.resetFields();
		cardControl.reset();
		cardManager.reset();
		cardManager.createCards(action.cards);

		var delay = fieldManager.queueCards(action.cards);
		fieldManager.removeMarkedCards();
		fieldManager.placeQueuedCards();
		if(action.numDiscarded){
			var discardCards = [];
			for (var i = 0; i < action.numDiscarded; i++) {
				var id = 'discarded_'+i;
				var options = {
					id: id
				};
				cardManager.addCard(options);
				discardCards.push(game.cards[id]);
			}
			fieldManager.fields.DISCARD_PILE.addCards(discardCards);
		}
		return delay;
	},

	/**
	 * Раздача карт
	 * @param {object} action - Обрабатываемое действие
	 * @param {object[]} action.cards - Информация о картах
	 * @param {string} action.cards[].cid - id карты
	 * @param {string} action.cards[].pid - id игрока, который получает карту
	 * @param {number} [action.cards[].suit] - масть карты
	 * @param {number} [action.cards[].value] - значение карты
	 * @return {number} Время до начала добавления последней карты
	 * @memberof actionReactions
	 */
	DRAW: function(action){
		var delay = fieldManager.queueCards(action.cards);
		fieldManager.removeMarkedCards();
		fieldManager.placeQueuedCards();
		return delay;
	},

	/**
	 * Игрок либо хочет взять, либо уже берет карты, зависит от присутствия action.cards
	 * @param {object} action - Обрабатываемое действие
	 * @param {object[]} [action.cards] - Информация о картах
	 * @param {string} action.cards[].cid - id карты
	 * @param {number} [action.cards[].suit] - масть карты
	 * @param {number} [action.cards[].value] - значение карты
	 * @param {string} action.pid - id берущего игрока	 
	 * @return {number} Время выполнения действия
	 * @memberof actionReactions
	 */
	TAKE: function(action){
		var delay = 0;
		if(!action.cards)
			return delay;
		var cards = [];
		for(var i = 0; i < action.cards.length; i++){
			cards.push({
				cid: action.cards[i].cid,
				suit: action.cards[i].suit,
				value: action.cards[i].value
			});
		}
		var field = fieldManager.fields[action.pid];
		delay = fieldManager.moveCards(field, cards, true);
		return delay;
	},

	/**
	 * Игрок защищается
	 * @param {object} action - Обрабатываемое действие
	 * @param {string} action.cid - id карты
	 * @param {string} action.pid - id игрока
	 * @param {string} action.field - id поля
	 * @param {number} action.suit - масть карты
	 * @param {number} action.value - значение карты
	 * @return {number} Время выполнения действия
	 * @memberof actionReactions
	 */
	DEFENSE: function(action){
		var delay = 0;
		var card = {
			cid: action.cid,
			suit: action.suit,
			value: action.value
		};
		var field = fieldManager.fields[action.field];
		delay = fieldManager.moveCards(field, [card]);
		return delay || field.moveTime;
	},

	/**
	 * Карты перемещаются в стопку сброса
	 * @param {object} action - Обрабатываемое действие
	 * @param {string[]} action.ids - массив id перемещаемых карт
	 * @return {number} Время выполнения действия
	 * @memberof actionReactions
	 */
	DISCARD: function(action){
		var delay = 0;
		var cards = [];
		for(var i = 0; i < action.ids.length; i++){
			cards.push({
				cid: action.ids[i],
				suit: null,
				value: 0
			});
		}
		var field = fieldManager.fields.DISCARD_PILE;
		delay = fieldManager.moveCards(field, cards);
		return delay;
	},

	/**
	 * Игрок пропускает ход
	 * @param {object} action - Обрабатываемое действие
	 * @param {string} action.pid - id игрока
	 * @return {number} Время выполнения действия
	 * @memberof actionReactions
	 */
	SKIP: function(action){
		return 0;
	}
};

/*jshint undef:false*/

/**
 * Игрок атакует
 * @method  ATTACK
 * @param {object} action - Обрабатываемое действие
 * @param {string} action.cid - id карты
 * @param {string} action.pid - id игрока
 * @param {string} action.field - id поля
 * @param {number} action.suit - масть карты
 * @param {number} action.value - значение карты
 * @return {number} Время выполнения действия
 * @memberof actionReactions
 */
actionReactions['ATTACK'] = actionReactions['DEFENSE'];