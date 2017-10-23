/** 
* Создает меню.
*/
UI.prototype._createMenus = function(){
	var renderer = gameOptions.get('system_renderer');
	if(renderer == Phaser.AUTO){
		renderer = game.renderType;
		gameOptions.set('system_renderer', renderer);
	}
	var nameMaxLength = 8;
	var optionsStepperWidth = 100;
	var optionsTextWidth = 150;
	return {

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
					hoverText: 'Leave current game.\n You will be replaced with a bot.'
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

		// БОЛЬШЕ ОПЦИЙ
		more_options: new Menu({
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
			name: 'menu_more_options',
			header: 'Options',
			closeButton: function(){
				ui.modalManager.closeModal();
			},
			closeButtonCrossColor: 'grey',
			layout: [
				Menu.alignLeft(
					Menu.text({
						text: 'Render mode',
						fixedWidth: optionsTextWidth
					}),
					Menu.stepper({
						action: function(key){
							gameOptions.set('system_renderer', key);
						},
						choices: [
							[0, 'Detect'],
							[2, 'WebGL'],
							[1, 'Canvas']
						],
						name: 'renderer',
						textColor: 'black',
						startKey: renderer,
						minWidth: optionsStepperWidth
					}),
					Menu.checkbox({
						actionEnable: function(){
							gameOptions.set('ui_vignette', true);
							ui.background.vignette.visible = true;
						},
						actionDisable: function(){
							gameOptions.set('ui_vignette', false);
							ui.background.vignette.visible = false;
						},
						text: 'Enable vignette',
						name: 'vignette',
						checked: gameOptions.get('ui_vignette'),
						hoverText: '',
						hoverPlacement: 'right'
					})
				),
				Menu.alignLeft(
					Menu.text({
						text: 'Game speed',
						fixedWidth: optionsTextWidth
					}),
					Menu.stepper({
						action: function(key){
							gameOptions.set('game_speed', key);		
							game.speed = key;			
						},
						choices: [
							[0.75, '0.75'],
							[0.80, '0.80'],
							[0.85, '0.85'],
							[0.90, '0.90'],
							[0.95, '0.95'],
							[1, '1'],
							[1.05, '1.05'],
							[1.10, '1.10'],
							[1.15, '1.15'],
							[1.20, '1.20'],
							[1.25, '1.25']
						],
						name: 'speed',
						textColor: 'black',
						startKey: gameOptions.get('game_speed'),
						minWidth: optionsStepperWidth
					}),
					Menu.checkbox({
						actionEnable: function(){
							gameOptions.set('ui_glow', false);
							actionHandler.highlightPossibleActions();
						},
						actionDisable: function(){
							gameOptions.set('ui_glow', true);
							actionHandler.highlightPossibleActions();
						},
						text: 'Hard mode',
						name: 'hard_mode',
						checked: !gameOptions.get('ui_glow'),
						hoverText: 'Disables card and table highlights',
						hoverPlacement: 'right'
					})
				),
				Menu.alignLeft(
					Menu.text({
						text: 'Game scale',
						fixedWidth: optionsTextWidth
					}),
					Menu.stepper({
						action: function(key){
							gameOptions.set('game_scale', key);		
							game.scale.scaleMultiplier = key;
							game.updateCoordinates();	
						},
						choices: [
							[0.5, '0.5'],
							[0.6, '0.6'],
							[0.7, '0.7'],
							[0.8, '0.8'],
							[0.9, '0.9'],
							[1, '1'],
							[1.1, '1.1'],
							[1.2, '1.2'],
							[1.3, '1.3'],
							[1.4, '1.4'],
							[1.5, '1.5']
						],
						name: 'scale',
						textColor: 'black',
						startKey: gameOptions.get('game_scale'),
						minWidth: optionsStepperWidth
					}),

				),
				Menu.alignLeft({	
					action: function(){
						ui.modalManager.openModal('name');
					}, 
					name: 'name',
					text: 'Change Name'
				}),
				Menu.alignJustify(
					Menu.buttonPopup({	
						action: function(){
							gameOptions.restoreGroup('system');
							gameOptions.restoreGroup('ui');
							gameOptions.restoreGroup('game');
							game.applyOptions(this);
							ui.feed.newMessage('Options restored', 2000);
						}, 
						name: 'restore',
						text: 'Restore',
						hoverText: 'Undo all changes',
						hoverPlacement: 'bottom'
					}),
					Menu.buttonPopup({	
						action: function(){
							game.applyOptions(this);
							ui.feed.newMessage('Options saved', 2000);
						}, 
						name: 'save',
						text: 'Save',
						color: 'orange',
						textColor: 'white',
						hoverText: 'Save all changes',
						hoverPlacement: 'bottom'
					}),
					Menu.buttonPopup({	
						action: function(){
							gameOptions.restoreGroupDefaults('system');
							gameOptions.restoreGroupDefaults('ui');
							gameOptions.restoreGroupDefaults('game');
							game.applyOptions(this);
							ui.feed.newMessage('Options reset to default', 2000);
						}, 
						name: 'reset',
						text: 'Reset',
						hoverText: 'Reset all options to default values',
						hoverPlacement: 'bottom'
					})
				)
			]
		}),

		apply_renderer: new Menu({
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
			name: 'menu_apply_renderer',
			header: 'Apply Renderer',
			closeButton: function(){
				ui.modalManager.closeModal();
			},
			closeButtonCrossColor: 'grey',
			layout: [
				Menu.text({
					text: 'Render mode requires the page to be reloaded to take effect.\nReload the page now?'
				}),
				[
					{
						action: function(){
							location.reload();
						}, 
						name: 'yes',
						text: 'Yes'
					},
					{
						action: function(){
							ui.modalManager.closeModal();
						},
						name: 'no',
						text: 'No'
					}
				]
			]
		}),

		// ВВОД ИМЕНИ
		name: new Menu({
			position: function(){
				return {
					x: game.screenWidth/2,
					y: Phaser.Device.desktop ? game.screenHeight/2 : game.screenHeight/3
				};
			}, 
			z: -4,
			color: 'grey',
			elementColor: 'grey',
			textColor: 'black',
			name: 'menu_name',
			header: 'Enter Name',
			closeButton: function(){
				ui.modalManager.closeModal();
			},
			closeButtonCrossColor: 'grey',
			layout: [[
				Menu.inputField({
					name: 'name',
					placeHolder: 'Player1',
					maxChars: nameMaxLength
				}),
				{
					text: 'Change Name',
					name: 'change',
					color: 'orange',
					textColor: 'white',
					action: function(){
						var name = this.getElementByName('name').getText();
						var oldName = gameOptions.get('profile_name');
						if(oldName && oldName == name){
							ui.feed.newMessage('Please enter a different name', 3000);
						}
						else if(name.length > 0 && name.length <= nameMaxLength){
							this.disableElement('change');
							connection.proxy.changeClientName(name);
						}
						else{
							ui.feed.newMessage(name.length > 0 ? 'Name is too long (' + nameMaxLength + ' characters max)' : 'Please enter name', 3000);
						}
					}
				}
			]]
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
			closeButton: function(){
				ui.modalManager.closeModal();
			},
			closeButtonCrossColor: 'grey',
			layout: [
				Menu.text({
					name: 'rules',
text:'В игре используется колода из 36 карт,\n\
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
Отбитые карты идут в отбой (биту).'					
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
					action: function(){
						var field = document.getElementById('queue_id');
						field.style.display = 'block';
						field.select();
						var success = document.execCommand('copy');
						if(document.activeElement){
							document.activeElement.blur();
						}
						field.style.display = 'none';
						ui.feed.newMessage(success ? 'Link copied' : 'Please copy the link manually from the adress bar', success ? 2000 : 5000);
					},
					fontSize: 24,
					name: 'invite',
					text: 'Copy Invite Link',
					hoverText: 'Share this link with somebody to invite them to join your game.'
				}),
				Menu.buttonPopup({
					action: function(){
						connection.proxy.voteForPrematureStart();
						this.disableElement('vs_bots');
					},
					name: 'vs_bots',
					text: 'Play VS Bots',
					hoverText: 'Play versus bots if we can\'t find enough real people to pitch against you.'
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
};