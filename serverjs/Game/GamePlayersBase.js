/*
 * Класс, хранящий ссылки на игроков, участвующих в игре.
 * Предоставляет методы для получения игроков с определенными статусами и установки статусов.
 * 
 * Так как класс не хранит массивы с игроками, а составляет их по запросу, для повышения
 * производительности полученные массивы лучше сохранять в переменной и пользоваться ей.
 * Напрямую нужно обращаться только к игрокам по индексу (GamePlayersBase[index]).
 */

'use strict';

const
	BetterArray = require('../BetterArray.js');

class GamePlayersBase extends BetterArray{

	constructor(game, players, turnStartStatus, gameStartStatus){
		super();
		this.game = game;
		this.roles = ['attacker', 'defender','ally'];
		this.turnStartStatus = turnStartStatus;
		this.gameStartStatus = gameStartStatus;
		for(let i = 0; i < players.length; i++){
			let p = players[i];
			this.push(p);				
		}
	}

	static get [Symbol.species]() { return Array; }

	//Добавление игроков в массив
	push(p){
		p.game = this.game;
		this.setStatuses(p, this.gameStartStatus);
		p.score = {
			wins: 0,
			losses: 0,
			cardsWhenLost: 0
		};
		p.working = false;
		p.active = true;
		super.push(p);
	}


	//Устанавливает статус по умолчанию игроку
	setStatuses(p, status){
		for(let key in status){
			if(status.hasOwnProperty(key))
				p[key] = status[key];
		}
	}

	//Ставит статусы по умолчанию хода
	resetTurn(){
		for(let i = 0; i < this.length; i++){
			let p = this[i];
			this.setStatuses(p, this.turnStartStatus);
		}
	}

	//Ставит статусы по умолчанию игры
	resetGame(){
		for(let i = 0; i < this.length; i++){
			let p = this[i];
			this.setStatuses(p, this.gameStartStatus);
		}
	}


	//Игроки по id
	get byId(){
		return this.byKey('id');
	}

	//Возвращает id и имена игроков
	get info(){
		let info = [];
		for(let i = 0; i < this.length; i++){
			let p = this[i];
			let o = {
				id: p.id,
				name: p.name
			};
			info.push(o);	
		}
		return info;
	}


	//СТАТУСЫ	
	
	/*
	 * Меняет статус игроков
	 * @status String - какой статус менять
	 * @value * - на что менять статус
	 * @players Player - у каких игроков менять статус
	 * Сравнение через ==, так что можно передавать true и любое трушное значение подойдет
	 */
	set(status, value, players){

		if(!players || !players.length)
			players = this;

		let pids = this.map(p => p.id);

		for(let i = 0; i < players.length; i++){
			let p = players[i];
			let pi = pids.indexOf(p.id);
			if(~pi){
				let p = this[pi];
				p[status] = value;
			}
		}
	}

	/*
	 * Возвращает массив с игроками с определенным статусом
	 * @status String - какой статус сравнивать
	 * @compare function\* - как или с чем сравнивать статус
	 * @sort Boolean - нужно ли сортировать игроков по значению статуса
	 * @players - опционально можно указать среди каких игроков выбирать
	 */
	getWith(status, compare, sort, players){
		if(!players)
			players = this;

		if(typeof compare != 'function'){
			let newVal = compare;
			compare = (value) => {
				return value == newVal;
			};
		}

		let results = [];

		for(let i = 0; i < players.length; i++){
			let p = players[i];
			if(compare(p[status])){
				results.push(p);
			}
		}
		if(results.length && sort){
			results.sort(
				(a, b) => {
					if(a[status] == b[status])
						return 0;
					else if(a[status] > b[status])
						return 1;
					else
						return -1;
				}
			);
		}
		return results;
	}

	//Тоже, что и getWith, только возвращается первый результат
	getWithFirst(status, value, players){
		return this.getWith(status, value, false, players)[0];
	}

	//Активные
	get active(){
		return this.getWith('active', true);
	}
	set active(players){
		this.set('active', false);
		if(players.length)
			this.set('active', true, players);
	}
	setActive(players){
		this.set('active', true, players);
	}

	//Неактивные
	get inactive(){
		return this.getWith('active', false);
	}
	set inactive(players){
		this.set('active', true);
		if(players.length)
			this.set('active', false, players);
	}
	setInactive(players){
		this.set('active', false, players);
	}


	//Действующие
	get working(){
		return this.getWith('working', true);
	}
	set working(players){
		this.set('working', false);
		if(players.length)
			this.set('working', true, players);
	}
	setWorking(players){
		this.set('working', true, players);
	}

	//Атакующие до перевода
	get originalAttackers(){
		return this.getWith('originalAttacker', (val) => !!val, true);
	}
	set originalAttackers(players){
		this.set('originalAttacker', false);
		this.setOriginalAttackers(players);
	}
	setOriginalAttackers(players){
		let last = this.originalAttackers.length + 1;
		if(players.length){
			for(let pi = 0; pi < players.length; pi++){
				let p = players[pi];
				this.set('originalAttacker', last, [p]);
				last++;
			}
		}
	}

	//Счеты
	get scores(){
		let scores = {};
		for(let pi = 0; pi < this.length; pi++){
			let p = this[pi];
			scores[p.id] = p.score;
		}
		return scores;
	}


	//РОЛИ

	getWithRole(role){
		return this.getWithFirst('role', role);
	}

	setRole(player, role){
		if(this[role])
			this.set('role', null, this[role]);

		if(player)
			this.set('role', role, [player]);
	}

	get attacker(){
		return this.getWithRole('attacker');
	}
	set attacker(p){
		this.setRole(p, 'attacker');
	}

	get defender(){
		return this.getWithRole('defender');
	}
	set defender(p){
		this.setRole(p, 'defender');
	}

	get ally(){
		return this.getWithRole('ally');
	}
	set ally(p){
		this.setRole(p, 'ally');
	}
}

module.exports = GamePlayersBase;