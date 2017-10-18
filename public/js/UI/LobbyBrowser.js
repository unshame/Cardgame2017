var LobbyBrowser = function(options){

	this.options = mergeOptions(this.getDefaultLobbyOptions(), options);
	this.page = null;
	this.list = null;
	this.info = null;
	this.selected = false;
	this.pagination = 3;

	var layout = [];
	var i;
	for(i = 0; i < this.pagination; i++){
		layout.push(Menu.alignLeft({
			name:'button'+i,
			text: '',
			action: this.select.bind(this, i)
		}));
	}
	layout[0].push(Menu.text({
		text:'',
		name: 'info',
		textColor: 'black',
	}));
	layout.push(Menu.alignJustify(
		{
			
			name: 'left',
			size:'arrowBig',
			action: function(){
				connection.proxy.requestQueueList(this.page - 1, this.pagination);
			},
			context:this
		},
		Menu.text({
			text:this.page,
			name: 'pageNum',
			textColor: 'black'
		}),
		{
			name: 'right',
			size:'arrowBig',
			action: function(){ 
				connection.proxy.requestQueueList(this.page + 1, this.pagination);
			},
			context:this
		}
	));
	layout.push([{
		name:'join',
		text:'Join game',
		action: function(){
			if(this.selected){
			game.state.change('queue');
			ui.menus.browser.fadeOut();
			connection.proxy.joinCustomQueue(this.selectedQueue);
			}	

		},
		context: this
	},
	{
		name:'refresh',
		text:'Refresh',
		action: function(){
 			this.selected = false;

			connection.proxy.requestQueueList(0, this.pagination);

		},
		context: this
	}
	]);
		
	this.options.layout = layout;
	Menu.call(this, this.options);

	this.buttons = [];

	for(i= 0; i < this.pagination; i++){
		this.buttons[i] = this.getElementByName('button' + i);
		if(i != this.pagination - 1){
			this.buttons[i].fixedHeight  = this.buttons[i].height - this.options.margin;
		}

	}
	for(var i = 0; i < this.pagination; i++){
 		this.buttons[i].changeStyle(3);
 		if(i==0) this.buttons[i].changeStyle(1);
		if(i== this.pagination-1) this.buttons[i].changeStyle(2);
 	}
	this.info = this.getElementByName('info');
	this.info.fixedWidth = 300;
	this.info.fixedHeight = this.buttons[0].fixedHeight;
	this.rightArrow = this.getElementByName('right');
	this.leftArrow = this.getElementByName('left');
	this.pageText = this.getElementByName('pageNum');
	this.joinButton = this.getElementByName('join');
	this.refreshButton = this.getElementByName('refresh');
	UI.ButtonBase.setStateFrames(this.leftArrow, 0);
	UI.ButtonBase.setStateFrames(this.rightArrow, 1);

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
		alpha: 0.9,
		color: 'grey',
		texture: null,
		elementColor: 'orange',
		textColor: 'white',
		corner: 10,
		border: 4,
		fadeTime: 200,
		layout: null,
		closeButton: function(){
			ui.menus.main.fadeIn();
			ui.logo.fadeIn();
			ui.menus.browser.fadeOut();
		},
		closeButtonCrossColor: 'white',
		header: false,
		headerHeight: 40,
		headerColor: 'orange',
		headerTextColor: 'white'
	};
};
LobbyBrowser.prototype.resetButtons = function(){
	for(var i = 0; i < this.pagination; i++){
		this.buttons[i].label.setText('');
		this.disableElement('button' + i);
		
		this.buttons[i].changeStyle(3);
		if(i==0) this.buttons[i].changeStyle(1);
		if(i== this.pagination-1) this.buttons[i].changeStyle(2);
	}
	this.disableElement('right');
	this.disableElement('left');
	if(this.list[0])
		this.select(0);	
};

LobbyBrowser.prototype.recieveList = function(action){
	
	
	this.list = action.list;
	this.page = action.page;

	this.resetButtons();
	for(var i = 0; i < this.list.length; i++){
		this.buttons[i].label.setText(this.list[i].name);
		this.enableElement('button' + i);		
	}
	if(action.moreAfter){
		this.enableElement('right');
	}
	this.pageText.setText(this.page+1);
	if(action.moreBefore){
		this.enableElement('left');
	}
	
};

 LobbyBrowser.prototype.select = function(u){
 	//debugger
 	
 	var a = this.list[u].name + '\n' + this.list[u].numPlayers + '/' + this.list[u].numPlayersRequired + '\n' + this.list[u].type;
 	this.info.setText(a);
 	this.selected = true;
 	this.selectedQueue = this.list[u].id
 //	this.selectedID = this.list[u].id;
 	for(var i = 0; i < this.pagination; i++){
 		this.buttons[i].changeStyle(3);
 		if(i==0) this.buttons[i].changeStyle(1);
		if(i== this.pagination-1) this.buttons[i].changeStyle(2);
 	}
 	this.buttons[u].changeStyle(6);
 	if(u==0) this.buttons[u].changeStyle(4);
	if(u== this.pagination-1) this.buttons[u].changeStyle(5);
 	
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
			{
				key: 'button_orange_largeTop',
			},
			{
				key: 'button_orange_largeBottom',
			},
			{
				key: 'button_orange_largeMiddle',
			},
			{
				key: 'button_red_largeTop',
			},
			{
				key: 'button_red_largeBottom',
			},
			{
				key: 'button_red_largeMiddle',
			}
		];
	}
	var button = new UI.ButtonAltStyles(options);
	button.disable(true);
	this.elements.push(button);
	return button;
};