/** 
* Создает меню.
*/
UI.prototype._createMenus = function(){
	var renderer = options.get('system_renderer');
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
				{
					action: function(){
						connection.server.disconnect();
						ui.modalManager.closeModal();
					}, 
					name: 'disconnect',
					text: 'Disconnect',
					mobileClickProtect: true
				},
				{
					action: function(button, pointer){
						ui.background.nextTexture();
					},
					name: 'background',
					text: 'Background'
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
				{
					action: function(){
						options.set('system_renderer', renderer === Phaser.WEBGL ? Phaser.CANVAS : Phaser.WEBGL);
						options.save();
						location.href = location.href;
					}, 
					name: 'renderer',
					text: (renderer === Phaser.WEBGL ? 'Canvas' : 'WebGL')
				},
				{	
					action: function(){
						options.restoreAllDefaults();
						options.save();
						location.href = location.href;
					}, 
					name: 'restore',
					text: 'Restore'
				},
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
					text: 'Rematch'
				},
				{
					action: function(){
						connection.proxy.recieveCompleteAction({type: 'DECLINE'});
						this.fadeOut();
					},
					name: 'quit_game',
					text: 'Quit'
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
				{
					action: function(){},
					fontSize: 24,
					name: 'invite',
					text: 'Copy Invite Link'
				},
				{
					action: function(){
						connection.proxy.quickQueueUpClientVsBots()
					},
					name: 'vs_bots',
					text: 'Play VS Bots'
				},
				{
					action: function(){
						connection.server.disconnect();
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
						text: 'Game'
					},
					{
						action: function(){
							connection.inDebugMode = !connection.inDebugMode;
						},
						name: 'connection',
						text: 'Connection'
					}
				],
				[
					{
						action: function(){
							game.scale.toggleDebugMode();
						},
						name: 'grid',
						text: 'Grid'
					},
					{
						action: function(){
							cardControl.toggleDebugMode();
						},
						name: 'ctrl',
						text: 'Control'
					}
				],
				[
					{
						action: function(){
							fieldManager.toggleDebugMode();
						},
						name: 'fields',
						text: 'Fields'
					},
					{
						action: function(){
							cardManager.toggleDebugMode();
						},
						name: 'cards',
						text: 'Cards'
					}
				]
			]
		})
	};
};