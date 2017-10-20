/* exported reactMenu */
var reactMenu = {

	QUEUE_FULL: function(){
		console.log('Queue is full');
	},

	QUEUE_LIST: function(action){
		ui.menus.browser.recieveList(action);
	},

	QUEUE_INACTIVE: function(){
		ui.feed.newMessage('Failed to join game', 2000);
		ui.menus.browser.refresh();
	}
};