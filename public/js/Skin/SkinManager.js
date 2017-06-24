/**
* Модуль, управляющий внешним видом карт
* @param {string} skinToSet скин с этим именем будет установлен после его добавления
* @class
*/

var SkinManager = function(skinToSet){

	/**
	 * Добавленные скины.
	 * @type {Object}
	 */
	this.skins = {};

	/**
	 * Текущий скин. Далее указаны свойства, которые полезны за пределами этого модуля.
	 * @type {Object}
	 * @prop {string} name название скина
	 * @prop {number} width ширина карты
	 * @prop {number} height высота карты
	 * @prop {number} scale масштаб карты
	 * @prop {number} firstValueFrame кадр, с которого начинаются карты со значениями
	 * @prop {number} cardbackFrame кадр рубашки карт
	 * @prop {number} trumpOffset сдвиг для отображения масти карты 
	 * @prop {number} color цвет, соответствующий скину
	 * 
	 * @prop {boolean} hasSuits есть ли графика отображения козырной масти
	 * 
	 * @prop {string} sheetName имя текстуры карт
	 * @prop {string} glowSheetName имя текстуры свечения карт
	 * @prop {string} trailName имя текстуры хвоста карт
	 * @prop {string} suitsName имя текстуры отображения козырной масти
	 */
	this.skin = null;

	/**
	 * Скин с этим именем будет установлен после его добавления.
	 * @type {string}
	 */
	this.skinToSet = skinToSet || null;
};

/**
* Добавляет скины из массива.
* @param {array} skins массив скинов
*/
SkinManager.prototype.addSkins = function(skins){
	for(var i = 0; i < skins.length; i++){
		this.addSkin(skins[i]);
	}
};

/**
* Добавляет скин, загружает графику.
* @param {object} options опции скина
* 
* @param {string} options.name имя скина, должно соотвтествтовать папке с графикой скина в `assets/skins/`  
*                              под этим именем скин будет сохранен в {@link SkinManager#skins} 
*                              и это имя нужно использовать для установки скина  
*                              графика карт - `cards.png`  
*                              графика свечения карт - `glow.png`  
*                      		   графика хвоста карт - `trails.png`  
*                      		   графика отображения козырной масти - `suits.png`  
*                      		   
* @param {number} options.width реальная ширина карты (и ширина кадра графики карты)
* @param {number} options.height реальная высота карты (и высота кадра графики карты)
* 
* @param {number} options.glowWidth реальная ширина свечения карты (и ширина кадра графики свечения)
* @param {number} options.glowHeight реальная высота свечения карты (и высота кадра графики свечения)
* 
* @param {number} options.trailWidth ширина хвоста карты (и ширина кадра графики хвоста)
* @param {number} options.trailHeight высота хвоста карты (и высота кадра графики хвоста)
* 
* @param {number} [options.scale=1] масштаб скина
*                      		               
* @param {number} [options.numOfFrames=53] количество кадров в графике карты
* @param {number} [options.firstValueFrame=0] кадр графики карт, с которого начинаются карты со значениями
* 
* @param {number[]} [options.cardbackPossibleFrames=<52>] возможные кадры рубашки карт из графики карт
* @param {number} [options.cardbackFrame=cardbackPossibleFrames<0>] текущий кадр рубашки карт
* 
* @param {number} [options.trumpOffset=0] сдвиг для отображения масти карты 
* 
* @param {boolean} [options.hasSuits=true] есть ли графика отображения козырной масти
* @param {string} [options.background='blue'] какой фон соответствует этому скину
* @param {number} [options.color=ui.colors.lightBlue] цвет, соответствующий скину
*/
SkinManager.prototype.addSkin = function(options){
	var skin = {};

	if(!options || !options.name){
		return;
	}

	skin.background 	 = options.background || 'blue';
	skin.color 			 = options.color || ui.colors.lightBlue;
 
	skin.frameWidth 	 = options.width || 0;
	skin.frameHeight 	 = options.height || 0;
 
	skin.scale 			 = options.scale || 1;
 
	skin.width 			 = skin.frameWidth*skin.scale;
	skin.height 		 = skin.frameHeight*skin.scale;
 
	skin.name 			 = options.name;
	skin.sheetName 		 = skin.name + 'Cards';
	skin.sheetPath 		 = 'assets/skins/' + options.name + '/cards.png';
 
	skin.numOfFrames 	 = options.numOfFrames || 53;
	skin.firstValueFrame = options.firstValueFrame || 0;
	skin.cardbackPossibleFrames = options.cardbackPossibleFrames || [52];
	skin.cardbackFrame 	 = options.cardbackFrame || skin.cardbackPossibleFrames[0];
 
	skin.trumpOffset 	 = options.trumpOffset || 0;
 
	skin.glowPath 		 = 'assets/skins/' + options.name + '/glow.png';
	skin.glowSheetName 	 = options.name + 'Glow';
	skin.glowRealWidth 	 = options.glowWidth || 0;
	skin.glowRealHeight  = options.glowHeight || 0;
	skin.glowWidth 		 = skin.glowRealWidth*skin.scale;
	skin.glowHeight 	 = skin.glowRealHeight*skin.scale;
 
	skin.trailWidth 	 = options.trailWidth || 0;
	skin.trailHeight 	 = options.trailHeight || 0;
	skin.trailPath 		 = 'assets/skins/' + options.name + '/trails.png';
	skin.trailName 		 = options.name + 'Trail';

	skin.hasSuits 		 = options.hasSuits === undefined ? true : options.hasSuits;
	skin.suitsPath 		 = 'assets/skins/' + options.name + '/suits.png';
	skin.suitsName 		 = options.name + 'Suits';

	skin.loaded = false;

	this.skins[skin.name] = skin;
	if(this.skinToSet == skin.name){
		this.skin = skin;
		this.skinToSet = null;
		this.loadSkin(skin.name, false);
	}
};

/**
* Загружает ассеты скина. 
* @param  {string} skinName название скина
* @param  {boolean} [apply] нужно ли применять скин после загрузки
*/
SkinManager.prototype.loadSkin = function(skinName, apply){
	var skin = this.skins[skinName];

	if(!skin || skin.loaded){
		return;
	}

	skin.loaded = true;

	game.load.spritesheet(
		skin.sheetName, 
		skin.sheetPath, 
		skin.frameWidth, 
		skin.frameHeight, 
		skin.numOfFrames
	);
	game.load.image(skin.glowSheetName, skin.glowPath);
	game.load.spritesheet(
		skin.trailName,
		skin.trailPath,
		skin.trailWidth,
		skin.trailHeight, 
		4
	);
	if(skin.hasSuits){
		game.load.spritesheet(
			skin.suitsName,
			skin.suitsPath,
			skin.frameWidth,
			skin.frameHeight, 
			4
		);
	}
	if(apply){
		game.load.onLoadComplete.addOnce(this.applySkin, this);
	}
	game.load.start();
};

/**
* Устанавливает скин.
* @param {string} skinName название скина
*/
SkinManager.prototype.setSkin = function(skinName){
	if(!this.skins[skinName]){
		return;
	}
	if(this.skinToSet){
		this.skinToSet = null;
	}
	this.skin = this.skins[skinName];
	if(!this.skin.loaded){
		this.loadSkin(skinName, true);
	}
	else{
		this.applySkin();
	}
};

/** Применяет текущий установленный {@link SkinManager#skin} скин. */
SkinManager.prototype.applySkin = function(){
	if(!game.initialized){
		return;
	}
	cardManager.applySkin();
	cardEmitter.applySkin();
	cardControl.trailApplySkin();
	grid.draw();
	fieldManager.applySkin();
	actionHandler.highlightPossibleActions();
	background.setTexture(this.skin.background);
};

/**
* Устанавливает рубашку карт.
* @param {number} i индекс рубашки в `cardbackPossibleFrames` текущего скина
*/
SkinManager.prototype.setCardback = function(i){
	if(isNaN(i) || i >= this.skin.cardbackPossibleFrames.length || i < 0){
		console.log('SkinManager: Invalid cardback index');
		return;
	}
	this.skin.cardbackFrame = this.skin.cardbackPossibleFrames[i];
	for(var ci in game.cards){
		if(game.cards.hasOwnProperty(ci)){
			game.cards[ci].applyCardback();
		}
	}
};
