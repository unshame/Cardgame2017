/**
* Сохраняет информацию о твине, который нужно будет запустить.
* @param  {string} key           уникальное имя информации
* @param  {arguments} args       аргументы, которые будут переданы функции запуска твина
* @param  {number} durationIndex индекс длительности твина в `args`. 
*                                Будет изменено непосредственно в переданных аргументах.
* @param  {number} delayIndex    индекс задержки твина в `args`. 
*                                Будет обнулено непосредственно в переданных аргументах.
* @private
*/
Card.prototype._saveDelayedTweenInfo = function(key, args, durationIndex, delayIndex){
	var startTime = Date.now() + args[delayIndex];

	// Обнуляем задержку
	args[delayIndex] = 0;

	// Запоминаем настройки движения
	this._delayedTweenInfos[key] = {
		startTime: startTime,
		args: args,
		durationIndex: durationIndex
	};

	if(this.inDebugMode){
		console.log('Card: Saved', key, 'info', this.id, this._delayedTweenInfos[key]);
	}
};

/**
* Удаляет информацию о твине.
* @param  {string} key уникальное имя информации
* @private
*/
Card.prototype._removeDelayedTweenInfo = function(key){
	if(this._delayedTweenInfos[key]){
		delete this._delayedTweenInfos[key];
	}
};

/**
* Запускает функцию, запускающую твин с сохраненными аргументами.
* @param  {string}   key 	уникальное имя информации о твине
* @param  {function} func 	функция, которая будет вызывана
* @private
*/
Card.prototype._tryStartDelayedTween = function(key, func){
	var info = this._delayedTweenInfos[key];
	if(!info || info.startTime > Date.now())
		return;

	info.args[info.durationIndex] -= Date.now() - info.startTime;
	delete this._delayedTweenInfos[key];
	func.apply(this, info.args);
	if(this.inDebugMode){
		console.log('Card: Used', key, 'info', this.id, info);
	}
};