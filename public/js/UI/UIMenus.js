/** 
* Создает меню.
*/
UI.prototype._createMenus = function(){
	this.menus = {
		main: new Menu({
			position: function(width, height){
				return {
					x:game.screenWidth/2,
					y:game.screenHeight/2 + width/2 + 75
				};
			}, 
			z: 5,
			name: 'menu_main',
			color: 'orange',
			elementColor: 'red',
			textColor: 'white'
		}),
		options: new Menu({
			position: function(){
				return {
					x:game.screenWidth/2,
					y:game.screenHeight/2
				};
			}, 
			z: -3,
			base: true,
			color: 'grey',
			elementColor: 'grey',
			textColor: 'black',
			name: 'menu_options'
		}),
		debug: new Menu({
			position: function(){
				return {
					x:game.screenWidth/2,
					y:game.screenHeight/2
				};
			}, 
			z: -3,
			color: 'grey',
			elementColor: 'grey',
			textColor: 'black',
			name: 'menu_debug'
		}),
		endGame: new Menu({
			position: function(){
				return {
					x:game.screenWidth/2,
					y:game.screenHeight/2 + 200
				};
			}, 
			z: -5,
			color: 'orange',
			elementColor: 'red',
			textColor: 'white',
			name: 'menu_endGame'
		}),
		queue: new Menu({
			position: function(){
				return {
					x:game.screenWidth/2,
					y:game.screenHeight/2
				};
			}, 
			z: -5,
			color: 'orange',
			elementColor: 'red',
			textColor: 'white',
			name: 'menu_queue'
		})
	};
	this.modalManager.makeModal([
		this.menus.options,
		this.menus.debug
	]);
};