/**
* Обработчик списков действий с задержкой.  
* Списки действий - односторонние списки.
* Добавленные в список действия выполняются через заданное время, сдвигая текущий элемент списка.  
* Действия выполняются при помощи `setTimeout`, кроме как после вызова {@link Sequencer#finish}.  
* Все методы манипуляции списком могут быть вызваны из действий списка.  
* При вызове методов обработчика из действий:  
* * `start` - завершает текущий список без задержек, запускает вложенный список  
* * `append` - добавляет действие в конец текущего списка, либо запускает вложенный список  
* * `finish` - убирает все задержки, включая добавленные в будущем вложенные списки  
* * `abort` - останавливает текущий список и добавленные вложенные, не влияет на добавленные в будущем списки  
* * `skip` - пропускает заданное количество действий вне зависимости от вложенности списка,
* но перестает пропускать, если новый вложенный список был добавлен  
* * `unskip` - работает как обычно
* @class
* @example
* // Сначала создается обработчик
* var seq = new Sequencer();
* // В функциях будут доступны основные методы обработчика:
* // abort(), finish(), start(), append(), skip(), unskip()
* func1(s){
* }
* // ...
* // Затем можно выполнять последовательности действий
* seq.start(func1, 1000, 0, context1)
*    .then(func2, 1500, context2)
*    .then(func3, 500, context3);
* // func1 сразу -> func2 через 1000 -> func3 через 1500
* // seq.duration == 3000
* @example <caption>Вызов методов из действий</caption>
* // action1 выполнится
* function action0(s){
* 	s.abort()
* 	s.start(action1)
* }
* // action1 не выполнится
* function action0(s){
* 	s.start(action1)
* 	s.abort()
* }
* 
* // action1 выполнится без задержки в обоих случаях
* function action0(s){
* 	s.finish()
* 	s.start(action1)
* }
* function action0(s){
* 	s.start(action1)
* 	s.finish()
* }
*
* // Аналогично с append
*
* // action1 выполнится
* function action0(s){
* 	s.skip()
* 	s.start(action1)
* }
* // action1 не выполнится во всех следующих случаях
* function action0(s){
* 	s.start(action1)
* 	s.skip()
* }
* function action0(s){
* 	s.skip()
* 	s.append(action1)
* }
* function action0(s){
* 	s.append(action1)
* 	s.skip()
* }
*/
var Sequencer = function(inDebugMode){

	/**
	* Выполняется ли список.
	* @type {Boolean}
	*/
	this.inProgress = false;

	/**
	* Время выполнения текущего списка.
	* @type {Number}
	*/
	this.duration = 0;

	/**
	* Время начала текущего списка.
	* @type {Number}
	*/
	this.startTime = 0;

	/**
	* Время пропущенных шагов.
	* @type {Number}
	* @private
	*/
	this._skippedTime = 0;

	/**
	* Находится ли список в режиме выполнения без задержек.
	* @type {Boolean}
	* @private
	*/
	this._finishing = false;

	/**
	* Таймаут текущего действия.
	* @type {number}
	* @private
	*/
	this._timeout = null;

	/**
	* Кол-во пропускаемых действий.
	* @type {Number}
	* @private
	*/
	this._shouldSkip = 0;

	/**
	* Следующее действие.
	* @type {function}
	* @private
	*/
	this._nextAction = null;

	/**
	* Последний добавленный элемент списка.
	* @type {object}
	* @private
	*/
	this._lastStep = null;

	/**
	* Пустой элемент списка, чтобы вызов `then` не крашил игру.
	* @type {Object}
	* @private
	*/
	this._dummyStep = {
		then: function(){},
		duration: 0
	};


	this.inDebugMode = inDebugMode || false;
};

/**
* Запускает новый список, предварительно завершив предыдущий. 
* @param {function} action   первое действие, выполняется сразу
* @param {number}   duration время выполнения действия
* @param {number}   delay    задержка выполнения первого действия в списке
* @param {any}      context  контекст выполнения действия
*
* @return {object}
* Возвращает объект вида `{then, duration, wrapper}`  
* `then` - функция для добавления следующего действия.  
* `duration` - время выполнения на момент добавления этого действия.  
* `wrapper` - действие, создаваемое через `then`.
*/
Sequencer.prototype.start = function(action, duration, delay, context){	
	if(isNaN(delay) || delay < 0){
		delay = 0;
	}
	if(this.inProgress){
		this.finish();
	}

	this.inProgress = true;
	this._shouldSkip = 0;

	duration += delay;

	this.startTime = Date.now();
	
	// Добавляем первое действие в список
	var step = {},
		newStep = this._add(step, action, duration, context);

	// Выполняем первое действие с заданной задержкой
	this._nextAction = step.wrapper.bind(this);
	this._timeout = setTimeout(this._nextAction, delay);

	return newStep;
};


/**
* Добавляет действие в конец текущего списка или запускает новый.
* Запланированные пропуски действий влияют на добавленные таким образом действия.
* @param {function} action   добавляемое действие
* @param {number}   duration время выполнения действия
* @param {any}      context  контекст выполнения действия
*
* @return {object}
* Возвращает объект вида `{then, duration, wrapper}`  
* `then` - функция для добавления следующего действия.  
* `duration` - время выполнения на момент добавления этого действия.  
* `wrapper` - действие, создаваемое через `then`.
*/
Sequencer.prototype.append = function(action, duration, context){
	if(this.inProgress){
		return this._add(this._lastStep, action, duration, context);
	}
	else{
		var skips = this._shouldSkip;
		var step = this.start(action, duration, 0, context);
		this._shouldSkip = skips;
		return step;
	}
};

/** Выполняет все действия из текущего списка без задержек. */
Sequencer.prototype.finish = function(){
	if(!this.inProgress || this._finishing)
		return;
	if(!this._nextAction){
		console.error('Sequencer: finish called, inProgress but no nextAction', this);
		return;
	}
	this._finishing = true;
	this._nextAction.call(this);
};

/** Отменяет выполнение всех невыполненых действий и обнуляет список. */
Sequencer.prototype.abort = function(){
	clearTimeout(this._timeout);
	this._timeout = null;

	this.inProgress = false;
	this.duration = 0;
	this.startTime = 0;
	this._skippedTime = 0;

	this._finishing = false;
	this._shouldSkip = 0;
	this._nextAction = null;
	this._lastStep = null;
};

/** 
* Пропускает указанное количество следующих действий в списке.
* @param {number} [times=1] во пропускаемых действий
*/
Sequencer.prototype.skip = function(times){
	if(isNaN(times) || times < 0)
		times = 1;
	this._shouldSkip += times;
};

/**
* Отменяет запланированный пропуск действий.
*/
Sequencer.prototype.unskip = function(){
	this._shouldSkip = 0;
};

//@include:SequencerPrivate

// Test
// jshint ignore: start
var sequence = new Sequencer(true);
function addSeq(seq, shouldStop){
	var start = Date.now();
	function action0(seq){
		seq.append(action2, 1000).then(action3, 1000)
	}
	function action1(seq){
	}
	function action2(seq){
	}
	function action3(seq){
	}
	function action4(seq){
		seq.append(action2, 1000)
	}
	var seq0 = sequence
		.start(action0, 1000, 500)
		.then(action1, 1000)
		.then(action4, 1000);
	return seq0
};
