var LobbyBrowser = function(options){
	this.options = this.getDefaultLobbyOptions();
	this.rooms = [];
	this.list = null;
	this.page = null;
	this.moreBefore = null;
	this.moreAfter = null;
	this.info = null;
	var layout = [];
	for(var i= 0; i<10; i++){
		layout.push({
			name:'button'+i,
			text: '',
			action: function(){}
		})
	}
	var temp = layout[0];
	layout[0] = [temp,Menu.text({text:''})];
	layout.push({
		name:'join',
		text:'Join game',
		action: function(){}
	}) 
	Menu.call(this, options);
	this.rightArrow = new UI.Button({
			name: 'left',
			action:function(){}
		});
	this.leftArrow = new UI.Button({
				name: 'right',
				action:function(){}
			});

	//Menu.justify(this.leftArrow,Menu.text({text:''}), this.rightArrow)
	for(var i= 0; i<10; i++){
//		this.rooms[i] = layout.getElementByName('button' + i);

	}
}

extend(LobbyBrowser, Menu);

LobbyBrowser.prototype.getDefaultLobbyOptions = function(){
	return {
		position: {
			x: 0,
			y: 0
		},
		z: 0,
		margin: 25,
		name: 'default',
		alpha: 0.9,
		color: 'grey',
		texture: null,
		elementColor: 'orange',
		textColor: 'white',
		corner: 10,
		border: 4,
		fadeTime: 200,
		layout: null,
		closeButton: null,
		closeButtonCrossColor: 'white',
		header: false,
		headerHeight: 40,
		headerColor: 'orange',
		headerTextColor: 'white'
	};
};
LobbyBrowser.prototype.resetButtons = function(){
	for(var i = 0; i<10;i++){
		this.rooms[i].label.setText('');
		this.rooms[i].disable();
		this.rooms[i].setStyle(0);
	}
}
LobbyBrowser.prototype.recieveList = function(action){
	this.resetButtons();
	this.list = action.list;
	this.page = action.page;
	this.moreBefore = action.moreBefore;
	this.moreAfter = action.moreAfter;
	for(var i = 0; i<10;i++){
		this.rooms[i].setText(this.list[i].id)
	}
	if(moreAfter) this.rightArrow.enable();
	if(moreBefore) this.leftArrow.enable();
}
 LobbyBrowser.prototype.select = function(u){
 	a = this.list[u].id + ' ' + this.list[u].numPlayers + '/' + this.list[u].numPlayersRequired + ' ' + this.list[u].type;
 	this.info.setText(a);
 	this.selectedID = this.list[u].id;
 	for(var i = 0; i < 10;i++){
 		this.rooms[i].setStyle(0);
 	}
 	this.rooms[u].setStyle(1);
 }
LobbyBrowser.prototype.updateList = function(action){
this.list = action.list;
this.page = action.page;
this.pagination = action.pagination;
this.moreAfter = action.moreAfter;
this.channel = action.channel;
this.moreBefore = action.moreBefore;
}