/**
 * Обработчик списков действий с задержкой.  
 * Списки действий - односторонние списки.
 * Добавленные в список действия выполняются через заданное время, убирая себя из списка.  
 * @class
 * @example
 * // Сначла создается обработчик
 * var seq = new Sequencer();
 * // В функциях будут доступен объект с 4 методами для работы со списком:
 * // abort, finish, skip, append
 * func1(seq){
 * }
 * // ...
 * // Затем можно выполнять последовательности действий
 * seq.start(func1, 1000, context1)
 *    .then(func2, 1000, context2)
 *    .then(func3, 500, context3)
 */
var Sequencer = function(){
	this.timeout = null;
	this.inProgress = false;
	this.duration = 0;
	this.shouldSkip = false;
	this.nextAction = null;
	this.currentStep = null;
	this.dummyStep = {
		then: function(){},
		duration: 0
	}
};

/**
 * Завершает текущий список действий и создает новый.  
 * @param  {function} action первое действие, выполняется сразу
 * @param  {number} duration время выполнения действия
 * @param  {any} context  контекст выполнения действия
 * @return {object}  
 * Возвращает объект вида `{then, duration, action}`  
 * `then` - функция для добавления следующего действия.  
 * `duration` - время выполнения на момент добавления этого действия.  
 * `action` - действие, создаваемое через `then`.
 */
Sequencer.prototype.start = function(action, duration, context){	
	if(this.inProgress){
		this.finish();
	}
	this.inProgress = true;
	var step = {},
		newStep = this._add(step, action, duration, context);
	this.timeout = setTimeout(step.action.bind(this), 0);
	return newStep;
};

/**
 * Добавляет действие в конец текущего списка или создает новый.
 * @param  {function} action добавляемое действие
 * @param  {number} duration время выполнения действия
 * @param  {any} context  контекст выполнения действия
 * @return {object}  
 * Возвращает объект вида `{then, duration, action}`  
 * `then` - функция для добавления следующего действия.  
 * `duration` - время выполнения на момент добавления этого действия.  
 * `action` - действие, создаваемое через `then`.
 */
Sequencer.prototype.append = function(action, duration, context){
	if(this.inProgress){
		return this._add(this.currentStep, action, duration, context);
	}
	else{
		return this.start(action, duration, context);
	}
};

/** 
 * Добавляет действие в список
 * @private
 */
Sequencer.prototype._add = function(step, action, duration, context){
	if(!this.inProgress){
		console.warn('Sequencer: adding step to an expired sequence', this);
		return this.dummyStep;
	}
	if(duration < 0 || isNaN(duration)){
		duration = 0;
	}
	this.duration += duration;
	var newStep = this.currentStep = {
		then: null,
		action: null,
		duration: this.duration
	};
	newStep.then = this._add.bind(this, newStep);
	step.action = function(now){
		this._addNext(newStep);
		if(this.shouldSkip){
			this.shouldSkip = false;
			this.nextAction.call(this, now);
		}
		else{
			if(!now){
				this.timeout = setTimeout(this.nextAction.bind(this), duration);		
			}
			action.call(context || action, this._getMethods.call(this));
			if(now){
				this.nextAction.call(this, now);
			}
		}
	};
	return newStep;
}

/**
 * Сохраняет следующее действие
 * @private
 */
Sequencer.prototype._addNext = function(step){
	this.nextAction = function(now){
		if(typeof step.action == 'function'){
			step.action.call(this, now);
		}
		else{
			this.abort();
		}
	}
};


Sequencer.prototype._getMethods = function(){
	return {
		abort: this.abort.bind(this),
		finish: this.finish.bind(this),
		skip: this.skip.bind(this),
		append: this.append.bind(this)
	}
};
 

/** Выполняет все действия из текущего списка без задержек */
Sequencer.prototype.finish = function(){
	if(!this.inProgress || this.finishing)
		return;
	this.finishing = true;
	this.nextAction.call(this, true);
};

/** Отменяет выполнение всех невыполненых действий и обнуляет список */
Sequencer.prototype.abort = function(){
	clearTimeout(this.timeout);
	this.timeout = null;
	this.inProgress = false;
	this.duration = 0;
	this.shouldSkip = false;
	this.nextAction = null;
	this.currentStep = null;
};

/** Пропускает следующее действие в списке */
Sequencer.prototype.skip = function(){
	this.shouldSkip = true;
};

//Test
var sequence = new Sequencer();
function addSeq(seq, shouldStop){	
	function action0(seq){
		console.log('step0', this)
	}
	function action1(seq){
		console.log('step1', this)
		seq.append(action3, 1000).then(action3)
	}
	function action2(seq){
		console.log('step2', this)
	}
	function action3(seq){
		console.log('step3', this)
	}
	var seq0 = sequence
		.start(action0, 1000)
		.then(action1, 2000)
		.then(action2, 1500);
	return seq0
}