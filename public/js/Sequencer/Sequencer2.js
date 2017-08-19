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
		this.duration += duration;
		var step = {
			action: action,
			name: action.name,
			duration: duration || 0,
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

		var logs = [step.action.name];

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

