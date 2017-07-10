/**
 * Класс, хранящий ссылки на игроков, участвующих в игре.
 * Предоставляет методы для получения игроков с определенными статусами и установки статусов.
 * 
 * Так как класс не хранит массивы с игроками, а составляет их по запросу, для повышения
 * производительности полученные массивы лучше сохранять в переменной и пользоваться ей.
 * Напрямую нужно обращаться только к игрокам по индексу (GamePlayersBase[index]).
 */

'use strict';

const
	BetterArray = requirejs('BetterArray.js');

class GamePlayers extends BetterArray{

	constructor(game, players){
		super();
		this.game = game;
		for(let i = 0; i < players.length; i++){
			let p = players[i];
			this.push(p);				
		}
	}

	static get [Symbol.species]() { return Array; }

	// Добавление игроков в массив
	push(p){
		p.game = this.game;
		super.push(p);
	}

	// Устанавливает статус по умолчанию игроку
	setStatuses(p, status){
		for(let key in status){
			if(status.hasOwnProperty(key))
				p[key] = status[key];
		}
	}

	// Игроки по id
	get byId(){
		return this.byKey('id');
	}

	// Возвращает id и имена игроков
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

	// СТАТУСЫ	
	
	/*
	 * Меняет статус игроков
	 * @status String - какой статус менять
	 * @value * - на что менять статус
	 * @players Player - у каких игроков менять статус
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

	setIncrementing(status, players){
		if(!players || !players.length)
			players = this;

		let last = this.getWith(status, val => !!val).length + 1;
		for(let pi = 0; pi < players.length; pi++){
			let p = players[pi];
			this.set(status, last, [p]);
			last++;
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

	// Тоже, что и getWith, только возвращается первый результат
	getWithFirst(status, value, players){
		return this.getWith(status, value, false, players)[0];
	}

	// РОЛИ

	getWithRole(role){
		return this.getWithFirst('role', role);
	}

	setRole(player, role){
		if(this[role])
			this.set('role', null, this[role]);

		if(player)
			this.set('role', role, [player]);
	}
}

module.exports = GamePlayers;