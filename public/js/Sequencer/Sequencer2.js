/**
* Менеджер очередей анимаций.  
* Позволяет выполнять действия с задержкой и управлять очередью изнутри выполняемых действий.  
* Добавление действия (`queueUp`) возвращает объект с функцией `then`, 
* которая позволяет добавлять следующее действие и т.д.  
* Добавленные таким образом действия считаются одной очередью.
* Помимо `then` в возвращенном объекте будет `duration`, равная длительности всех текущих очередей.  
* Вызов queueUp снова создаст новую очередь.  
* Из добавляемых действий можно добавлять дополнительные действия (вложенность неограничена)
* при помощи функции `append`, передаваемой в действия вместе с еще несколькими.
* `append` также возвращает `then`.  
* Вызов `append` создает новую очередь, которая будет выполнена сразу после очереди,
* из действия которой был вызван `append`.  
* Помимо `append` передаются следующие действия:  
* `abort()` - прерывает текущую очередь и все вложенные в нее очереди  
* `skip(num)` - будет пропущено `num` следующих действий в текущей очереди  
* `finish()` - очередь переходит в режим линейного завершения (без `setTimeout`) (влияет на ВСЕ очереди)
* @class
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
* sequence
* 	.queueUp(action0, 500)
* 	.then(action1, 500)
* 	.then(action2, 500);
* 	
* sequence
* 	.queueUp(action4, 500);
*/
var Sequencer2 = function(inDebugMode){

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
	* Время начала очереди.
	* @type {Number}
	*/
	this._startTime = 0;

	/**
	* Предпологаемая длительность очереди от времени начала.
	* @type {Number}
	*/
	this.duration = 0;

	/**
	* Время между началом очереди до последнего выполненного действия.
	* @type {Number}
	*/
	this._dt = 0;

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
};

Sequencer2.prototype = {

	/**
	* Создает новую очередь с действием, добавляет ее после всех очередей.
	* Запускает очередь, если она была пустой.
	* @param {function} action   Действие. При выполнении в него передадутся два параметра:  
	*                            `seq` - набор методов для управлением очередью (`append, abort, skip, finish`)  
	*                            `sync` - выполняется ли очередь в реальном времени (на очереди был вызван метод finish)
	* @param {number}   duration длительность действия
	* @param {object}   context  контекст действия
	*
	* @return {object} Объект для добавления действий `{then, duration}`.
	*/
	queueUp: function(action, duration, context){
		return this._addQueue(this._queue, action, duration, context);
	},

	/** Завершает очередь синхронно. */
	finish: function(){
		this._resetTimeout();
		this._isSync = true;
		this._go();
	},

	/** Завершает очередь изнутри действия. */
	_finish: function(){
		this._resetTimeout();
		this._isSync = true;
	},

	/** Прерывает очередь. */
	abort: function(){
		this._nestedQueue.length = null;
		this._queue.length = 0;
		this._resetFull();
	},

	/** 
	* Прерывает очередь изнутри действия.
	* @param  {object} queue очередь, которую нужно прервать
	*/
	_abort: function(queue){
		this._nestedQueue.length = null;
		queue.length = 0;
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
		this._startTime = 0;
		this._dt = 0;
		this.duration = 0;
		this._skips = 0;
	},

	/** Ресетит очередь, включая статус завершения.	*/
	_resetFull: function(){
		this._reset();
		this._isSync = false;
	},

	/**
	* Пропускает указанное кол-во шагов текущей очереди.
	* Не влияет на общую `duration` очереди.
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
	* @return {object} Объект для добавления действий `{then, duration}`.
	*/
	_addQueue: function(queueHolder, action, duration, context){
		var queue = [];
		var next = this._addStep(queue, action, duration, context);
		queueHolder.push(queue);
		if(!this.timeout && !this._isSync){
			this._startTime = Date.now();
			this._dt = 0;
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
	* @return {object} Объект для добавления действий `{then, duration}`.
	*/
	_addStep: function(queue, action, duration, context){
		if(typeof duration != 'number' || isNaN(duration)){
			duration = 0;
		}
		this.duration += duration;
		var step = {
			action: action,
			name: action && (action.name || action._name),
			duration: duration,
			context: context,
			next: {
				duration: this.duration,
				then: this._addStep.bind(this, queue)
			}	
		};
		queue.push(step);
		return step.next;
	},

	/** Выполняет текущее действие в очереди и запускает таймаут следующего. */
	_go: function(){
		//console.log(JSON.stringify(this._queue, null, '    '))
		var queue = this._queue[0];
		// Больше нет действий
		if(!queue){
			if(this.inDebugMode){
				console.log('ended');
			}
			this._resetFull();
			return;
		}

		var step = queue[0];
		// В текущей очереди нет действий, удаляем ее,
		// добавляем вложенные очереди в основную очередь и переходим к след. очереди
		if(!step){
			this._skips = 0;
			this._queue.shift();
			for(var i = this._nestedQueue.length - 1; i >= 0; i--){
				this._queue.unshift(this._nestedQueue[i]);
			}
			this._nestedQueue.length = 0;
			this._go();
			return;
		}

		// Убираем выполненный шаг из очереди
		queue.shift();

		var logs;
		if(this.inDebugMode){
			logs = [step.name];
		}

		if(this._skips !== 0){
			if(logs){
				console.log('skipped', logs[0]);
			}
			this._skips--;
			this._go();
			return;
		}

		// Переходим к след. шагу с указанной задержкой
		if(!this._isSync){
			// Длина шага с корректировкой
			var duration = this._startTime + this._dt + step.duration - Date.now();

			if(logs){
				logs.push(duration);
				logs.push(this._dt);
			}

			this._dt += step.duration;

			this._resetTimeout();
			this.timeout = setTimeout(this._go.bind(this), duration);
		}

		if(logs){
			console.log.apply(console, logs);
		}

		// Вызываем действие текущего шага
		if(typeof step.action == 'function'){
			step.action.call(step.context || null, this._getMethods(queue), this._isSync);
		}

		if(this._isSync){
			this._go();
		}
	},

	/**
	* Возвращает методы, которые можно вызывать из действий для управления очередью.
	* @param {array} queue очередь, которую можно завершить
	*/
	_getMethods: function(queue){
		return {
			append: this._addQueue.bind(this, this._nestedQueue),
			abort: this._abort.bind(this, queue),
			finish: this._finish.bind(this),
			skip: this._skip.bind(this)
		};
	}
};

// jshint unused:false
function testSequence(){
	var seq = new Sequencer2();
	function action0(seq){
		seq.append(func('14', action1), 5000);
	}
	function action1(seq){
		seq.abort();
		//seq.append(action3, 1000).then(action4, 1000)

	}
	function action2(seq){
	}
	function action3(seq){
		seq.skip(1);
		seq.append(action5, 1000);
	}
	function action4(seq){
		
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
	seq.queueUp(func('1'), 1000);
	seq.queueUp(func('2', action3), 1000).then(func('2.5'), 1000).then(func('2.75'), 1000);
	seq.queueUp(func('3'), 1000);
	seq.queueUp(func('4'), 1000);
	seq.queueUp(func('5'), 1000);
	seq.queueUp(func('6'), 1000);
	seq.queueUp(func('7'), 1000);
	seq.queueUp(func('8'), 1000);
	seq.queueUp(func('9'), 1000);
	seq.queueUp(func('10'), 1000);
	seq.queueUp(func('11'), 1000)
		.then(func('12', action0), 500)
		.then(func('13'), 500);
	seq.queueUp(func('15'), 1000);
	seq.queueUp(func('16'), 1000);
	seq.queueUp(func('17'), 1000);
	seq.queueUp(func('18'), 1000);
	seq.queueUp(func('19'), 1000);
	seq.queueUp(func('20'), 1000);
	seq.queueUp(func('21'), 1000);
	seq.queueUp(func('22'), 1000);
	seq.queueUp(func('23'), 1000);
}