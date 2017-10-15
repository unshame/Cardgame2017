var LobbyCreator = function(options){
	this.options = mergeOptions(this.getDefaultLobbyOptions(), options);
	var layout = [
		Menu.alignLeft(
			Menu.text({
				text:'Players   ',
				name:'numOfPlayers',
				hoverText:'Number of real players'
			}),
			Menu.stepper({
				action:function(key){
					//debugger
						var bots = this.getElementByName('stepOfBots');
					if((Number(key) + Number(bots.getCurrentKey())) > 6){
						bots.prev();
						bots.arrowRight.disable();
						bots.arrowRight.alpha = 0.5;
						if(bots.previousContent){
							bots.arrowLeft.enable();
							bots.arrowLeft.alpha = 1;
						}
					}
					else if((Number(key) + Number(bots.getCurrentKey())) < 6){
							bots.arrowRight.enable();
							bots.arrowRight.alpha = 1;
							if(bots.nextContent){
								bots.arrowRight.enable();
								bots.arrowRight.alpha = 1;
						}
						}
					if(Number(bots.nextContent.text)+ Number(key) > 6){
						bots.arrowRight.disable();
						bots.arrowRight.alpha = 0.5
					}
				},
				name:'stepOfPlayers',
				choices: { 
					'1': '1',
					'2': '2',
					'3': '3',
					'4': '4',
					'5': '5',
					'6': '6',
				},
				minWidth: 50,
				context:this
			}),
			Menu.checkbox({
				text:'Private',
				name:'private',
				hoverText:'Youre game will be private'
			})
		),
		Menu.alignLeft(
			Menu.text({
				text:'Bots        ',
				name:'numOfBots',
				hoverText:'Number of bots'
			}),
			Menu.stepper({
				action:function(key){
					//debugger
						var players = this.getElementByName('stepOfPlayers');
						var bots = this.getElementByName('stepOfBots');
					if((Number(key) + Number(players.getCurrentKey()) > 6)){
							bots.prev();
							bots.arrowRight.disable();
							bots.arrowRight.alpha = 0.5;
							if(bots.previousContent)
								if(bots.previousContent.text){
									bots.arrowLeft.enable();
									bots.arrowLeft.alpha = 1;
								}
					}
					else 
						if((Number(key) + Number(players.getCurrentKey())) < 6){
							bots.arrowRight.enable();
							bots.arrowRight.alpha = 1;
						}
					if(bots.nextContent){
							if(Number(bots.nextContent.text)+ Number(players.getCurrentKey()) > 6){
								bots.arrowRight.disable();
								bots.arrowRight.alpha = 0.5
							}
						}
				},
				name:'stepOfBots',
				choices:{ 
					'0': '0',
					'1': '1',
					'2': '2',
					'3': '3',
					'4': '4',
					'5': '5',
				},
				minWidth: 50,
				context:this,
				startKey: '0'
			}),
			Menu.checkbox({ 
				text:'Transfer',
				name:'transfer',
				hoverText:'Enable Transfer'
			})
		),
		Menu.alignLeft(
			Menu.text({
				text:'Deck size',
				name:'deckSize',
			}),
			Menu.stepper({
				name:'deckSizeStep',
				choices:{ 
					'1': '36',
					'2': '52'			
				},
				minWidth: 50
			}),
			Menu.checkbox({
				text:'Free for all',
				name:'freeForAll',
				hoverText:' something'
			})
		),
		Menu.checkbox({
				text:'Limit attack',
				name:'limitAttack',
				hoverText:'something'
			}),
		Menu.checkbox({
				text:'Limit followup',
				name:'limitFollowup',
				hoverText:'something'
			}),
		{
			name:'createGame',
			text:'Create Game',
			action:function(){
				this.createGame()
			},
		},
		
	];
	this.options.layout = layout;
	
	//if(Number(this.getElementByName('stepOfPlayers').getCurrentKey()) + Number(this.getElementByName('stepOfBots').getCurrentKey()) ==1 )
	//	this.getElementByName('stepOfBots').currentContent = 2;
	Menu.call(this, this.options);
	
};

extend(LobbyCreator, Menu);

LobbyCreator.prototype.getDefaultLobbyOptions = function(){
	return {
		position: function(){
			return {
				x:game.screenWidth/2,
				y:game.screenHeight/2
			};
		},
		z: 7,
		margin: 25,
		name: 'creator',
		alpha: 0.8,
		color: 'orange',
		texture: null,
		elementColor: 'red',
		textColor: 'white',
		corner: 10,
		border: 4,
		fadeTime: 200,
		layout: null,
		closeButton: function(){
			ui.menus.main.fadeIn();
			ui.logo.fadeIn();
			ui.menus.creator.fadeOut();
		},
		closeButtonCrossColor: 'white',
		header: 'Create lobby',
		headerHeight: 40,
		headerColor: 'red',
		headerTextColor: 'white'
	};
};

LobbyCreator.prototype.createGame = function(){
	var gameMode = 'durak';
	var private = this.getElementByName('private').checked;
	var config = {
		numPlayers: Number(this.getElementByName('stepOfPlayers').getCurrentKey()),
		numBots: Number(this.getElementByName('stepOfBots').getCurrentKey())

	};
	//var canTransfer =this.getElementByName('transfer').checked;
	var rules = {
		canTransfer:this.getElementByName('transfer').checked,
		freeForAll:this.getElementByName('freeForAll').checked,
		limitAttack:this.getElementByName('limitAttack').checked,
		limitFollowup:this.getElementByName('limitFollowup').checked
	}
	ui.menus.creator.fadeOut();
	connection.proxy.createCustomQueue(private, gameMode, config, rules)
};