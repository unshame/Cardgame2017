var Sequencer2 = function(){
	this._queue = [];
	this._nestedQueue = [];

	this._startTime = 0;
	this.duration = 0;

	this._isSync = false;
};

Sequencer2.prototype = {
	queueUp: function(action, duration, context){
		var queue = this._addQueue(this._queue, action, duration, context);
		return queue[0];
	},

	finish: function(){
		this._resetTimeout();
		this._isSync = true;
		this._go();
	},

	abort: function(){
		this._abort(this._queue);
	}

	_resetTimeout: function(){
		clearTimeout(this.timeout);
		this.timeout = null;
	},

	_reset: function(){
		this._resetTimeout();
		this._isSync = false;
	},

	_addQueue: function(queueHolder, action, duration, context){
		var queue = [];
		this._startTime = Date.now();
		this._dt = 0;
		var step = this._addStep(queue, action, duration, context);
		queueHolder.push(queue);
		if(!this.timeout && !this._isSync){
			this.timeout = setTimeout(this._go.bind(this), 0);
		}
		return queue;
	},

	_addStep: function(queue, action, duration, context){
		var step = {
			action: action,
			duration: duration,
			context: context,
			then: this._addStep.bind(this, queue)
		};
		queue.push(step);
		return step;
	},

	_go: function(){
		//console.log(this._log())
		var queue = this._queue[0];
		
		// Больше нет действий
		if(!queue){
			this._isSync = false;
			clearTimeout(this.timeout);
			console.log('done');
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

		// Длина шага с корректировкой
		var duration = this._startTime + this._dt + step.duration - Date.now();
		
		console.log(step.action.name, duration, this._startTime, this._dt);

		this._dt += step.duration;

		// Переходим к след. шагу с указанной задержкой
		if(!this._isSync){
			this._resetTimeout();
			this.timeout = setTimeout(this._go.bind(this), duration);
		}

		// Вызываем действие текущего шага
		step.action.call(step.context || null, this._getMethods(queue));

		if(this._isSync){
			this._go()
		}
	},

	_finish: function(){
		this._resetTimeout();
		this._isSync = true;
	},

	_abort: function(queue){
		this._nestedQueue.length = null;
		queue.length = 0;
		this._reset();
	},

	_getMethods: function(queue){
		return {
			append: this._addQueue.bind(this, this._nestedQueue),
			abort: this._abort.bind(this, queue),
			finish: this._finish.bind(this)
		};
	},

	_log: function(){
		var str = '';
		this._queue.forEach(function(q, n){
			q.forEach(function(s, i){
				if(i !== 0){
					str += ' -> ';
				}
				str += (!n && !i) ? '>' + s.action.name + '<' : s.action.name ;
			});
			str += '\n';
		});
		if(str.length > 1){
			str = '===========\n' + str + '===========';
		}
		return str;
	}

};

