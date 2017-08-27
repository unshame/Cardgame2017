/** 
* Создает меню.
*/
UI.prototype._createMenus = function(){
	var renderer = options.get('system_renderer');
	var rendererText = (renderer === Phaser.WEBGL ? 'Canvas' : 'WebGL');
	return {

		// ГЛАВНОЕ МЕНЮ
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
			alpha: 0.8,
			textColor: 'white',
			//header: 'Main Menu',
			//headerColor: 'red',
			layout: [
				{
					action: function(){
						game.state.change('queue');
						connection.proxy.quickQueueUpClient();
					},
					name: 'quickGame',
					text: 'Quick Game'
				},
				{
					action: function(){},
					name: 'custom',
					text: 'Create Game'
				},
				{
					action: function(){},
					name: 'join',
					text: 'Join Game'
				},
				{
					action: function(){
						ui.modalManager.openModal('options');
					},
					name: 'options',
					text: 'Options'
				},
				{
					action: function(){
						game.state.change('credits');
					},
					name: 'credits',
					text: 'Credits'
				}
			]
		}),


		// ОПЦИИ
		options: new Menu({
			position: function(){
				return {
					x:game.screenWidth/2,
					y:game.screenHeight/2
				};
			}, 
			z: -4,
			base: true,
			color: 'grey',
			elementColor: 'grey',
			textColor: 'black',
			name: 'menu_options',
			header: 'Options',
			closeButton: function(){
				ui.modalManager.closeModal();
			},
			layout: [
				Menu.buttonPopup({
					action: function(){
						connection.server.concede();
						ui.modalManager.closeModal();
					}, 
					name: 'concede',
					text: 'Concede',
					mobileClickProtect: true,
					hoverText: 'Leave current game.\n You will be replaced by a bot (how shameful).'
				}),
				{
					action: function(button, pointer){
						ui.background.nextTexture();
					},
					name: 'background',
					text: 'Change Background',
					fontSize: 20
				},
				{
					action: function(button, pointer){
						if(pointer.isMouse && pointer.button !== 0){
							skinManager.setSkin('uno');
						}
						else if(skinManager.skin.name == 'modern'){
							skinManager.setSkin('classic');
						}
						else{
							skinManager.setSkin('modern');
						}

					},
					name: 'change_skin',
					text: 'Change skin'
				},
				Menu.buttonPopup({
					action: function(){
						options.set('system_renderer', renderer === Phaser.WEBGL ? Phaser.CANVAS : Phaser.WEBGL);
						options.save();
						location.href = location.href;
					}, 
					name: 'renderer',
					text: rendererText,
					hoverText: 'Change renderer to ' + rendererText + '. WebGL runs much better on mobile devices.'
				}),
				Menu.buttonPopup({	
					action: function(){
						options.restoreAllDefaults();
						options.save();
						location.href = location.href;
					}, 
					name: 'restore',
					text: 'Restore',
					hoverText: 'Get rid of all saved data (including your session id!).'
				}),
				{
					action: function(){
						ui.modalManager.openModal('debug');
					},
					name: 'debug',
					text: 'Debug'
				}
			]
		}),

		
		// КОНЕЦ ИГРЫ
		endGame: new Menu({
			position: function(){
				return {
					x:game.screenWidth/2,
					y:game.screenHeight/2 + 200
				};
			}, 
			z: -6,
			color: 'orange',
			elementColor: 'red',
			textColor: 'white',
			name: 'menu_endGame',
			header: 'Another one?',
			headerColor: 'red',
			layout: [[
				{
					action: function(){
						connection.proxy.recieveCompleteAction({type: 'ACCEPT'});
						this.fadeOut();
					}, 
					name: 'rematch',
					text: 'Yes'
				},
				{
					action: function(){
						connection.proxy.recieveCompleteAction({type: 'DECLINE'});
						this.fadeOut();
					},
					name: 'quit_game',
					text: 'No'
				}
			]]
		}),

		
		// ОЧЕРЕДЬ
		queue: new Menu({
			position: function(){
				return {
					x:game.screenWidth/2,
					y:game.screenHeight/2
				};
			}, 
			z: -6,
			color: 'orange',
			elementColor: 'red',
			textColor: 'white',
			name: 'menu_queue',
			header: 'Queue Options',
			headerColor: 'red',
			layout: [
				Menu.buttonPopup({
					action: function(){},
					fontSize: 24,
					name: 'invite',
					text: 'Copy Invite Link',
					hoverText: 'Share this link with anybody to invite them to join you.'
				}),
				Menu.buttonPopup({
					action: function(){
						connection.proxy.startQueuedGameVsBots()
					},
					name: 'vs_bots',
					text: 'Play VS Bots',
					hoverText: 'Play versus bots if we can\'t find real people to play against you.'
				}),
				{
					action: function(){
						connection.server.concede();
					},
					name: 'leave_queue',
					text: 'Leave Queue'
				}
			]
		}),

		
		// ДЕБАГ
		debug: new Menu({
			position: function(){
				return {
					x:game.screenWidth/2,
					y:game.screenHeight/2
				};
			}, 
			z: -4,
			color: 'grey',
			elementColor: 'grey',
			textColor: 'black',
			name: 'menu_debug',
			header: 'Debug',
			closeButton: function(){
				ui.modalManager.closeModal();
			},			
			layout: [
				{
					action: function(){
						game.toggleAllDebugModes();
					},
					name: 'all',
					text: 'All',
					size: 'big',
					fontSize: 60,
					color: 'orange',
					textColor: 'white'
				},
				[
					{
						action: function(){
							game.toggleDebugMode();
						},
						name: 'game',
						text: 'Game: ' + (game.inDebugMode ? 'on' : 'off')
					},
					{
						action: function(){
							connection.toggleDebugMode();
						},
						name: 'connection',
						text: 'Connection: ' + (connection.inDebugMode ? 'on' : 'off')
					}
				],
				[
					{
						action: function(){
							game.scale.toggleDebugMode();
						},
						name: 'grid',
						text: 'Grid: ' + (game.scale.inDebugMode ? 'on' : 'off')
					},
					{
						action: function(){
							cardControl.toggleDebugMode();
						},
						name: 'control',
						text: 'Control: ' + (cardControl.inDebugMode ? 'on' : 'off')
					}
				],
				[
					{
						action: function(){
							fieldManager.toggleDebugMode();
						},
						name: 'fields',
						text: 'Fields: ' + (fieldManager.inDebugMode ? 'on' : 'off')
					},
					{
						action: function(){
							cardManager.toggleDebugMode();
						},
						name: 'cards',
						text: 'Cards: ' + (cardManager.inDebugMode ? 'on' : 'off')
					}
				]
			]
		})
	};
};