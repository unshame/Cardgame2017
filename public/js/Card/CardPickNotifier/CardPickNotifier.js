/**
* Получает информацию от карт и сообщает серверу о картах,
* которые выбирает игрок.
*/
var CardPickNotifier = function(){

	/**
	* Выбранная карта.
	* @type {Card}
	*/
	this.card = null;

	/**
	* Таймаут задержки.
	* @type {number}
	*/
	this.delay = null;

	/**
	* Время до отправки серверу информации о том, над какой картой игрок держит курсор.
	* @type {Number}
	*/
	this.considerDelay = 300;
};

CardPickNotifier.prototype = {

	/**
	* Запускает таймер до оповещения сервера о выбранной карте.
	* @param  {Card} card
	*/
	consider: function(card){
		this.resetDelay();
		this.delay = setTimeout(this.choose.bind(this, card), this.considerDelay);

	},

	/**
	* Сообщает серверу о том, что игрок убрал курсор с карты.
	* @param  {Card} card
	*/
	reject: function(card){
		if(this.card){
			connection.proxy.hoverOutCard(this.card.id);
			this.card = null;
		}
		this.resetDelay();
	},

	/**
	* Сообщает серверу, что игрок выбрал карту.
	* @param  {Card} card
	*/
	choose: function(card){
		this.resetDelay();
		if(card != this.card){
			this.card = card;
			connection.proxy.hoverOverCard(card.id);
			if(game.inDebugMode){
				console.log('Hover notifier: chose card', card.id, card);
			}
		}
	},

	/**
	* Отменяет задержанное оповещение сервера.
	*/
	resetDelay: function(){
		if(this.delay){
			clearTimeout(this.delay);
			this.delay = null;
		}
	}
};
