/*
	Серверные боты
*/

'use strict';

const utils = require('./utils')
var fakeDescisionTimer = 1;

var Bot = function(randomNames){
	this.id = 'bot_' + utils.generateId();
	this.type = 'bot';
	this.connected = true;

	let nameIndex = Math.floor(Math.random()*randomNames.length);
	this.name = randomNames[nameIndex];
	randomNames.splice(nameIndex,1);

	this.game = null;
}

Bot.prototype.meetOpponents = function(opponents){
}

Bot.prototype.recieveGameInfo = function(cards){
	setTimeout(() => {this.sendResponse()},Math.random()*fakeDescisionTimer)
}

Bot.prototype.recieveDeals = function(deals){
	setTimeout(() => {this.sendResponse()},Math.random()*fakeDescisionTimer)
}

Bot.prototype.recieveMinTrumpCards = function(cards, winner){
	setTimeout(() => {this.sendResponse()},Math.random()*fakeDescisionTimer)
}

Bot.prototype.recieveValidActions = function(actions){
	let randomIndex
	if(actions.length > 1 && (actions[actions.length - 1].type == 'TAKE' || actions[actions.length - 1].type == 'SKIP'))
		randomIndex = Math.floor(Math.random()*(actions.length-1))
	else
		randomIndex = Math.floor(Math.random()*actions.length);
	let action = actions[randomIndex];
	this.sendResponse(action);
}

Bot.prototype.recieveCompleteAction = function(action){
	setTimeout(() => {this.sendResponse()},Math.random()*fakeDescisionTimer)
}

Bot.prototype.recieveNotification = function(note, actions){
	if(actions)
		setTimeout(() => {this.sendResponse(actions[0])},Math.random()*fakeDescisionTimer)
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

module.exports = Bot;