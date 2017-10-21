/*jshint unused:false*/

// Глобальные методы

/**
* Делает `constructor` подклассом `extendee` и
* копирует свойства прототипов классов из `shallowExtendees` в прототип `contrustor`.
* @param {function}   constructor
* @param {function}   extendees
* @param {function[]} [shallowExtendees]
* @global
*/
function extend(constructor, extendee, shallowExtendees){
	constructor.prototype = Object.create(extendee.prototype);
	constructor.prototype.constructor = constructor;
	if(!shallowExtendees){
		return;
	}
	var mixins = shallowExtendees.map(function(c){
		return c.prototype;
	});
	mixin(constructor, mixins);
}

/**
* Добавляет методы из `mixins` в прототип `constructor`.
* @param {function} constructor
* @param {object[]} mixins
* @global
*/
function mixin(constructor, mixins){
	for(var i = 0; i < mixins.length; i++){
		var mix = mixins[i];
		for(var key in mix){
			if(!mix.hasOwnProperty(key)){
				continue;
			}
			if(key == 'constructor'){
				continue;
			}
			if(constructor.prototype[key]){
				console.warn('Overwriting method', key, 'in', constructor, 'prototype');
			}
			constructor.prototype[key] = mix[key];
		}
	}
}

/**
* Возвращает прототип прототипа конструктора.
* @param {function} constructor
*
* @return {prototype}
* @global
*/
function supercall(constructor){
	return Object.getPrototypeOf(constructor.prototype);
}

/**
* Fisher–Yates Shuffle (перемешивание массивов).
* @global
* @param {array} a массив для перемешивания
*
* @return {array} перемешанный массив (тот же, что и на входе)
*/
function shuffleArray(a){
	var currentIndex = a.length,
		temporaryValue,
		randomIndex;

	// While there remain elements to shuffle...
	while (0 !== currentIndex) {

		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		// And swap it with the current element.
		temporaryValue = a[currentIndex];
		a[currentIndex] = a[randomIndex];
		a[randomIndex] = temporaryValue;
	}
	return a;
}

/**
* Совмещает свойства по умолчанию с неполностью указанными свойствами.  
* @global
* @param {object} dest   опции по умолчанию, которые нужно перезаписать
* @param {object} source опции, которыми нужно перезаписать
*
* @return {object} Возвращает объект, в котором свойства `dest` заменены на
*                  свойства `source`, если они существуют и там и там.         
*/
function mergeOptions(dest, source){
	if(typeof dest != 'object'){
		console.error('Can\'t merge options: no destination provided');
		return;
	}
	if(typeof source == 'object'){
		for(var o in source){
			if(source.hasOwnProperty(o) && dest.hasOwnProperty(o)){
				dest[o] = source[o];
			}
		}
	}
	return dest;
}

/**
* Возвращает функцию, которая будет добавлять действие в последовательность указанного {@link Sequencer}'a.
* @param {Sequencer} sequencer
* @param {any}       obj       объект, к которому принадлежит метод
* @param {string}    key       название метода на объекте
*
* @return {function}
*/
function getSequentialMethod(sequencer, obj, key){
	var method = obj[key];
	return function(){
		var args = [obj],
			len = arguments.length;
		for(var i = 0; i < len; i++) {
			args[i + 1] = arguments[i];
		}
		var binded = method.bind.apply(method, args);
		sequencer.queueUp(binded, 0);
	};
}

/**
* Добавляет нули перед строкой до указанного кол-ва.
* @global
* @param {string} str     строка
* @param {number} [len=2] желаемая длина строки длина
*
* @return {string} Полученная строка с нулями.
*/
function leadWithZeros(str, len){
	len = len || 2;
	return (Array(len).join('0') + str).slice(-len);
}

/**
* Конвертирует число в строку по типу `#000000`.
* @global
* @param {number} number число
*
* @return {string} Строка по типу `#000000`.
*/
function numberToHexColor(number){
	var string = leadWithZeros(number.toString(16), 6);
	string = '#' + string;
	return string;
}


// TEST AND DEBUG FUNCTIONS
var	getCard,
	getCards;

/**
* Выводит в консоль имена слоев интерфейса и сами слои
* @type {function}
* @global
* @see  {@link UI.Layers#getOrder}
*/
function printLayers(){
	console.table(ui.layers.getOrder());
}

/**
* Переносит самую левую карту в руке игрока на стол с задержкой.
* @param {number} [i=0]        id поля стола
* @param {number} [delay=3000] задержка
* @global
*/
function moveFirstPlayerCardToTable(i, delay){
	if(delay === undefined){
		delay = 3000;
	}
	var c = fieldManager.fields[gameInfo.pid].cards[0];
	var ci = {cid: c.id, suit: c.suit, value: c.value};
	setTimeout(function(){
		fieldManager.moveCards(fieldManager.fields['TABLE' + (i || 0)], [ci]);
	}, delay);
}

var animTest = {
	eventFeed: function(){
		for(var i = 0; i < 20; i++){
			eventFeed.newMessage(Math.random(), (20-i)*200);
		}
	},
	countdown: function(i, message){
		if(!i || typeof i != 'number' || isNaN(i) || i < 1){
			i = 5;
		}
		if(!message){
			message = 'GO!';
		}
		var start = Date.now();
		var last = 0;
		var interval = setInterval(function(){
			var now = Date.now();
			if(now - last >= 1000){
				last = now;
				switch(i){
					case 0:
					eventFeed.newMessage(message);
					break;

					case -1:
					eventFeed.clear();
					clearInterval(interval);
					break;

					default:
					eventFeed.newMessage(i + '...');
				}
				i--;
			}
		}, 50);
	}
};
