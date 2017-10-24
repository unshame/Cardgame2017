var LobbyMenu = function(options){

	this.options = mergeOptions(this.getDefaultMenuOptions(), options);

	var layout = [
		Menu.buttonPopup({
			action: this.copyInvite,
			fontSize: 24,
			name: 'invite',
			text: 'Copy Invite Link',
			hoverText: 'Share this link with somebody to invite them to join your game'
		}),
		Menu.buttonPopup({
			action: function(){
				connection.proxy.voteForPrematureStart();
				this.disableElement('vs_bots');
			},
			name: 'vs_bots',
			text: 'Play VS Bots',
			hoverText: 'Play versus bots if we can\'t find enough real people to pitch against you'
		}),
		{
			action: function(){
				connection.server.concede();
			},
			name: 'leave_queue',
			text: 'Leave Lobby'
		}
	];

	this.options.layout = layout;
	
	Menu.call(this, this.options);
};

extend(LobbyMenu, Menu);

LobbyMenu.prototype.getDefaultMenuOptions = function(){
	return {
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
		header: 'Lobby Options',
		headerColor: 'red'
	};
};

LobbyMenu.prototype.copyInvite = function(){
	var field = document.getElementById('queue_id');
	field.style.display = 'block';
	field.select();
	var success = document.execCommand('copy');
	if(document.activeElement){
		document.activeElement.blur();
	}
	field.style.display = 'none';
	ui.feed.newMessage(success ? 'Link copied' : 'Please copy the link manually from the adress bar', success ? 2000 : 5000);
};
