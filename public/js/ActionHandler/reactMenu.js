/* exported reactMenu */
var reactMenu = {
	QUEUE_FULL: function(){
		console.log('Queue is full');
	},
	QUEUE_LIST: function(action){
		ui.menus.browser.recieveList(action);
	}
};