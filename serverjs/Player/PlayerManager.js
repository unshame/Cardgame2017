/**
* Класс, хранящий ссылки на игроков, участвующих в игре.
* Предоставляет методы для получения игроков с определенными статусами и установки статусов.
* 
* Так как класс не хранит массивы с игроками, а составляет их по запросу, для повышения
* производительности полученные массивы лучше сохранять в переменной и пользоваться ей.
* Напрямую нужно обращаться только к игрокам по индексу (GamePlayersBase[index]).
*/

'use strict';

const BetterArray = reqfromroot('BetterArray.js');


function valueToFunc(value){
	return (otherValue) => {
		return otherValue == value;
	};
}

class PlayerManager extends BetterArray{

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
		Object.seal(p);	// Предотвращаем добавление новых свойств игрокам
		super.push(p);
	}

	// Устанавливает статус по умолчанию игроку
	setStatuses(p, status){
		for(let key in status){
			if(status.hasOwnProperty(key)){
				p.statuses[key] = status[key];
			}
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

	// Выполняет action для каждого игрока из players,
	// только если игрок входит в игру
	// Чтобы остановить цикл, action должно возвратить true
	forEachOwn(action, players) {
		if(!action){
			return;
		}

		if(!players || !players.length){
			players = this;
		}

		for(let i = 0; i < players.length; i++){
			let p = players[i];
			if(this.includes(p) && p.game == this.game){
				if(action(p)){
					return;
				}
			}
			else{
				this.log.error(new Error(`Player isn't in this game ${p.id}`));
			}
		}
	}

	// СТАТУСЫ	
	
	/*
	* Меняет статус игроков
	* @status String - какой статус менять
	* @value * - на что менять статус
	* @players Player - у каких игроков менять статус
	*/
	set(status, value, players){

		this.forEachOwn((p) => {
			p.statuses[status] = value;
		}, players);
	}

	// Устанавливает цифру в status игрокам
	// Каждая новая цифра больше предыдущей установленной
	setIncrementing(status, players){

		let last = this.getWith(status, val => !!val).length + 1;
		this.forEachOwn((p) => {
			p.statuses[status] = last;
			last++;
		}, players);
	}

	/*
	* Возвращает массив с игроками с определенным статусом
	* @status String - какой статус сравнивать
	* @compare function\* - как или с чем сравнивать статус
	* @sort Boolean - нужно ли сортировать игроков по значению статуса
	* @players - опционально можно указать среди каких игроков выбирать
	*/
	getWith(status, compare, sort, players){

		if(typeof compare != 'function'){
			compare = valueToFunc(compare);
		}

		let results = [];

		this.forEachOwn((p) => {
			if(compare(p.statuses[status])){
				results.push(p);
			}
		}, players);

		if(results.length && sort){
			results.sort(
				(a, b) => {
					if(a.statuses[status] == b.statuses[status]){
						return 0;
					}
					else if(a.statuses[status] > b.statuses[status]){
						return 1;
					}
					else{
						return -1;
					}
				}
			);
		}
		return results;
	}

	// Тоже, что и getWith, только возвращается первый результат
	getWithFirst(status, compare, players){

		if(typeof compare != 'function'){
			compare = valueToFunc(compare);
		}

		let player = null;
		this.forEachOwn((p) => {
			if(compare(p.statuses[status])){
				player = p;
				return true;
			}
		}, players);

		return player;
	}

	getWithOwn(status, compare, players){

		if(typeof compare != 'function'){
			compare = valueToFunc(compare);
		}

		let results = [];

		this.forEachOwn((p) => {
			if(compare(p[status])){
				results.push(p);
			}
		}, players);

		return results;
	}

	// РОЛИ

	getWithRole(role){
		return this.getWithFirst('role', role);
	}

	setRole(player, role){
		if(this[role]){
			this.set('role', null, this[role]);
		}

		if(player){
			this.set('role', role, [player]);
		}
	}
}

module.exports = PlayerManager;