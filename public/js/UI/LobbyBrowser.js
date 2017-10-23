var LobbyBrowser = function(options){

	this.options = mergeOptions(this.getDefaultLobbyOptions(), options);
	this.list = [];
	this.page = null;
	this.info = null;
	this.selected = false;
	this.pagination = 7;

	var layout = [];
	var i;
	for(i = 0; i < this.pagination; i++){
		layout.push(Menu.alignLeft({
			name: 'button'+i,
			text: '',
			downOffset: 0,
			action: this.select.bind(this, i),
			disabledLabelAlpha: 1
		}));
	}

	layout[0].push(Menu.text({
		text:'',
		name: 'info',
		textColor: 'black',
	}));

	layout.push(Menu.alignLeft(
		{			
			name: 'left',
			size: 'arrow',
			action: this.loadPrevious,
			context:this
		},
		Menu.text({
			text: this.page,
			name: 'pageNum',
			textColor: 'black'
		}),
		{
			name: 'right',
			size: 'arrow',
			action: this.loadNext,
			context:this
		},
		Menu.checkbox({
			text: 'Hide started games',
			name: 'hideStarted',
			checked: true,
			color: 'orange',
			textColor: 'black',
			actionEnable: this.refresh,
			actionDisable: this.refresh,
			context: this
		})
	));

	layout.push([
		{
			name: 'join',
			text: 'Join Game',
			action: this.join,
			context: this
		},
		{
			name: 'refresh',
			text: 'Refresh',
			action: this.refresh,
			context: this
		},
		{
			name: 'cancel',
			text: 'Cancel',
			action: this.close,
			context: this
		}
	]);
		
	this.options.layout = layout;
	Menu.call(this, this.options);

	this.buttons = [];

	for(i = 0; i < this.pagination; i++){
		this.buttons[i] = this.getElementByName('button' + i);
		if(i != this.pagination - 1){
			this.buttons[i].fixedHeight  = this.buttons[i].height - this.options.margin - 1;
		}
	}

	this.info = this.getElementByName('info');
	this.info.setTextBounds(0, 0, 280, this.buttons[0].fixedHeight, 'center', 'top');

	this.rightArrow = this.getElementByName('right');
	this.leftArrow = this.getElementByName('left');
	UI.ButtonBase.setStateFrames(this.leftArrow, 0);
	UI.ButtonBase.setStateFrames(this.rightArrow, 1);

	this.pageText = this.getElementByName('pageNum');
	this.pageText.setTextBounds(0, 0, this.buttons[0].width - this.options.margin, this.leftArrow.height, 'center', 'middle');

	this.joinButton = this.getElementByName('join');
	this.refreshButton = this.getElementByName('refresh');

	this.resetButtons();

	this.updatePosition();
};

extend(LobbyBrowser, Menu);

LobbyBrowser.prototype.getDefaultLobbyOptions = function(){
	return {
		position: function(){
			return {
				x:game.screenWidth/2,
				y:game.screenHeight/2
			};
		},
		z: 6,
		margin: 25,
		name: 'browser',
		alpha: 1,
		color: 'grey',
		texture: null,
		elementColor: 'orange',
		textColor: 'white',
		corner: 10,
		border: 4,
		fadeTime: 200,
		layout: null,
		header: 'Join Game',
		headerHeight: 40,
		headerColor: 'orange',
		headerTextColor: 'white'
	};
};
LobbyBrowser.prototype.resetButtons = function(){
	for(var i = 0; i < this.pagination; i++){
		this.buttons[i].label.setText('', true);
		this.disableElement('button' + i);
		
		this.buttons[i].changeStyle(i === 0 ? 1 : i == this.pagination - 1 ? 2 : 3);
	}
	this.disableElement('right');
	this.getElementByName('right').alpha = 0.5;
	this.disableElement('left');
	this.getElementByName('left').alpha = 0.5;
};

LobbyBrowser.prototype.recieveList = function(action){	
	this.list = action.list;
	this.page = action.page;

	this.resetButtons();

	for(var i = 0; i < this.list.length; i++){
		UI.Text.limitWidth(this.buttons[i].label, this.list[i].name, this.buttons[i].width - 5);
		this.enableElement('button' + i);		
	}

	this.pageText.setText('Page ' + (this.page + 1), true);

	if(action.moreAfter){
		this.enableElement('right');
		this.getElementByName('right').alpha = 1;
	}
	if(action.moreBefore){
		this.enableElement('left');
		this.getElementByName('left').alpha = 1;
	}

	if(this.list[0]){
		this.select(0);	
	}
	else{
		this.disableElement('join');
		this.resetInfo();
		this.info.setText('No games found :(', true);
	}

};

LobbyBrowser.prototype.resetInfo = function(){
	this.info.scale.set(1, 1);
	this.info.setText('');
	this.info.updatePosition();
};

LobbyBrowser.prototype.centerInfo = function(){
	this.info.updatePosition();
	this.info.x += (this.info.fixedWidth - this.info.fixedWidth*this.info.scale.y)/2;
};

LobbyBrowser.prototype.select = function(u){
	this.resetInfo();
  	this.info.setText(this.getInfoText(u), true);
  	var maxHeight = this.buttons[0].height*this.pagination + this.options.margin;
  	if(this.info.height > maxHeight){
  		var scale = maxHeight/this.info.height;
  		this.info.scale.set(scale, scale);
  		this.centerInfo();
  	}

 	this.selectedQueue = this.list[u].id;

 	for(var i = 0; i < this.pagination; i++){
		this.buttons[i].changeStyle(i === 0 ? 1 : i == this.pagination - 1 ? 2 : 3);
 		if(i < this.list.length){
			this.enableElement('button' + i);
 		}
 	}

 	this.disableElement('button' + u);
 	this.buttons[u].changeStyle(u === 0 ? 4 : u == this.pagination - 1 ? 5 : 6);

 	if(this.list[u].started){
 		this.disableElement('join');
 	}
 	else{
 		this.enableElement('join');
 	}
};

LobbyBrowser.prototype.getInfoText = function(u){
	var yesNo = {
		true: 'Yes',
		false: 'No'
	};
	var el = this.list[u];
	var a = el.name + '\n';
	a += 'Type: ' + el.type;
	if(el.started){
		a += ' (started)';
	}
	a += '\n';
	var numPlayers = el.playerNames.length;
	var numPlayersDif = el.numPlayersRequired - numPlayers;
	var numBots = el.numBots + numPlayersDif;
	var numBotsAdded = el.numBotsAdded + numPlayersDif;
	if(el.started){
		a += numPlayers + ' player';
		if(numPlayers > 1){
			a += 's';
		}
	}
	else{
		a += numPlayers + ' / ' + el.numPlayersRequired + ' player';
		if(el.numPlayersRequired > 1){
			a += 's';
		}
	}
	a += ' (' + el.playerNames.join(', ') + ')';
	a += '\n';
	if(numBots !== 0){
		a += numBots + ' bot';
		if(numBots > 1){
			a += 's';
		}
		if(numBotsAdded > 0){
			a += ' (' + numBotsAdded + ' extra)';
		}
		a += '\n';
		a += 'Bot difficulty: ';
		switch(el.difficulty){
			case 0:
			a += 'Easy\n';
			break;

			case 1:
			a += 'Medium\n';
			break;

			case 3:
			a += 'Cheater\n';
			break;

			case 2:
			/* falls through */

			default: 
			a += 'Hard\n';
			break;
		}
	}
	
	var deckSize = el.gameRules.numCards;
	if(typeof deckSize != 'number' || isNaN(deckSize)){
		deckSize = (el.numBots + el.numPlayersRequired < 4) ? 36 : 52;
	}
	a += 'Deck size: ' + deckSize + '\n';
	a += 'Turn time: ' + (el.gameRules.longerTurn ? '40' : '20') + 'sec\n';	
	a += 'Can transfer: ' + yesNo[el.gameRules.canTransfer] + '\n';
	a += 'Limit attackers: ' + yesNo[el.gameRules.limitAttack] + '\n'; 
	a += 'Limit followup: ' + yesNo[el.gameRules.limitAttack] + '\n';	

	return a;
};

LobbyBrowser.prototype._addButton = function(options){
	options.group = this;
	if(!options.color && options.color !== 0){
		options.color = this.options.elementColor;
	}
	if(!options.textColor && options.textColor !== 0){
		options.textColor = this.options.textColor;
	}
	if(options.context === false){
		options.context = undefined;
	}
	else if(!options.context){
		options.context = this;
	}
	if(options.styles === undefined){
		options.styles = [
			{key: 'button_orange_largeTop'},
			{key: 'button_orange_largeBottom'},
			{key: 'button_orange_largeMiddle'},
			{key: 'button_red_largeTop'},
			{key: 'button_red_largeBottom'},
			{key: 'button_red_largeMiddle'}
		];
	}
	var button = new UI.ButtonAltStyles(options);
	button.disable(true);
	this.elements.push(button);
	return button;
};

LobbyBrowser.prototype.shouldHideStarted = function(){
	return this.getElementByName('hideStarted').checked;
};

LobbyBrowser.prototype.loadPrevious = function(){
	this.disableElement('join');
	connection.proxy.requestQueueList(this.page - 1, this.pagination, this.shouldHideStarted());
};

LobbyBrowser.prototype.loadNext = function(){
	this.disableElement('join');
	connection.proxy.requestQueueList(this.page + 1, this.pagination, this.shouldHideStarted());
};

LobbyBrowser.prototype.join = function(){
	this.disableElement('join');
	connection.proxy.joinCustomQueue(this.selectedQueue);
};

LobbyBrowser.prototype.refresh = function(){
	this.disableElement('join');
	connection.proxy.requestQueueList(this.page, this.pagination, this.shouldHideStarted());
};

LobbyBrowser.prototype.close = function(){
	ui.menus.main.fadeIn();
	ui.logo.fadeIn();
	this.fadeOut();
};

LobbyBrowser.prototype.fadeIn = function(){
	this.refresh();
	supercall(LobbyBrowser).fadeIn.call(this);
};

LobbyBrowser.prototype.updatePosition = function(){
	supercall(LobbyBrowser).updatePosition.call(this);
	this.centerInfo();
};
