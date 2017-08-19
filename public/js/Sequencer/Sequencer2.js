var Sequencer2 = function(){
	this._queue = [];
	this._nestedQueue = [];

	this._startTime = 0;
	this.duration = 0;

	this._isSync = false;
};

Sequencer2.prototype = {
	queueUp: function(action, duration, context){
		return this._addQueue(this._queue, action, duration, context);
	},

	finish: function(){
		this._resetTimeout();
		this._isSync = true;
		this._go();
	},

	_finish: function(){
		this._resetTimeout();
		this._isSync = true;
	},

	abort: function(){
		this._nestedQueue.length = null;
		queue.length = 0;
		this._resetFull();
	},

	_abort: function(queue){
		this._nestedQueue.length = null;
		queue.length = 0;
		this._reset();
	},

	_resetTimeout: function(){
		clearTimeout(this.timeout);
		this.timeout = null;
	},

	_reset: function(){
		this._resetTimeout();
		this._startTime = 0;
		this.duration = 0;
	},

	_resetFull: function(){
		this._reset();
		this._isSync = false;
	},

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

	_addStep: function(queue, action, duration, context){
		if(typeof duration != 'number' || isNaN(duration)){
			duration = 0;
		}
		this.duration += duration;
		var step = {
			action: action,
			name: action.name || action._name,
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

	_go: function(){
		//console.log(JSON.stringify(this._queue, null, '    '))
		var queue = this._queue[0];
		// Больше нет действий
		if(!queue){
			this._resetFull();
			return;
		}

		var step = queue[0];
		// В текущей очереди нет действий, удаляем ее,
		// добавляем вложенные очереди в основную очередь и переходим к след. очереди
		if(!step){
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

		var logs = [step.name];

		// Переходим к след. шагу с указанной задержкой
		if(!this._isSync){
			// Длина шага с корректировкой
			var duration = this._startTime + this._dt + step.duration - Date.now();

			logs.push(duration);
			logs.push(this._dt);

			this._dt += step.duration;

			this._resetTimeout();
			this.timeout = setTimeout(this._go.bind(this), duration);
		}

		console.log.apply(console, logs);

		// Вызываем действие текущего шага
		step.action.call(step.context || null, this._getMethods(queue));

		if(this._isSync){
			this._go()
		}
	},

	_getMethods: function(queue){
		return {
			append: this._addQueue.bind(this, this._nestedQueue),
			abort: this._abort.bind(this, queue),
			finish: this._finish.bind(this)
		};
	}
};

function testSequence(){
	var seq = new Sequencer2();
	function action0(seq){
		seq.append(func('14', action1), 5000)
	}
	function action1(seq){
		seq.abort()
		//seq.append(action3, 1000).then(action4, 1000)

	}
	function action2(seq){
	}
	function action3(seq){
		seq.append(action5, 1000)
	}
	function action4(seq){
		
	}
	function action5(seq){
		
	}
	function action6(seq){
		
	}

	function func(name, action){
		var func = action || function(){}
		func._name = name;
		return func;
	}
	seq.queueUp(func('1'), 1000);
	seq.queueUp(func('2'), 1000);
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