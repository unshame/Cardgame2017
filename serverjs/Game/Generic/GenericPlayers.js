/*
 * Класс, расширяющий GamePlayersBase, предоставляет методы оповещения игроков
 * о статусе игры и нахождения игроков, вышедших из игры и идущих следующими.
 * Также предоставляет метод проверки конца игры.
 */

'use strict';

const
	Bot = requirejs('Players/Bot.js'),
	GamePlayers = requirejs('Game/GamePlayers');

class GenericPlayers extends GamePlayers{

	constructor(game, players, turnStartStatus, gameStartStatus){
		super(game, players);
		this.turnStartStatus = turnStartStatus;
		this.gameStartStatus = gameStartStatus;
		this.log = game.log;
	}

	static get [Symbol.species]() { return Array; }

	push(p){
		this.setStatuses(p, this.gameStartStatus);
		p.score = {
			wins: 0,
			losses: 0
		};
		p.working = false;
		super.push(p);
	}

	// Ставит статусы по умолчанию хода
	resetTurn(){
		this.forEach((p) => {
			this.setStatuses(p, this.turnStartStatus);
		});
	}

	// Ставит статусы по умолчанию игры
	resetGame(){
		this.forEach((p) => {
			this.setStatuses(p, this.gameStartStatus);
		});
	}

	// Счеты
	get scores(){
		let scores = {};
		this.forEach((p) => {
			scores[p.id] = p.score;
		});
		return scores;
	}

	// СТАТУСЫ

	// Активные
	get active(){
		return this.getWith('active', true);
	}
	set active(players){
		this.set('active', false);
		if(players.length){
			this.set('active', true, players);
		}
	}
	setActive(players){
		this.set('active', true, players);
	}

	// Неактивные
	get inactive(){
		return this.getWith('active', false);
	}
	set inactive(players){
		this.set('active', true);
		if(players.length){
			this.set('active', false, players);
		}
	}
	setInactive(players){
		this.set('active', false, players);
	}

	// Действующие
	get working(){
		return this.getWith('working', true);
	}
	set working(players){
		this.set('working', false);
		if(players.length){
			this.set('working', true, players);
		}
	}
	setWorking(players){
		this.set('working', true, players);
	}

	// ОПОВЕЩЕНИЕ ИГРОКОВ
	
	gameStateNotify(players){}

	gameStateNotifyOnReconnect(player){}

	reconnect(player){
		if(!this.includes(player)){
			this.log.error('Cannot reconnect a player that isn\'t in this game', player.id);
			return;
		}

		player.afk = false;
		this.gameStateNotifyOnReconnect(player);
	}

	disconnect(player){
		if(!this.includes(player)){
			this.log.error('Cannot disconnect a player that isn\'t in this game', player.id);
			return;
		}
		this.notify({message: 'DISCONNECTED', noResponse: true}, null, [player]);
		player.game = null;
		this.splice(this.indexOf(player), 1);
		let replacement = new Bot(['Synth']);
		replacement.statuses = player.statuses;
		replacement.id = player.id;
		player.statuses = {};
		this.push(replacement);
	}

	// Оповещает игроков о совершенном действии
	completeActionNotify(action){
		this.forEach((p) => {
			let newAction = Object.assign({}, action);
			if(!newAction.noResponse && this.game.simulating && p.type == 'player'){
				newAction.noResponse = true;
			}
			p.recieveCompleteAction(newAction);
		});
	}

	// Отправляет сообщение игрокам с опциональными действиями
	notify(note, actions, players){
		this.forEachOwn((p) => {
			p.recieveNotification(Object.assign({}, note), actions || null);
		}, players);
	}

	// ЛОГ

	logTurnStart(){}

	logTimeout(){
		let playersWorking = this.working;
		let names = '';
		for(let pi = 0; pi < playersWorking.length; pi++){
			let name = playersWorking[pi].name;
			names += name + ' ';
		}
		this.log.notice('Players timed out: ', names);
	}

}

module.exports = GenericPlayers;