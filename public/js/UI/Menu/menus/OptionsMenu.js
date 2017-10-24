var OptionsMenu = function(options){

	this.options = mergeOptions(this.getDefaultMenuOptions(), options);

	var optionsStepperWidth = 100;
	var optionsTextWidth = 150;

	var renderer = gameOptions.get('system_renderer');
	if(renderer == Phaser.AUTO){
		renderer = game.renderType;
		gameOptions.set('system_renderer', renderer);
		gameOptions.save();
	}

	var layout = [
		Menu.alignLeft(
			Menu.text({
				text: 'Render mode',
				hoverText: 'WebGL usually has better performance but might not be supported on some devices\nThe page will need to be reloaded for this to take effect',
				hoverPlacement: 'left',
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
				text: 'Vignette',
				name: 'vignette',
				checked: gameOptions.get('ui_vignette'),
				hoverText: 'Dims the edges',
				hoverPlacement: 'right'
			})
		),
		Menu.alignLeft(
			Menu.text({
				text: 'Game speed',
				hoverPlacement: 'left',
				hoverText: 'How quickly the cards will move around the screen',
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
				hoverPlacement: 'left',
				hoverText: 'Scales game objects and interface\nUpper bound is limited by the window size',
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
			{	
				action: function(){
					ui.modalManager.openModal('name');
				}, 
				name: 'name',
				text: 'Change Name'
			}
		),
		Menu.alignLeft(
			Menu.text({
				text: 'Hand sorting',
				hoverPlacement: 'left',
				hoverText: 'How the cards will be sorted in your hand',
				fixedWidth: optionsTextWidth
			}),
			Menu.stepper({
				action: function(key){
					gameOptions.set('ui_sorting', key);
					fieldManager.sortPlayerHand();
				},
				choices: [
					[0, 'No'],
					[1, 'By suit'],
					[2, 'By value']
				],
				name: 'sorting',
				textColor: 'black',
				startKey: gameOptions.get('ui_sorting'),
				minWidth: optionsStepperWidth
			})
		),
		Menu.alignJustify(
			Menu.buttonPopup({	
				action: this.modifyOptions.bind(this, 'restoreGroup', 'Options restored', 2000), 
				name: 'restore',
				text: 'Restore',
				hoverText: 'Undo all changes',
				hoverPlacement: 'bottom'
			}),
			Menu.buttonPopup({	
				action: this.modifyOptions.bind(this, null, 'Options saved', 2000), 
				name: 'save',
				text: 'Save',
				color: 'orange',
				textColor: 'white',
				hoverText: 'Save all changes',
				hoverPlacement: 'bottom'
			}),
			Menu.buttonPopup({	
				action: this.modifyOptions.bind(this, 'restoreGroupDefaults', 'Options reset to default', 2000), 
				name: 'reset',
				text: 'Reset',
				hoverText: 'Reset all options to default values',
				hoverPlacement: 'bottom'
			})
		)
	];

	this.rendererMenu = new Menu({
		position: function(){
			return {
				x:game.screenWidth/2,
				y:game.screenHeight/2
			};
		},
		modal: true,
		z: -4,
		color: 'grey',
		elementColor: 'grey',
		textColor: 'black',
		name: 'menu_apply_renderer',
		header: 'Render Mode',
		closeButton: function(){
			ui.modalManager.closeModal();
		},
		closeButtonCrossColor: 'grey',
		layout: [
			Menu.text({
				text: 'Changing render mode requires the page to be reloaded.\nReload the page now?'
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
	});

	this.options.layout = layout;
	
	Menu.call(this, this.options);

	this.updatePosition();
};

extend(OptionsMenu, Menu);

OptionsMenu.prototype.getDefaultMenuOptions = function(){
	return {
		position: function(){
			return {
				x: game.screenWidth/2,
				y: game.screenHeight/2
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
		modal: true
	};
};

OptionsMenu.prototype.modifyOptions = function(action, message, time){
	if(action){
		gameOptions[action]('system');
		gameOptions[action]('ui');
		gameOptions[action]('game');
	}
	this.applyOptions(this);
	ui.feed.newMessage(message, time);
};

OptionsMenu.prototype.applyOptions = function(){

	var renderer = gameOptions.get('system_renderer');
	this.getElementByName('renderer').setKey(renderer);

	var gameOpts = gameOptions.getGroup('game');

	var scale = gameOpts['scale'];
	game.scale.scaleMultiplier = scale;
	this.getElementByName('scale').setKey(scale);
	game.updateCoordinates();	

	var speed = gameOpts['speed'];
	game.speed = speed;
	this.getElementByName('speed').setKey(speed);

	var uiOpts = gameOptions.getGroup('ui');
	var visible = uiOpts['vignette'];
	ui.background.vignette.visible = visible;						
	var vegBox = this.getElementByName('vignette');
	if(vegBox.checked != visible){
		vegBox.check();
	}

	this.getElementByName('sorting').setKey(uiOpts['sorting']);
	fieldManager.sortPlayerHand();

	var glow = uiOpts['glow'];
	var glowBox = this.getElementByName('hard_mode');
	if(glowBox.checked == glow){
		glowBox.check();
	}
	actionHandler.highlightPossibleActions();

	gameOptions.save();

	if(game.renderType != renderer){
		ui.modalManager.openModal('apply_renderer');
	}
};