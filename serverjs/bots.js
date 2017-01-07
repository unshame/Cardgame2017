/*
	Серверные боты
*/

var utils = require('./utils')
var randomNames = ['Lynda','Eldridge','Shanita','Mickie','Eileen','Hiedi','Shavonne','Leola','Arlena','Marilynn','Shawnna','Alanna','Armando','Julieann','Alyson','Rutha','Wilber','Marty','Tyrone','Mammie','Shalon','Faith','Mi','Denese','Flora','Josphine','Christa','Sharonda','Sofia','Collene','Marlyn','Herma','Mac','Marybelle','Casimira','Nicholle','Ervin','Evia','Noriko','Yung','Devona','Kenny','Aliza','Stacey','Toni','Brigette','Lorri','Bernetta','Sonja','Margaretta'];
var fakeDescisionTimer = 1;

var Bot = function(){
	this.id = 'bot_' + utils.generateId();
	this.type = 'bot';
	this.connected = true;

	var nameIndex = Math.floor(Math.random()*randomNames.length);
	this.name = randomNames[nameIndex];
	randomNames.splice(nameIndex,1);

	this.game = null;
}

Bot.prototype.meetOpponents = function(opponents){
}

Bot.prototype.recieveCards = function(cards){
	setTimeout(() => {this.sendResponse()},Math.random()*fakeDescisionTimer)
}

Bot.prototype.recieveDeals = function(deals){
	setTimeout(() => {this.sendResponse()},Math.random()*fakeDescisionTimer)
}

Bot.prototype.recieveMinTrumpCards = function(cards, winner){
	setTimeout(() => {this.sendResponse()},Math.random()*fakeDescisionTimer)
}

Bot.prototype.recieveValidActions = function(actions){
	var randomIndex
	if(actions.length > 1 && (actions[actions.length - 1].type == 'TAKE' || actions[actions.length - 1].type == 'SKIP'))
		randomIndex = Math.floor(Math.random()*(actions.length-1))
	else
		randomIndex = Math.floor(Math.random()*actions.length);
	var action = actions[randomIndex];
	this.sendResponse(action);
}

Bot.prototype.recieveAction = function(action){
	setTimeout(() => {this.sendResponse()},Math.random()*fakeDescisionTimer)
}

Bot.prototype.handleLateness = function(){

}

Bot.prototype.sendResponse = function(action){
	if(!this.game){
		utils.log(this.id, 'No game has been assigned');
		return
	}
	this.game.recieveResponse(this, action ? action : null);
}

exports.Bot = Bot;