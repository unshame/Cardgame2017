/**
* Предоставляет методы для сохранения и загрузки настроек игры из `localStorage` бразуера.  
* Хранит настройки по умолчанию.
* @class
* @param {string} appName         название приложения, вместе с `containerName` используется
*                                 как ключ настроек в `localStorage`.
* @param {string} [containerName] название контейнера приложения (для нескольких приложений)
*/
var OptionManager = function(appName, containerName){

	/**
	* Настройки по умолчанию.
	* @type {object}
	*/
	this.defaults = this.getDefaults();
	
	/**
	* Ключ настроек в `localStorage`.
	* @type {string}
	*/
	this.localStorageKey = containerName ? (appName + '_' + containerName) : appName;
	
	/**
	* Текущие настройки.
	* @type {object}
	*/
	this.options = this.load();
};

OptionManager.prototype = {

	/**
	* Возвращает настройки по умолчанию.
	* @return {object}
	*/
	getDefaults: function(){
		return {
			// DEBUG
			'debug_game': false,
			'debug_cards': false,
			'debug_fields': false,
			'debug_grid': false,
			'debug_control': false,
			'debug_connection': false,
			'debug_buttons': true,

			'system_renderer': Phaser.AUTO,

			'game_scale': 1,
			'game_speed': 1,

			'appearance_skin': 'modern',
			'appearance_background': 'blue',
			'appearance_cardback': null,

			'ui_vignette': true,
			'ui_glow': true,
			'ui_sorting': 1,
			'ui_cursor': true,

			'connection_id': null,

			'profile_name': null 
		};
	},

	/**
	* Получает настройку.
	* @param {string} key ключ настройки
	*
	* @return {any} Значение настройки.
	*/
	get: function(key){
		return this.options[key];
	},

	/**
	* Получает настройки определенной группы.
	* Группа входит в ключ настройки: `group_whatever`.
	* @param {string} group название группы
	*
	* @return {object} Возвращает объект со значениями настроек по ключу настроек без группы.
	*                  `group_whatever` -> `whatever`
	*/
	getGroup: function(group){
		var options = {};
		var regex = new RegExp('^' + group + '_');
		for(var key in this.options){
			if(this.options.hasOwnProperty(key) && key.match(regex)){
				options[key.replace(regex, '')] = this.options[key];
			}			
		}
		return options;
	},

	/**
	* Устанавливает значение настройки.
	* @param {string} key   ключ настройки
	* @param {any}    value значение настройки
	*/
	set: function(key, value){
		this.options[key] = value;
	},

	/**
	* Устанавливает настройки группы, прибавляя название группы к ключу настройки.
	* `group_whatever`
	* @param {string} group   название группы
	* @param {object} options настройки по ключам без названия группы
	*/
	setGroup: function(group, options){
		for(var key in options){
			if(options.hasOwnProperty(key)){
				this.options[group + '_' + key] = options[key];
			}			
		}
	},

	/**
	* Сохраняет настройки из {@link OptionManager#options|options} в `localStorage` браузера.  
	* Необходимо использовать этот метод, чтобы измененные настройки сохранились после перезагрузки страницы.
	*/
	save: function(){
		var options;
		try{
			options = JSON.stringify(this.options);
		}
		catch(e){
			console.error('OptionManager: ', e);
		}
		if(options){
			localStorage.setItem(this.localStorageKey, options);
		}
	},

	/**
	* Загружает настройки из `localStorage` браузера.  
	* Догружает недостающие настройки из {@link OptionManager#defaults|defaults}.
	* @return {object} Загруженные настройки.
	*/
	load: function(){
		var options = localStorage.getItem(this.localStorageKey);
		try{
			options = JSON.parse(options);
		}
		catch(e){
			console.error('OptionManager: ', e);
		}
		if(!options || typeof options != 'object'){
			options = {};
		}
		for(var key in this.defaults){
			if(this.defaults.hasOwnProperty(key) && options[key] === undefined){
				options[key] = this.defaults[key];
			}
		}
		return options;
	},


	// Восстановление из localStorage

	/**
	* Восстанавливает настройку на ту, которая в данный момент находятся в `localStorage`.
	* @param {string} key ключ настройки
	*
	* @return {any} Значение настройки в `localStorage`.
	*/
	restore: function(key, restoredOptions){
		if(!restoredOptions){
			restoredOptions = this.load();
		}
		return (this.options[key] = restoredOptions[key]);
	},

	/**
	* Восстанавливает все настройки определенной группы на те, которые в данный момент находятся в `localStorage`.  
	* Группа входит в ключ настройки: `group_whatever`.
	* @param {string} group название группы
	*
	* @return {object} Возвращает объект со значениями настроек из `localStorage` по ключу настроек без группы.
	*                  `group_whatever` -> `whatever`
	*/
	restoreGroup: function(group){
		var restoredOptions = this.load();
		var options = {};
		var regex = new RegExp('^' + group + '_');
		for(var key in this.options){
			if(this.options.hasOwnProperty(key) && key.match(regex)){
				options[key.replace(regex, '')] = this.restore(key, restoredOptions);
			}
		}
		return options;
	},

	/**
	* Восстанавливает все настройки на те, которые в данный момент находятся в `localStorage`.
	*/
	restoreAll: function(){
		var restoredOptions = this.load();
		for(var key in this.options){
			if(this.options.hasOwnProperty(key)){
				this.restore(key, restoredOptions);
			}
		}
	},


	// Восстановление по умолчанию

	/**
	* Восстанавливает настройку по умолчанию
	* @param {string} key ключ настройки
	*
	* @return {any} Значение настройки по умолчанию.
	*/
	restoreDefault: function(key){
		return (this.options[key] = this.defaults[key]);
	},

	/**
	* Восстанавливает все настройки определенной группы по умолчанию.  
	* Группа входит в ключ настройки: `group_whatever`.
	* @param {string} group название группы
	*
	* @return {object} Возвращает объект со значениями настроек по умолчанию по ключу настроек без группы.
	*                  `group_whatever` -> `whatever`
	*/
	restoreGroupDefaults: function(group){
		var options = {};
		var regex = new RegExp('^' + group + '_');
		for(var key in this.options){
			if(this.options.hasOwnProperty(key) && key.match(regex)){
				options[key.replace(regex, '')] = this.restoreDefault(key);
			}
		}
		return options;
	},

	/**
	* Восстанавливает все настройки по умолчанию.
	*/
	restoreAllDefaults: function(){
		for(var key in this.options){
			if(this.options.hasOwnProperty(key)){
				this.restoreDefault(key);
			}
		}
	}
};
