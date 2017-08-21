/**
* Менеджер очередей анимаций.  
* Позволяет выполнять действия с задержкой и управлять очередью изнутри выполняемых действий.  
* Добавление действия (`queueUp`) возвращает объект с функцией `then`, 
* которая позволяет добавлять следующее действие и т.д.  
* Добавленные таким образом действия считаются одной очередью.
* Вызов queueUp снова создаст новую очередь.  
* Из добавляемых действий можно добавлять дополнительные действия (вложенность неограничена)
* при помощи функции `append`, передаваемой в действия вместе с еще несколькими.
* `append` также возвращает `then`.  
* Вызов `append` создает новую очередь, которая будет выполнена сразу после очереди,
* из действия которой был вызван `append`.  
* Помимо `append` передаются следующие действия:  
* `abort()` - прерывает текущую очередь и все вложенные в нее очереди  
* `skip(num)` - будет пропущено `num` следующих действий в текущей очереди  
* @class
* @param {function} onComplete
* @param {boolean} inDebugMode
* @example
* // Функции выполнятся в порядке нумерации с интервалом в 500мс
*
* var sequence = new Sequencer2();
*
* function action0(){};
* function action1(seq){
* 	seq.append(action3)
* };
* function action2(){};
* function action3(){};
* function action4(){};
* 
* sequence.queueUp(action0, 500)
* 	.then(action1, 500)
* 	.then(action2, 500);
* 	
* sequence.queueUp(action4, 500);
*
* @example
* // Способы указания длительности действия
*
* // Аргумент
* sequence.queueUp(action0, 500);
*
* // Возвращается из действия
* function action1(){
* 	return 500;
* } 
* sequence.queueUp(action1);
*
* // Вместо действия
* sequence.queueUp(500);
*
* // Если указать аргументом и возвратить из функции
* // будет использован аргумент
* function action2(){
* 	return 1000;
* }
* sequence.queueUp(action2, 500); // длительность будет 500
* 
*/
var Sequencer2 = function(onComplete, inDebugMode){

	/**
	* Метод, выполняемый по завершению всех очередей.
	* @type {function}
	*/
	this.onComplete = onComplete;

	if(typeof this.onComplete != 'function'){
		this.onComplete = function(){};
	}

	/**
	* Будут ли выводиться сообщения о выполняемых действиях в консоль.
	* @type {Boolean}
	*/
	this.inDebugMode = inDebugMode || false;	

	/**
	* Все очереди.
	* @type {Array}
	*/
	this._queue = [];

	/**
	* Еще не добавленные в массив очередей вложенные очереди. 
	* @type {Array}
	*/
	this._nestedQueue = [];

	/**
	* Если `true` очередь выполнится линейно (без `setTimeout`).
	* @type {Boolean}
	*/
	this._isSync = false;

	/**
	* Кол-во шагов, которые будут пропущены в текущей очереди.
	* @type {Number}
	*/
	this._skips = 0;

	/**
	* Была ли прервана очередь.
	* @type {Boolean}
	*/
	this._wasAborted = false;
};

Sequencer2.prototype = {

	/**
	* Создает новую очередь с действием, добавляет ее после всех очередей.
	* Запускает очередь, если она была пустой.
	* @param {function} action   Действие. При выполнении в него передадутся два параметра:  
	*                            `seq` - набор методов для управлением очередью (`append, abort, skip`)  
	*                            `sync` - выполняется ли очередь в реальном времени (на очереди был вызван метод finish)
	* @param {number}   duration Длительность действия. Может быть передана вместо действия или быть возвращена действием.
	* @param {object}   context  контекст действия
	*
	* @return {object} Объект для добавления действий `{then}`.
	*/
	queueUp: function(action, duration, context){
		return this._addQueue(this._queue, action, duration, context);
	},

	/** 
	* Завершает все очереди синхронно.
	* @param  {boolean} [disableOnComplete] `onComplete` метод не будет выполнен
	*/
	finish: function(disableOnComplete){
		this._disableOnComplete = disableOnComplete || false;
		this._resetTimeout();
		this._isSync = true;
		this._go();
	},

	/** 
	* Прерывает все очереди.
	* @param  {boolean} [disableOnComplete] `onComplete` метод не будет выполнен
	*/
	abort: function(disableOnComplete){
		this._log('aborted');
		this._disableOnComplete = disableOnComplete || false;
		this._nestedQueue.length = null;
		this._queue.length = 0;
		this._resetFull();
	},

	/** 
	* Прерывает указанную очередь изнутри действия.
	* @param  {object} queue очередь, которую нужно прервать
	*/
	_abort: function(queue){
		if(this.inDebugMode){
			console.log(
				'aborted', 
				queue.map(function(s){return s.name;}), 
				this._nestedQueue.map(function(s){return s.name;})
			);
		}
		this._nestedQueue.length = null;
		queue.length = 0;
		this._wasAborted = true;
		this._reset();
	},

	/** Ресетит таймаут. */
	_resetTimeout: function(){
		clearTimeout(this.timeout);
		this.timeout = null;
	},

	/** Ресетит очередь. */
	_reset: function(){
		this._resetTimeout();
		this._skips = 0;
	},

	/** 
	* Ресетит очередь, включая статус завершения.
	* Выполняет `onComplete` менеджера, если не был установлен флаг пропуска `onComplete`.
	* Убирает флаг пропуска `onComplete`.
	*/
	_resetFull: function(){
		this._reset();
		this._isSync = false;
		if(!this._disableOnComplete){
			this.onComplete();
		}
		this._disableOnComplete = false;
	},

	/**
	* Пропускает указанное кол-во шагов текущей очереди.
	* @param  {number} num кол-во пропускаемых шагов
	*/
	_skip: function(num){
		if(typeof num != 'number' || isNaN(num)){
			num = 1;
		}
		this._skips += num;
	},

	/**
	* Добавляет новую очередь с новым действием в очередь.
	* @param {object}   queueHolder очередь, в которую будет добавлена новая очередь
	* @param {function} action      действие
	* @param {number}   duration    длительность действия
	* @param {object}   context     контекст действия
	*
	* @return {object} Объект для добавления действий `{then}`.
	*/
	_addQueue: function(queueHolder, action, duration, context){
		var queue = [];
		var next = this._addStep(queue, action, duration, context);
		queueHolder.push(queue);
		if(!this.timeout && !this._isSync){
			this.timeout = setTimeout(this._go.bind(this), 0);
		}
		return next;
	},

	/**
	* Добавляет новое действие в очередь.
	* @param {object}   queue    очеред, в которую будет добавлено действие
	* @param {function} action   действие
	* @param {number}   duration длительность действия
	* @param {object}   context  контекст действия
	*
	* @return {object} Объект для добавления действий `{then}`.
	*/
	_addStep: function(queue, action, duration, context){
		var step = {
			action: action,
			name: action && (action.name || action._name),
			duration: duration,
			context: context,
			next: {
				then: this._addStep.bind(this, queue)
			}	
		};
		queue.push(step);
		return step.next;
	},

	/** Запускает выполнение действий. */
	_go: function(){
		// jshint curly:false
		while(this._next());
	},

	/** 
	* Выполняет текущее действие в очереди и запускает таймаут следующего.
	* @return {boolean} Возвращает нужно ли запустить функцию снова.
	*/
	_next: function(){

		// console.log(JSON.stringify(this._queue, null, '    '))
		
		// Больше нет очередей, ресетим менеджер и завершаем
		var queue = this._queue[0];
		if(!queue){
			this._log('ended');
			this._resetFull();
			return false;
		}

		// В текущей очереди нет действий, удаляем ее,
		// добавляем вложенные очереди в основную очередь и переходим к след. очереди
		var step = queue[0];
		if(!step){
			this._skips = 0;
			this._queue.shift();
			this._appendNestedQueue();
			return true;
		}

		// Убираем текущий шаг из очереди
		queue.shift();

		// Пропускаем действие, если указаны пропуски
		if(this._skips !== 0){
			this._log(step.name, 'skipped');
			this._skips--;
			return true;
		}

		// Вызываем действие текущего шага
		var duration = this._executeAction(step, queue);

		// Если очередь была прервана из действия, переходим к след. очереди
		if(this._wasAborted){
			this._log(step.name);
			this._wasAborted = false;
			return true;
		}

		// Переходим к след. шагу с указанной задержкой
		if(!this._isSync){
			this._log(step.name, duration);
			this._resetTimeout();
			this.timeout = setTimeout(this._go.bind(this), duration);
			return false;
		}

		// Переходим к след. шагу без задержки
		this._log(step.name);
		return true;
	},

	/** Добавляет вложенную очередь в начало последовательности. */
	_appendNestedQueue: function(){
		for(var i = this._nestedQueue.length - 1; i >= 0; i--){
			this._queue.unshift(this._nestedQueue[i]);
		}
		this._nestedQueue.length = 0;
	},

	/**
	* Выполняет действие, если оно есть.
	* @param {object} step  шаг, к которому пренадледит действие
	* @param {array}  queue очередь, к которой пренадлежит шаг
	*
	* @return {number} длительность действия
	*/
	_executeAction: function(step, queue){
		var duration;
		if(typeof step.action == 'function'){
			duration = step.action.call(step.context || null, this._getMethods(queue), this._isSync);
		}
		else if(typeof step.action == 'number' && !isNaN(step.action)){
			duration = step.action;
		}

		if(typeof step.duration == 'number' && !isNaN(step.duration)){
			duration = step.duration;
		}

		if(typeof duration != 'number' || isNaN(duration)){
			duration = 0;
		}
		return duration;
	},

	/**
	* Возвращает методы, которые можно вызывать из действий для управления очередью.
	* @param {array} queue очередь, которую можно завершить
	*/
	_getMethods: function(queue){
		return {
			append: this._addQueue.bind(this, this._nestedQueue),
			abort: this._abort.bind(this, queue),
			skip: this._skip.bind(this)
		};
	},

	/** Выводит аргументы в лог, если менеджер находится в режиме дебага. */
	_log: function(){
		if(this.inDebugMode){
			console.log.apply(console, arguments);
		}
	}
};

// jshint unused:false
function testSequence(){
	var time = 500;
	var seq = new Sequencer2(function(){console.log('done');}, true);
	function action0(seq){
		seq.append(func('14', action1), time).then(func('14.5'), time);
	}
	function action1(seq){
		seq.abort();
		seq.append(action3, time).then(action4, time);

	}
	function action2(seq){
	}
	function action3(seq){
		seq.skip(1);
		seq.append(action5, time);
	}
	function action4(seq){
		return 1000;
	}
	function action5(seq){
		
	}
	function action6(seq){
		
	}

	function func(name, action){
		var func = action || function(){};
		func._name = name;
		return func;
	}
	seq.queueUp(func('1', action4));
	seq.queueUp(func('2', action3), time).then(func('2.5'), time).then(func('2.75'), time);
	seq.queueUp(time).then(func('3'), time);
	seq.queueUp(func('11'), time)
		.then(func('12', action0), time)
		.then(func('13'), time);
	seq.queueUp(func('15'), time);
	seq.queueUp(func('16'), time);
	seq.queueUp(func('17'), time);
	seq.queueUp(func('18'), time);
	seq.queueUp(func('19'), time);
	seq.queueUp(func('20'), time);
	seq.queueUp(func('21'), time);
	seq.queueUp(func('22'), time);
	seq.queueUp(func('23'), time);
	seq.finish(true);
	return seq;
}
