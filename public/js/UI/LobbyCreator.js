var LobbyCreator = function(options){
	this.options = mergeOptions(this.getDefaultLobbyOptions(), options);
	var stepperWidth = 110;
	var textWidth = 100;
	var layout = [

		Menu.alignLeft(
			Menu.text({
				text:'Players',
				name:'numOfPlayers',
				hoverText:'Number of human players',
				hoverPlacement: 'left',
				fixedWidth: textWidth
			}),
			Menu.stepper({
				action: this.limitBotSelectorRange,
				context: this,
				name:'stepOfPlayers',
				choices: { 
					'1': '1',
					'2': '2',
					'3': '3',
					'4': '4',
					'5': '5',
					'6': '6',
				},
				minWidth: stepperWidth,
				startKey: '2'
			}),
			Menu.checkbox({
				text: 'Transfer',
				name: 'transfer',
				hoverText: 'Players can play a card with the same value instead of defending to force the next player to defend',
				hoverPlacement: 'right'
			})
		),

		Menu.alignLeft(
			Menu.text({
				text: 'Bots',
				name: 'numOfBots',
				hoverText: 'Number of AI-controlled players',
				hoverPlacement: 'left',
				fixedWidth: textWidth
			}),
			Menu.stepper({
				name:'stepOfBots',
				choices:{ 
					'0': '0',
					'1': '1',
					'2': '2',
					'3': '3',
					'4': '4',
					'5': '5',
				},
				minWidth: stepperWidth,
				context: this,
				startKey: '0'
			}),
			Menu.checkbox({ 
				text: 'Free for all',
				name: 'freeForAll',
				hoverText: 'Multiple players will be able to attack at the same time',
				hoverPlacement: 'right'
			})
		),

		Menu.alignLeft(
			Menu.text({
				text:'Deck size',
				name:'deckSize',
				hoverText: '36 cards deck is recommended for 2-4 players game, 52 cards deck is recommended for 4-6 players game',
				hoverPlacement: 'left',
				fixedWidth: textWidth
			}),
			Menu.stepper({
				name:'deckSizeStep',
				choices:{ 
					'1': '36',
					'2': '52'			
				},
				minWidth: stepperWidth
			}),
			Menu.checkbox({
				text: 'Limit followup',
				name: 'limitFollowup',
				hoverText: 'Limits the amount of cards that players can follow up with by the defender\'s hand size at the start of the turn',
				hoverPlacement: 'right'
			})
		),
		
		Menu.alignLeft(
			Menu.text({
				text:'Difficulty',
				name:'difficulty',
				hoverText: 'Difficulty of the AI-controlled opponents',
				hoverPlacement: 'left',
				fixedWidth: textWidth
			}),
			Menu.stepper({
				name:'stepOfDifficulty',
				choices: { 
					'1': 'Easy',
					'2': 'Medium',
					'3': 'Hard',
					'4': 'Godlike',
				},
				minWidth: stepperWidth,
				context:this
			}),
			Menu.checkbox({
				text:'Limit attack',
				name:'limitAttack',
				hoverText:'Only players adjacent to the defender can attack',
				hoverPlacement: 'right'
			})
		),

		[
			Menu.checkbox({
				text: 'Private',
				name: 'private',
				hoverText: 'Players won\'t be able to find your game via the Find Game menu',
				hoverPlacement: 'bottom'
			}),
			{
				name:'createGame',
				text:'Create Game',
				action:function(){
					this.createGame();
				},
			},
			{
				name:'cancel',
				text:'Cancel',
				action:function(){
					ui.menus.main.fadeIn();
					ui.logo.fadeIn();
					this.fadeOut();
				},
				context: this
			}
		]	
	];
	this.options.layout = layout;
	
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
		closeButtonCrossColor: 'white',
		header: 'Create Game',
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
	};
	ui.menus.creator.fadeOut();
	connection.proxy.createCustomQueue(private, gameMode, config, rules);
};

LobbyCreator.prototype.limitBotSelectorRange = function(key){
	var botSelector = this.getElementByName('stepOfBots');
	var numBots = Number(botSelector.getCurrentKey());
	var numPlayers = Number(key);
	var max = 6;
	if(numPlayers < 2){
		botSelector.limitRange(1, Infinity);
	}
	else{
		botSelector.limitRange(0, max - numPlayers);
	}
};
