var LobbyBrowser = function(options){
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
	layout[0] = [layout[0],Menu.text()];
	layout.push({
		name:'join',
		text:'Join game',
		action: function(){}
	}) 
	UI.Menu.call(this.options);
	this.rightArrow = new UI.Button({
			name: 'left',
			action:function(){}
		}),
	this.leftArrow = new UI.Button({
				name: 'right',
				action:function(){}
			}),

	Menu.justify(leftArrow,rightArrow)
	for(var i= 0; i<10; i++){
		this.rooms[i] = this.layout.getElementsByName('button' + i);

	}
}

extend(LobbyBrowser, UI.Menu);

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