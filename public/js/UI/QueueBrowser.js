var QueueBrowser = function() {
	Phaser.Group.call(this,game, null);
	extend(QueueBrowser, Phaser.Group);
	this.list = null;
	this.page = null;
	this.pagination = null;
	this.channel = null;
	this.moreAfter = null;
	this.moreBefore = null;

}
QueueBrowser.prototype.updateList = function(action){
this.list = action.list;
this.page = action.page;
this.pagination = action.pagination;
this.channel = action.channel;
this.moreAfter = action.moreAfter;
this.moreBefore = action.moreBefore;
}