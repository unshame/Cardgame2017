//Для google we fonts
window.WebFontConfig = {

    active: function() { game.time.events.add(Phaser.Timer.SECOND, game.loadButtonText.bind(game), this); },

    google: {
      families: ['Exo']
    }

};