/**
* Добавляет действие в список.
* @private
* @param {object} step     
* @param {function} action   
* @param {(number|function)} duration 
* @param {any} context  
* @return {object}
*/
Sequencer.prototype._add = function(step, action, duration, context){
	if(!this.inProgress){
		console.warn('Sequencer: adding step to an expired sequence', this);
		return this._dummyStep;
	}

	if(duration < 0 || isNaN(duration)){
		duration = 0;
	}

	this.duration += duration;

	// Время до выполнения действия от начала последовательности
	var fullDuration = this.duration;

	// Новый элемент списка
	var newStep = this._currentStep = {
		then: null,
		wrapper: null,
		duration: this.startTime + fullDuration - this._skippedTime - Date.now()
	};
	newStep.then = this._add.bind(this, newStep);

	// Добавляем враппер действия текущего элементу в списке
	step.wrapper = function(){

		if(!this._shouldSkip && this.inDebugMode){
			console.log(action.name, Date.now() - this.startTime, this.duration);
		}

		// Создаем функцию, вызывающую враппер действия следующего элемента в списке
		this._nextAction = function(){
			if(typeof newStep.wrapper == 'function'){
				newStep.wrapper.call(this);
			}
			else{
				this.abort();
			}
		};

		// Пропуск текущего шага
		if(this._shouldSkip > 0){
			if(this.inDebugMode){
				console.log('skipped', duration);
			}
			this._skippedTime += duration;
			this._shouldSkip--;
			this._nextAction.call(this);
		}
		else{
			// Устанавливаем таймаут перед выполнением враппера действия следующего элемента в списке
			if(!this._finishing && this._nextAction){
				this._timeout = setTimeout(
					this._nextAction.bind(this),
					Math.max( this.startTime - this._skippedTime + fullDuration - Date.now(), 0 )
				);		
			}
			// Вызываем текущее действие
			action.call(context || action, this._getMethods.call(this));
			// Выполнение враппера действия след. элемента, если список выполняется без задержек
			if(this._finishing && this._nextAction){
				this._nextAction.call(this);
			}
		}
	};
	return newStep;
}; 

/** 
* Запускает новый список, предварительно завершив предыдущий, сохраняя статус завершения.
* @private
* @param {function} action
* @param {(number|function)} duration
* @param {number} delay
* @param {any} context
* @return {object} 
*/
Sequencer.prototype._startFinishing = function(action, duration, delay, context){
	var finishing = this._finishing;
	this._finishing = false;

	// Завершаем действия и восстанавливаем статус завершения, если он был установлен
	if(finishing){
		this.finish();
		this._finishing = true;
	}

	var step = this.start(action, duration, delay, context);

	// Восстанавливаем статус завершения, если он не был установлен
	if(!finishing){
		this._finishing = false;
	}
	return step;
};

/** 
* Добавляет действие в конец текущего списка или запускает новый, сохраняя статус завершения.
* @private
* @param {function} action
* @param {(number|function)} duration
* @param {any} context
* @return {object} 
*/
Sequencer.prototype._appendFinishing = function(action, duration, context){	
	var finishing = this._finishing;

	var step = this.append(action, duration, context);

	// Продолжаем завершение действий, если статус завершения был установлен.
	if(finishing && !this._finishing){
		this.finish();
	}

	return step;
};

/**
* Отменяет выполнение всех невыполненых действий и обнуляет список, сохраняя статус завершения.
* @private
*/
Sequencer.prototype._abortFinishing = function(){	
	var finishing = this._finishing;

	this.abort();

	// Восстанавливаем статус завершения, если он был установлен.
	if(finishing){
		this._finishing = true;
	}
};

/**
* Возвращает специальные варианты основных методов,
* которые позволяют правильно обрабатывать вложенные списки.
* @private
* @return {object<function>}
* `{start, append, abort, finish, skip, unskip}`
*/
Sequencer.prototype._getMethods = function(){
	return {
		start: this._startFinishing.bind(this),
		append: this._appendFinishing.bind(this),
		abort: this._abortFinishing.bind(this),
		finish: this.finish.bind(this),
		skip: this.skip.bind(this),
		unskip: this.unskip.bind(this)
	};
};
