/*
* Класс, расширяющий GamePlayersBase, предоставляет методы оповещения игроков
* о статусе игры и нахождения игроков, вышедших из игры и идущих следующими.
* Также предоставляет метод проверки конца игры.
*/

'use strict';

const PlayerManager = reqfromroot('Player/PlayerManager');

class GamePlayers extends PlayerManager{

	constructor(game, players, turnStartStatus, gameStartStatus){
		super(game, players);
		this.replacementNames = [];
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
		p.statuses.working = false;
		p.statuses.hover = null;
		p.afk = false;
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
		this.replacementNames = ['Synth', 'Zombie', 'Bot', 'Doppelganger', 'Clone', 'Some Guy'];
	}

	resetPlayer(player, hard){
		super.resetPlayer(player, hard);
		player.afk = false;
		
		if(hard){
			player.score = null;
		}
	}

	// Счеты
	get scores(){
		let scores = {};
		this.forEach((p) => {
			scores[p.id] = p.score;
		});
		return scores;
	}

	get roles(){
		return {};
	}

	// ТИПЫ ИГРОКОВ
	
	// Люди
	get humans(){
		return this.getWithOwn('type', 'player');
	}

	// Боты
	get bots(){
		return this.getWithOwn('type', 'bot');
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
	
	gameStateNotify(){
		throw new Error('Must be implemented by subclass');
	}

	gameStateNotifyOnReconnect(){
		throw new Error('Must be implemented by subclass');
	}

	reconnect(player){
		if(!this.includes(player)){
			this.log.error(new Error(`Cannot reconnect a player that isn\'t in this game ${player.id}`));
			return;
		}

		player.afk = false;
		this.gameStateNotifyOnReconnect(player);
		this.log.notice('Player reconnected', player.id);
	}

	disconnect(player){
		if(!this.includes(player)){
			this.log.error(new Error(`Cannot disconnect a player that isn\'t in this game ${player.id}`));
			return;
		}

		if(this.game.isRunning){
			this.log.error(new Error(`Can't disconnect when the game is running, use concede instead`));
			return;
		}

		this.notify({type: 'DISCONNECTED', instant: true}, [player]);
		let pi = this.indexOf(player);
		this.splice(pi, 1);

		this.resetPlayer(player, true);
		if(player.queue){
			player.queue.removePlayer(player, false, true);
		}
		if(player.type == 'player'){
			this.log.notice('Player disconnected', player.id);
		}
	}

	concede(player){
		if(!this.includes(player)){
			this.log.error(new Error(`Cannot concede a player that isn't in this game ${player.id}`));
			return;
		}
		if(!this.game.isRunning){
			this.log.error(new Error(`Can't concede when the game isn't running, use disconnect instead`));
			return;
		}

		this.notify({type: 'PLAYER_CONCEDED', pid: player.id, instant: true}, [player]);		

		let pi = this.indexOf(player);
		this.splice(pi, 1);

		let replacement = this.game.queue.createBot(this.replacementNames, true);
		this.push(replacement);
		replacement.statuses = player.statuses;
		replacement.id = player.id;
		
		this.resetPlayer(player, true);

		let i = this.length - 1;
		while(i > pi){
			let swap = this[i - 1];
			this[i - 1] = replacement;
			this[i] = swap;
			i--;
		}

		this.notify({type: 'PLAYER_CONCEDED', pid: player.id, name: replacement.name});

		this.log.notice('Player conceded', player.id);

		// Посылаем ответ от бота, чтобы продолжить игру, если от бота ожидается ответ и в игре остались реальные игроки
		if(this.humans.length && replacement.statuses.working){
			replacement.sendResponse();
		}
	}

	concedeDisconnected(){
		let now = Date.now();
		this.forEach((p) => {
			if(!p.connected && now - p.disconnectTime > this.game.disconnectTimeout){
				this.concede(p);
			}
		});
	}

	// Оповещает игроков о совершенном действии
	completeActionNotify(action, players){
		this.forEachOwn((p) => {
			let newAction = Object.assign({}, action);
			this.applyNoResponseStatus(newAction, p);
			p.recieveCompleteAction(newAction);
		}, players);
	}

	validActionsNotify(deadline){
		const game = this.game;
		game.log.silly(game.actions.valid);
		this.forEachOwn((p) => {
			p.recieveValidActions(game.actions.valid[p.id].slice(), deadline, this.roles, game.turnIndex, game.turnStages.current);
		}, game.simulating ? this.bots : this);
	}

	// Отправляет сообщение игрокам с опциональными действиями
	notify(note, players){
		this.forEachOwn((p) => {
			p.recieveNotification(Object.assign({}, note));
		}, players);
	}

	rolesNotify(players){
		this.forEachOwn((p) =>{
			p.recieveExtraNotification({
				type: 'UPDATE_ROLES',
				roles: this.roles, 
				turnIndex: this.game.turnIndex,
				turnStage: this.game.turnStages.current
			});
		}, players);
	}

	applyNoResponseStatus(action, player){
		if(!action.noResponse && this.game.simulating && player.type == 'player'){
			action.noResponse = true;
		}
	}

	allAfk(players){
		for(let i = 0, len = players.length; i < len; i++){
			let player = players[i];
			if(this.game.actions.valid[player.id].length && !player.afk){
				return false;
			}
		}
		return true;
	}

	// ЛОГ

	logTurnStart(){
		throw new Error('Must be implemented by subclass');
	}

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

module.exports = GamePlayers;