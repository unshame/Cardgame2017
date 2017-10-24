/** 
* Создает меню.
*/
UI.prototype._createMenus = function(){
	
	var text = 'В игре используется колода из 36 карт,\n\
но можно использовать и колоду на 52 карты,\n\
в игре участвуют от двух до шести игроков;\n\
Старшинство карт в колоде из 52 карт:\n\
2, 3, 4, 5, 6, 7, 8, 9, 10, В, Д, К, Т.\n\
Старшинство мастей для игры в дурака не определено.\n\
Каждому раздаётся по 6 карт, следующая\n\
(или последняя, возможно и любая из колоды)\n\
карта открывается и её масть устанавливает\n\
козырь для данной игры,\n\
и остальная колода кладётся сверху так,\n\
чтобы козырная карта была всем видна.\n\
Цель игры — избавиться от всех карт.\n\
Последний игрок, не избавившийся от карт, остаётся в «дураках».\n\
Запрещается забирать карты, которые отбили.\n\
Отбитые карты идут в отбой (биту).';

	var menus = {

		// ГЛАВНОЕ МЕНЮ
		main: new Menu({
			position: function(width, height){
				return {
					x:game.screenWidth/2,
					y:game.screenHeight/2 + width/2 + 75
				};
			}, 
			z: 6,
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
					action: function(){
						ui.menus.main.fadeOut();
						ui.logo.fadeOut();
						ui.menus.creator.fadeIn();
					},
					name: 'custom',
					text: 'Create Game'
				},
				{
					action: function(){
						ui.menus.main.fadeOut();
						ui.logo.fadeOut();
						ui.menus.browser.fadeIn();
					},
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
			color: 'grey',
			elementColor: 'grey',
			textColor: 'black',
			name: 'menu_options',
			header: 'Options',
			modal: true,
			closeButton: function(){
				ui.modalManager.closeModal();
			},
			closeButtonCrossColor: 'grey',
			layout: [
				Menu.buttonPopup({
					action: function(){
						connection.server.concede();
						ui.modalManager.closeModal();
					}, 
					name: 'concede',
					text: 'Concede',
					mobileClickProtect: true,
					hoverText: 'Leave current game\n You will be replaced with a bot'
				}),
				Menu.alignAlternate(
					Menu.text({
						text: 'Skin'
					}),
					Menu.stepper({
						action: function(key){
							skinManager.setSkin(key);
						},
						choices: skinManager.getSkinNames(),
						name: 'skin',
						textColor: 'black',
						startKey: gameOptions.get('appearance_skin'),
						minWidth: 150
					})
				),
				Menu.alignAlternate(
					Menu.text({
						text: 'Cardback'
					}),
					Menu.stepper({
						action: function(key){
							skinManager.setCardback(Number(key));
						},
						choices: skinManager.getCardbacks(),
						name: 'cardback',
						textColor: 'black',
						startKey: skinManager.getCurrentCardbackIndex(),
						minWidth: 150
					})
				),
				Menu.alignAlternate(
					Menu.text({
						text: 'Background'
					}),
					Menu.stepper({
						action: function(key){
							ui.background.setTexture(key);
						},
						choices: ui.background.namedTextures,
						name: 'background',
						textColor: 'black',
						startKey: gameOptions.get('appearance_background'),
						minWidth: 150
					})
				),
				[
					{
						action: function(){
							ui.modalManager.openModal('rules');
						},
						name: 'rules',
						text: 'Rules',
					},
					{
						action: function(){
							ui.modalManager.openModal('more_options');
						},
						name: 'more_options',
						text: 'More Options',
					},
					/*{
						action: function(){
							ui.modalManager.openModal('debug');
						},
						name: 'debug',
						text: 'Debug'
					}*/
				]
			]
		}),
		
		// ПРАВИЛА
		rules: new Menu({
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
			name: 'menu_rules',
			header: 'Rules',
			modal: true,
			closeButton: function(){
				ui.modalManager.closeModal();
			},
			closeButtonCrossColor: 'grey',
			layout: [
				Menu.text({
					name: 'rules',
					text: text					
				})

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
			modal: true,
			closeButton: function(){
				ui.modalManager.closeModal();
			},			
			closeButtonCrossColor: 'grey',
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

	menus.options.hideElement('concede');

	menus.browser = new LobbyBrowser();
	menus.creator = new LobbyCreator();
	menus.queue = new LobbyMenu();
	menus.more_options = new OptionsMenu();
	menus.name = new NamePicker();

	return menus;
};