/** 
* Для Google WebFont Loader
* @namespace WebFontConfig
* @see  {@link WebFont}
*/
window.WebFontConfig = {
	/**
	* Функция, выполняемая сразу после загрузки шрифтов
	* @memberOf WebFontConfig
	* @type {function}
	*/
    active: function() {
    	game.time.events.add(Phaser.Timer.SECOND, ui.layers.loadLabels.bind(ui.layers), this);
    },

    /**
    * Объект, содержащий список google web шрифтов
    * @memberOf WebFontConfig
    * @type {object}
    */
    google: {
      families: ['Exo']
    }

    
};